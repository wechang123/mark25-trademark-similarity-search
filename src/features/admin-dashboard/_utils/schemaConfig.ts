/**
 * Schema configuration for admin dashboard tables
 * Centralized configuration to easily manage schema references
 */

export const SCHEMA_CONFIG = {
  // User management schema tables
  USER_MANAGEMENT: {
    schema: 'user_management',
    tables: {
      PROFILES: 'profiles',
      ADMIN_PERMISSIONS: 'admin_permissions',
      ADMIN_ACTIVITY_LOGS: 'admin_activity_logs',
      AUTH_LOGS: 'auth_logs',
      SOCIAL_ACCOUNTS: 'social_accounts'
    }
  },
  // Public schema tables (business logic)
  PUBLIC: {
    schema: 'public',
    tables: {
      ANALYSIS_SESSIONS: 'analysis_sessions',
      TRADEMARK_SEARCHES: 'trademark_searches',
      TRADEMARK_APPLICATION: 'trademark_application'
    }
  }
} as const;

/**
 * Helper function to get table name
 * @param schema - Schema name
 * @param table - Table name
 * @returns Table name (schema should be specified via .schema() method in Supabase client)
 */
export function getTableWithSchema(schema: string, table: string): string {
  // Return just the table name
  // Schema should be specified using supabase.schema() method
  return table;
}

/**
 * Get table reference for Supabase queries
 * Returns appropriate format based on whether schema needs to be explicit
 */
export const Tables = {
  // User management tables
  // Note: Using user_management schema explicitly
  profiles: () => getTableWithSchema(
    SCHEMA_CONFIG.USER_MANAGEMENT.schema,
    SCHEMA_CONFIG.USER_MANAGEMENT.tables.PROFILES
  ),
  adminPermissions: () => getTableWithSchema(
    SCHEMA_CONFIG.USER_MANAGEMENT.schema,
    SCHEMA_CONFIG.USER_MANAGEMENT.tables.ADMIN_PERMISSIONS
  ),
  adminActivityLogs: () => getTableWithSchema(
    SCHEMA_CONFIG.USER_MANAGEMENT.schema,
    SCHEMA_CONFIG.USER_MANAGEMENT.tables.ADMIN_ACTIVITY_LOGS
  ),
  authLogs: () => getTableWithSchema(
    SCHEMA_CONFIG.USER_MANAGEMENT.schema,
    SCHEMA_CONFIG.USER_MANAGEMENT.tables.AUTH_LOGS
  ),

  // Public tables
  analysisSessions: () => getTableWithSchema(
    SCHEMA_CONFIG.PUBLIC.schema,
    SCHEMA_CONFIG.PUBLIC.tables.ANALYSIS_SESSIONS
  ),
  trademarkSearches: () => getTableWithSchema(
    SCHEMA_CONFIG.PUBLIC.schema,
    SCHEMA_CONFIG.PUBLIC.tables.TRADEMARK_SEARCHES
  ),
  trademarkApplication: () => getTableWithSchema(
    SCHEMA_CONFIG.PUBLIC.schema,
    SCHEMA_CONFIG.PUBLIC.tables.TRADEMARK_APPLICATION
  )
} as const;