'use client';

import { useAuthContext } from '@/features/authentication/_contexts/AuthContext';
import { PermissionCheck } from '../_types/permissions.types';
import { AdminUser } from '../_types/admin.types';

interface UseAdminAuthReturn extends PermissionCheck {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

/**
 * Custom hook for managing admin authentication and permissions
 * Now uses the unified AuthContext for consistency
 */
export function useAdminAuth(): UseAdminAuthReturn {
  const {
    adminUser,
    isLoading,
    error,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isUser,
    refreshUser
  } = useAuthContext();

  return {
    user: adminUser,
    loading: isLoading,
    error,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isUser,
    refreshPermissions: refreshUser
  };
}