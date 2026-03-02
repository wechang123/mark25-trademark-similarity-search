import { createClient } from '@/infrastructure/database/client';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'user';
export type PermissionType =
  | 'user_management'
  | 'content_management'
  | 'analytics_view'
  | 'system_config'
  | 'full_access';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  user_id: string;
  permission_type: PermissionType;
  granted_at: string;
  granted_by: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export class PermissionService {
  private async getSupabase(): Promise<SupabaseClient> {
    // 클라이언트 환경
    if (typeof window !== 'undefined') {
      return createClient();
    }
    
    // 서버 환경 - 매번 새로운 클라이언트 생성 (쿠키 컨텍스트 때문)
    const { createClient: createServerClient } = await import('@/infrastructure/database/server');
    return await createServerClient();
  }

  /**
   * Get current user's profile with role
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const supabase = await this.getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[PermissionService] Auth user:', user?.id, 'Error:', authError);
    if (!user) return null;

    // Get role from app_metadata
    const userRole = (user.app_metadata?.role as UserRole) || 'user';

    const { data, error } = await supabase
      .schema('user_management')
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('[PermissionService] Profile query result:', { data, error, userRole });
    if (error || !data) return null;

    return {
      id: data.id!,
      email: data.email!,
      name: data.name,
      role: userRole,
      avatar_url: data.avatar_url,
      created_at: data.created_at!,
      updated_at: data.updated_at!
    };
  }

  /**
   * Check if current user has a specific role
   */
  async hasRole(role: UserRole | UserRole[]): Promise<boolean> {
    const profile = await this.getCurrentUserProfile();
    if (!profile) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(profile.role);
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  /**
   * Check if current user is manager or admin
   */
  async isManager(): Promise<boolean> {
    return this.hasRole(['admin', 'manager']);
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permissionType: PermissionType): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check using the database function
    const { data, error } = await supabase
      .rpc('user_has_permission', { permission_name: permissionType });

    return !error && data === true;
  }

  /**
   * Get user's active permissions
   */
  async getUserPermissions(userId?: string): Promise<AdminPermission[]> {
    const supabase = await this.getSupabase();
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    // Admin can view all permissions, users can only view their own
    const { data, error } = await supabase
      .schema('user_management')
      .from('admin_permissions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error || !data) return [];

    return data.map(p => ({
      id: p.id,
      user_id: p.user_id,
      permission_type: p.permission_type as PermissionType,
      granted_at: p.granted_at,
      granted_by: p.granted_by,
      expires_at: p.expires_at,
      is_active: p.is_active
    }));
  }

  /**
   * Grant permission to user (Admin only)
   */
  async grantPermission(
    userId: string,
    permissionType: PermissionType,
    expiresAt?: Date
  ): Promise<{ success: boolean; error?: string }> {
    const isAdmin = await this.isAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const supabase = await this.getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .schema('user_management')
      .from('admin_permissions')
      .insert({
        user_id: userId,
        permission_type: permissionType,
        granted_by: user.id,
        expires_at: expiresAt?.toISOString() || null,
        is_active: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the activity
    await this.logActivity('grant_permission', 'admin_permissions', userId, {
      permission_type: permissionType,
      expires_at: expiresAt?.toISOString()
    });

    return { success: true };
  }

  /**
   * Revoke permission from user (Admin only)
   */
  async revokePermission(
    permissionId: string
  ): Promise<{ success: boolean; error?: string }> {
    const isAdmin = await this.isAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const supabase = await this.getSupabase();
    const { error } = await supabase
      .schema('user_management')
      .from('admin_permissions')
      .update({ is_active: false })
      .eq('id', permissionId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the activity
    await this.logActivity('revoke_permission', 'admin_permissions', permissionId);

    return { success: true };
  }

  /**
   * Log admin activity
   */
  async logActivity(
    action: string,
    targetTable?: string,
    targetId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      await supabase.rpc('log_admin_activity', {
        p_action: action,
        p_target_table: targetTable || null,
        p_target_id: targetId || null,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get activity logs (Admin/Manager only)
   */
  async getActivityLogs(
    filters?: {
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<any[]> {
    const isManager = await this.isManager();
    if (!isManager) return [];

    const supabase = await this.getSupabase();
    let query = supabase
      .schema('user_management')
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    return data;
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    const isAdmin = await this.isAdmin();
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const supabase = await this.getSupabase();
    const { error } = await supabase
      .schema('user_management')
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the activity
    await this.logActivity('update', 'profiles', userId, {
      field: 'role',
      new_value: newRole
    });

    return { success: true };
  }
}

// Export singleton instance
export const permissionService = new PermissionService();