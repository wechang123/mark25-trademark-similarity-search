import { UserRole, PermissionType } from './admin.types';

export interface PermissionCheck {
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: PermissionType) => boolean;
  hasAnyPermission: (permissions: PermissionType[]) => boolean;
  hasAllPermissions: (permissions: PermissionType[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isUser: () => boolean;
}

export interface RolePermissionMap {
  [UserRole.ADMIN]: PermissionType[];
  [UserRole.MANAGER]: PermissionType[];
  [UserRole.USER]: PermissionType[];
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMap = {
  [UserRole.ADMIN]: [
    PermissionType.USER_MANAGEMENT,
    PermissionType.CONTENT_MANAGEMENT,
    PermissionType.ANALYTICS_VIEW,
    PermissionType.SYSTEM_CONFIG
  ],
  [UserRole.MANAGER]: [
    PermissionType.ANALYTICS_VIEW,
    PermissionType.CONTENT_MANAGEMENT
  ],
  [UserRole.USER]: []
};

export interface PermissionError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'EXPIRED_PERMISSION';
  message: string;
  requiredRole?: UserRole;
  requiredPermissions?: PermissionType[];
}