'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/database/client';
import { permissionService, type UserRole, type UserProfile, type PermissionType } from '@/infrastructure/auth/permission.service';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthWithRolesReturn extends AuthState {
  // Auth methods
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // Role checking methods
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isAuthenticated: () => boolean;

  // Permission checking
  hasPermission: (permission: PermissionType) => Promise<boolean>;
  checkPermission: (permission: PermissionType) => boolean; // Sync version using cached permissions

  // Cached permissions
  permissions: PermissionType[];
}

export function useAuthWithRoles(): UseAuthWithRolesReturn {
  const router = useRouter();
  const supabase = createClient();

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  const [permissions, setPermissions] = useState<PermissionType[]>([]);

  // Load user and profile
  useEffect(() => {
    const loadAuth = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (user) {
          // Get user profile
          const profile = await permissionService.getCurrentUserProfile();

          // Get user permissions
          const userPermissions = await permissionService.getUserPermissions();
          const permissionTypes = userPermissions.map(p => p.permission_type);

          setState({
            user,
            profile,
            loading: false,
            error: null
          });

          setPermissions(permissionTypes);
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
          setPermissions([]);
        }
      } catch (error) {
        console.error('Auth loading error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load auth'
        }));
      }
    };

    loadAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await permissionService.getCurrentUserProfile();
          const userPermissions = await permissionService.getUserPermissions();

          setState({
            user: session.user,
            profile,
            loading: false,
            error: null
          });

          setPermissions(userPermissions.map(p => p.permission_type));
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
          setPermissions([]);
          router.push('/');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Refresh profile on token refresh
          const profile = await permissionService.getCurrentUserProfile();
          setState(prev => ({ ...prev, profile }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Sign out
  const signOut = async () => {
    try {
      // Log the activity before signing out
      await permissionService.logActivity('logout');

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // State will be updated by onAuthStateChange listener
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sign out'
      }));
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (session?.user) {
        const profile = await permissionService.getCurrentUserProfile();
        const userPermissions = await permissionService.getUserPermissions();

        setState({
          user: session.user,
          profile,
          loading: false,
          error: null
        });

        setPermissions(userPermissions.map(p => p.permission_type));
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh session'
      }));
    }
  };

  // Role checking methods
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!state.profile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(state.profile.role);
  };

  const isAdmin = (): boolean => hasRole('admin');

  const isManager = (): boolean => hasRole(['admin', 'manager']);

  const isAuthenticated = (): boolean => !!state.user;

  // Permission checking - async version (checks database)
  const hasPermission = async (permission: PermissionType): Promise<boolean> => {
    if (!state.user) return false;

    // Admin has all permissions
    if (isAdmin()) return true;

    // Check database
    return permissionService.hasPermission(permission);
  };

  // Permission checking - sync version (uses cached permissions)
  const checkPermission = (permission: PermissionType): boolean => {
    // Admin has all permissions
    if (isAdmin()) return true;

    // Check cached permissions
    return permissions.includes(permission);
  };

  return {
    ...state,
    signOut,
    refreshSession,
    hasRole,
    isAdmin,
    isManager,
    isAuthenticated,
    hasPermission,
    checkPermission,
    permissions
  };
}