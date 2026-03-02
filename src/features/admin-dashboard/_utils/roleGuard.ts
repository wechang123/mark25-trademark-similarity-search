import { UserRole, PermissionType } from '../_types/admin.types';

interface GuardOptions {
  requiredRoles?: UserRole[];
  requiredPermissions?: PermissionType[];
  requireAll?: boolean; // For permissions: true = AND, false = OR
}

export function checkAccess(
  userRole: UserRole | null,
  userPermissions: PermissionType[],
  options: GuardOptions
): boolean {
  if (!userRole) return false;

  // Check role requirements
  if (options.requiredRoles && options.requiredRoles.length > 0) {
    if (!options.requiredRoles.includes(userRole)) {
      return false;
    }
  }

  // Admin bypasses all permission checks
  if (userRole === UserRole.ADMIN) return true;

  // Check permission requirements
  if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    if (options.requireAll) {
      // All permissions required
      return options.requiredPermissions.every(p => userPermissions.includes(p));
    } else {
      // Any permission sufficient
      return options.requiredPermissions.some(p => userPermissions.includes(p));
    }
  }

  return true;
}

export function getRedirectPath(userRole: UserRole | null): string {
  if (!userRole) return '/signin';

  switch (userRole) {
    case UserRole.ADMIN:
    case UserRole.MANAGER:
      return '/admin';
    case UserRole.USER:
    default:
      return '/dashboard';
  }
}

export function canAccessAdminDashboard(userRole: UserRole | null): boolean {
  if (!userRole) return false;
  return userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
}