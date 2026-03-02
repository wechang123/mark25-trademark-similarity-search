export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  provider: string;
  permissions?: AdminPermission[];
}

export interface AdminPermission {
  id: string;
  user_id: string;
  permission_type: PermissionType;
  granted_at: string;
  granted_by: string;
  expires_at: string | null;
  is_active: boolean;
}

export enum PermissionType {
  USER_MANAGEMENT = 'user_management',
  CONTENT_MANAGEMENT = 'content_management',
  ANALYTICS_VIEW = 'analytics_view',
  SYSTEM_CONFIG = 'system_config'
}

export interface AdminActivityLog {
  id: string;
  user_id: string;
  user_role: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  todayAnalysis: number;
  pendingRequests: number;
  completionRate: number;
  userGrowth: {
    date: string;
    count: number;
  }[];
  analysisChart: {
    date: string;
    count: number;
    status: 'completed' | 'pending' | 'failed';
  }[];
}

export interface MenuConfig {
  title: string;
  icon: any;
  href: string;
  requiredPermission?: PermissionType;
  readOnly?: boolean;
  subItems?: {
    title: string;
    href: string;
    requiredPermission?: PermissionType;
  }[];
}

export interface AdminRouteGuard {
  requiredRole: UserRole[];
  requiredPermissions?: PermissionType[];
  redirectTo?: string;
}