// Layout components
export { AppSidebar } from './_components/layout/AppSidebar';

// Dashboard components
export { StatsOverview } from './_components/dashboard/StatsOverview';
export { RecentActivities } from './_components/dashboard/RecentActivities';

// Hooks
export { useAdminAuth } from './_hooks/useAdminAuth';

// Services
export { adminService } from './_services/adminService';

// Types
export {
  UserRole,
  PermissionType,
  type AdminUser,
  type AdminPermission,
  type AdminActivityLog,
  type DashboardStats,
  type MenuConfig,
  type AdminRouteGuard
} from './_types/admin.types';

export {
  type PermissionCheck,
  type RolePermissionMap,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionError
} from './_types/permissions.types';

// Utils
export {
  checkAccess,
  getRedirectPath,
  canAccessAdminDashboard
} from './_utils/roleGuard';

export {
  logAdminActivity,
  formatActivityLog,
  filterActivityLogs
} from './_utils/permissionChecker';

export {
  SCHEMA_CONFIG,
  Tables,
  getTableWithSchema
} from './_utils/schemaConfig';