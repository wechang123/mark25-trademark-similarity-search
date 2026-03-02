-- =====================================================
-- Auth Schema Reorganization Migration
-- Date: 2025-01-13
-- Description: Move all auth-related tables to user_management schema
-- =====================================================

-- =====================================================
-- PHASE 1: Clean up existing public schema tables
-- =====================================================

-- Drop existing functions that depend on public schema tables
DROP FUNCTION IF EXISTS public.log_admin_activity CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission CASCADE;

-- Drop existing tables in public schema
DROP TABLE IF EXISTS public.admin_activity_logs CASCADE;
DROP TABLE IF EXISTS public.admin_permissions CASCADE;

-- =====================================================
-- PHASE 2: Ensure user_management schema exists
-- =====================================================

CREATE SCHEMA IF NOT EXISTS user_management;

-- =====================================================
-- PHASE 3: Update profiles table constraint
-- =====================================================

-- Update any NULL values to 'user'
UPDATE user_management.profiles
SET role = 'user'
WHERE role IS NULL;

-- Drop existing constraint if exists and add new one
ALTER TABLE user_management.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE user_management.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'manager', 'user'));

-- =====================================================
-- PHASE 4: Create auth tables in user_management schema
-- =====================================================

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS user_management.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Ensure permission types are valid
  CONSTRAINT valid_permission_type CHECK (
    permission_type IN (
      'user_management',      -- Can manage user accounts and roles
      'content_management',   -- Can manage trademark data and analyses
      'analytics_view',       -- Can view analytics and reports
      'system_config',       -- Can modify system settings
      'full_access'          -- Super admin with all permissions
    )
  ),

  -- Ensure expiry date is in the future when set
  CONSTRAINT valid_expiry CHECK (
    expires_at IS NULL OR expires_at > granted_at
  )
);

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS user_management.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure action types are tracked
  CONSTRAINT valid_action CHECK (
    action IN (
      'create', 'read', 'update', 'delete',
      'grant_permission', 'revoke_permission',
      'login', 'logout', 'export_data',
      'bulk_operation', 'system_config_change'
    )
  )
);

-- =====================================================
-- PHASE 5: Create Indexes
-- =====================================================

-- Indexes for admin_permissions table
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id
  ON user_management.admin_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_type
  ON user_management.admin_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_active
  ON user_management.admin_permissions(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_permissions_expires
  ON user_management.admin_permissions(expires_at)
  WHERE expires_at IS NOT NULL;

-- Indexes for admin_activity_logs table
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user_id
  ON user_management.admin_activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at
  ON user_management.admin_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action
  ON user_management.admin_activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target
  ON user_management.admin_activity_logs(target_table, target_id)
  WHERE target_table IS NOT NULL;

-- =====================================================
-- PHASE 6: Enable Row Level Security
-- =====================================================

ALTER TABLE user_management.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_management.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 7: Create RLS Policies
-- =====================================================

-- Policies for admin_permissions table
CREATE POLICY "Admin can manage all permissions"
  ON user_management.admin_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own permissions"
  ON user_management.admin_permissions
  FOR SELECT
  USING (
    user_id = auth.uid() AND is_active = true
  );

-- Policies for admin_activity_logs table
CREATE POLICY "Admin and manager can view all logs"
  ON user_management.admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "System can insert activity logs"
  ON user_management.admin_activity_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own activity logs"
  ON user_management.admin_activity_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- =====================================================
-- PHASE 8: Update RLS Policies for Existing Tables
-- =====================================================

-- Update policies for analysis_sessions table
DROP POLICY IF EXISTS "Users can view their own analysis sessions" ON public.analysis_sessions;
DROP POLICY IF EXISTS "Admin can manage all analysis sessions" ON public.analysis_sessions;

CREATE POLICY "Users can view their own analysis sessions"
  ON public.analysis_sessions
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can manage all analysis sessions"
  ON public.analysis_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Update policies for trademark_application table
DROP POLICY IF EXISTS "Users can view their own applications" ON public.trademark_application;
DROP POLICY IF EXISTS "Admin can manage all applications" ON public.trademark_application;

CREATE POLICY "Users can view their own applications"
  ON public.trademark_application
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can manage all applications"
  ON public.trademark_application
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Update policies for final_results table
DROP POLICY IF EXISTS "Users can view their own results" ON public.final_results;

CREATE POLICY "Users can view their own results"
  ON public.final_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.analysis_sessions
      WHERE analysis_sessions.id = final_results.session_id
      AND (
        analysis_sessions.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_management.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
      )
    )
  );

-- =====================================================
-- PHASE 9: Create Helper Functions in user_management schema
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_management.user_has_permission(
  permission_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin always has all permissions
  IF EXISTS (
    SELECT 1 FROM user_management.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check specific permissions
  RETURN EXISTS (
    SELECT 1 FROM user_management.admin_permissions
    WHERE user_id = auth.uid()
    AND permission_type = permission_name
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION user_management.log_admin_activity(
  p_action TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role
  FROM user_management.profiles
  WHERE id = auth.uid();

  -- Insert log entry
  INSERT INTO user_management.admin_activity_logs (
    user_id,
    user_role,
    action,
    target_table,
    target_id,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    COALESCE(v_user_role, 'unknown'),
    p_action,
    p_target_table,
    p_target_id,
    p_metadata,
    NULLIF(current_setting('request.headers', true)::json->>'x-forwarded-for', '')::inet,
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create wrapper functions in public schema for backward compatibility
CREATE OR REPLACE FUNCTION public.user_has_permission(
  permission_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_management.user_has_permission(permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
  RETURN user_management.log_admin_activity(p_action, p_target_table, p_target_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 10: Grant Permissions
-- =====================================================

-- Grant usage on user_management schema
GRANT USAGE ON SCHEMA user_management TO authenticated;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION user_management.user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION user_management.log_admin_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_activity TO authenticated;

-- Grant table permissions
GRANT SELECT ON user_management.admin_permissions TO authenticated;
GRANT SELECT ON user_management.admin_activity_logs TO authenticated;

-- =====================================================
-- PHASE 11: Add Comments
-- =====================================================

COMMENT ON SCHEMA user_management IS 'Schema for user authentication, authorization, and management';
COMMENT ON TABLE user_management.admin_permissions IS 'Stores granular permissions for admin and manager users';
COMMENT ON TABLE user_management.admin_activity_logs IS 'Audit trail for all administrative actions';
COMMENT ON FUNCTION user_management.user_has_permission IS 'Check if current user has a specific permission';
COMMENT ON FUNCTION user_management.log_admin_activity IS 'Log an administrative action to the audit trail';

-- =====================================================
-- PHASE 12: Create Views in public schema for backward compatibility
-- =====================================================

-- Create view for easy access to user roles
CREATE OR REPLACE VIEW public.user_roles AS
SELECT
  p.id as user_id,
  p.email,
  p.name,
  p.role,
  p.created_at,
  p.updated_at,
  CASE
    WHEN p.role = 'admin' THEN true
    ELSE EXISTS (
      SELECT 1 FROM user_management.admin_permissions ap
      WHERE ap.user_id = p.id
      AND ap.is_active = true
      AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    )
  END as has_admin_permissions
FROM user_management.profiles p;

-- Grant access to the view
GRANT SELECT ON public.user_roles TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================