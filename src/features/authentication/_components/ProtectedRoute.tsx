'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthWithRoles } from '../_hooks/useAuthWithRoles';
import type { UserRole, PermissionType } from '@/infrastructure/auth/permission.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: PermissionType;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  redirectTo = '/login',
  fallback = <LoadingSpinner />
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    user,
    profile,
    loading,
    hasRole,
    checkPermission
  } = useAuthWithRoles();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Check role requirement
      if (requiredRole && !hasRole(requiredRole)) {
        router.push('/unauthorized');
        return;
      }

      // Check permission requirement
      if (requiredPermission && !checkPermission(requiredPermission)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [
    loading,
    user,
    profile,
    requiredRole,
    requiredPermission,
    hasRole,
    checkPermission,
    router,
    redirectTo
  ]);

  // Show loading state
  if (loading) {
    return <>{fallback}</>;
  }

  // Not authenticated
  if (!user) {
    return <>{fallback}</>;
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return <UnauthorizedMessage />;
  }

  // Check permission
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <UnauthorizedMessage />;
  }

  // All checks passed
  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function UnauthorizedMessage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">권한이 없습니다</h1>
      <p className="text-muted-foreground mb-8">
        이 페이지에 접근할 권한이 없습니다.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}