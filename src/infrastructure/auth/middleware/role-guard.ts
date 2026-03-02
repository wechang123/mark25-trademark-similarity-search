import { createClient } from "@/infrastructure/database/server";
import { NextResponse } from "next/server";
import {
  PermissionService,
  type UserRole,
  type PermissionType,
} from "../permission.service";

export interface RoleCheckOptions {
  allowedRoles?: UserRole[];
  permissions?: PermissionType[];
  requireAuth?: boolean;
  logActivity?: boolean;
  action?: string;
}

interface RoleCheckResult {
  success: boolean;
  error?: NextResponse;
  userId?: string;
  userRole?: UserRole;
}

/**
 * Check user role and permissions for API route protection
 */
export async function checkRole(
  options: RoleCheckOptions = {}
): Promise<RoleCheckResult> {
  const {
    allowedRoles = [],
    permissions = [],
    requireAuth = true,
    logActivity = false,
    action = "api_access",
  } = options;

  try {
    const supabase = await createClient();

    // 1. Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      if (requireAuth) {
        return {
          success: false,
          error: NextResponse.json(
            { error: "인증이 필요합니다", code: "UNAUTHORIZED" },
            { status: 401 }
          ),
        };
      }
      return { success: true };
    }

    // 2. Get user profile with role
    const permissionService = new PermissionService();
    console.log("[RoleGuard] Getting profile for user:", user.id);
    const profile = await permissionService.getCurrentUserProfile();

    if (!profile) {
      console.error("[RoleGuard] Profile not found for user:", user.id);
      return {
        success: false,
        error: NextResponse.json(
          {
            error: "사용자 프로필을 찾을 수 없습니다",
            code: "PROFILE_NOT_FOUND",
          },
          { status: 404 }
        ),
      };
    }

    // 3. Check role requirements
    if (allowedRoles.length > 0) {
      if (!allowedRoles.includes(profile.role)) {
        // Log failed access attempt
        if (logActivity) {
          await permissionService.logActivity(
            `unauthorized_${action}_attempt`,
            JSON.stringify({
              required_roles: allowedRoles,
              user_role: profile.role,
              timestamp: new Date().toISOString(),
            })
          );
        }

        return {
          success: false,
          error: NextResponse.json(
            {
              error: "권한이 없습니다",
              code: "FORBIDDEN",
              requiredRoles: allowedRoles,
            },
            { status: 403 }
          ),
        };
      }
    }

    // 4. Check specific permissions
    if (permissions.length > 0) {
      const hasAllPermissions = await Promise.all(
        permissions.map((permission) =>
          permissionService.hasPermission(permission)
        )
      );

      if (!hasAllPermissions.every(Boolean)) {
        // Log failed permission check
        if (logActivity) {
          await permissionService.logActivity(
            `unauthorized_permission_attempt`,
            JSON.stringify({
              required_permissions: permissions,
              user_role: profile.role,
              timestamp: new Date().toISOString(),
            })
          );
        }

        return {
          success: false,
          error: NextResponse.json(
            {
              error: "필요한 권한이 없습니다",
              code: "INSUFFICIENT_PERMISSIONS",
              requiredPermissions: permissions,
            },
            { status: 403 }
          ),
        };
      }
    }

    // 5. Log successful activity (optional)
    if (logActivity) {
      await permissionService.logActivity(
        action,
        JSON.stringify({
          role: profile.role,
          timestamp: new Date().toISOString(),
        })
      );
    }

    return {
      success: true,
      userId: user.id,
      userRole: profile.role,
    };
  } catch (error) {
    console.error("Role check error:", error);
    return {
      success: false,
      error: NextResponse.json(
        {
          error: "권한 확인 중 오류가 발생했습니다",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Middleware helper functions for common role checks
 */

// Require admin role
export async function requireAdmin(logActivity: boolean = true) {
  const result = await checkRole({
    allowedRoles: ["admin"],
    requireAuth: true,
    logActivity,
    action: "admin_access",
  });

  return result.success ? null : result.error;
}

// Require admin or manager role
export async function requireManager(logActivity: boolean = true) {
  const result = await checkRole({
    allowedRoles: ["admin", "manager"],
    requireAuth: true,
    logActivity,
    action: "manager_access",
  });

  return result.success ? null : result.error;
}

// Require authenticated user (any role)
export async function requireAuth() {
  const result = await checkRole({
    requireAuth: true,
    logActivity: false,
    action: "authenticated_access",
  });

  return result.success ? null : result.error;
}

// Check specific permission
export async function requirePermission(
  permission: PermissionType,
  logActivity: boolean = false
) {
  const result = await checkRole({
    permissions: [permission],
    requireAuth: true,
    logActivity,
    action: `permission_${permission}`,
  });

  return result.success ? null : result.error;
}

// Check multiple permissions
export async function requirePermissions(
  permissions: PermissionType[],
  logActivity: boolean = false
) {
  const result = await checkRole({
    permissions,
    requireAuth: true,
    logActivity,
    action: `permissions_check`,
  });

  return result.success ? null : result.error;
}

/**
 * Get current user's role and permissions
 * Useful for conditional logic in API routes
 */
export async function getCurrentUserRole(): Promise<{
  role: UserRole | null;
  permissions: PermissionType[];
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { role: null, permissions: [] };
    }

    const permissionService = new PermissionService();
    const profile = await permissionService.getCurrentUserProfile();
    if (!profile) {
      return { role: null, permissions: [] };
    }

    const permissions = await permissionService.getUserPermissions();
    const permissionTypes = permissions.map((p) => p.permission_type);

    return {
      role: profile.role,
      permissions: permissionTypes,
    };
  } catch (error) {
    console.error("Error getting current user role:", error);
    return { role: null, permissions: [] };
  }
}
