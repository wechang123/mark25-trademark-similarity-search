'use client';

import { useAuthWithRoles } from '../_hooks/useAuthWithRoles';
import type { UserRole, PermissionType } from '@/infrastructure/auth/permission.service';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole | UserRole[];
  permission?: PermissionType;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

/**
 * RoleGuard component
 * Conditionally renders children based on user roles/permissions
 * Unlike ProtectedRoute, it doesn't redirect, just hides/shows content
 */
export function RoleGuard({
  children,
  roles,
  permission,
  fallback = null,
  showMessage = false
}: RoleGuardProps) {
  const { hasRole, checkPermission, loading } = useAuthWithRoles();

  // Loading state
  if (loading) {
    return null;
  }

  // Check role requirement
  if (roles && !hasRole(roles)) {
    if (showMessage) {
      return <InsufficientPermissionsMessage />;
    }
    return <>{fallback}</>;
  }

  // Check permission requirement
  if (permission && !checkPermission(permission)) {
    if (showMessage) {
      return <InsufficientPermissionsMessage />;
    }
    return <>{fallback}</>;
  }

  // All checks passed
  return <>{children}</>;
}

/**
 * AdminOnly component
 * Convenience wrapper for admin-only content
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * ManagerOnly component
 * Convenience wrapper for manager-only content (includes admin)
 */
export function ManagerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard roles={['admin', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * PermissionOnly component
 * Convenience wrapper for permission-based content
 */
export function PermissionOnly({
  children,
  permission,
  fallback
}: {
  children: React.ReactNode;
  permission: PermissionType;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard permission={permission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

function InsufficientPermissionsMessage() {
  return (
    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
      <p className="text-sm text-yellow-800">
        이 콘텐츠를 보려면 추가 권한이 필요합니다.
      </p>
    </div>
  );
}