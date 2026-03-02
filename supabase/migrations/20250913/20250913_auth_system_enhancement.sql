-- =====================================================
-- Auth System Enhancement Migration
-- Date: 2025-01-13
-- Description: Implement role-based access control system
-- =====================================================

-- =====================================================
-- PHASE 1: Schema Modifications
-- =====================================================

-- 1. Add CHECK constraint to profiles.role column
-- First, update any NULL values to 'user'
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
-- PHASE 2: Create New Tables
-- =====================================================

-- 2. Create admin_permissions table for granular permission management
CREATE TABLE IF NOT EXISTS public.admin_permissions (
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

-- 3. Create admin_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
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
-- PHASE 3: Create Indexes for Performance
-- =====================================================

-- Indexes for admin_permissions table
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id
  ON public.admin_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_type
  ON public.admin_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_active
  ON public.admin_permissions(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_permissions_expires
  ON public.admin_permissions(expires_at)
  WHERE expires_at IS NOT NULL;

-- Indexes for admin_activity_logs table
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON public.admin_activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON public.admin_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action
  ON public.admin_activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_activity_logs_target
  ON public.admin_activity_logs(target_table, target_id)
  WHERE target_table IS NOT NULL;

-- =====================================================
-- PHASE 4: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 5: Create RLS Policies for New Tables
-- =====================================================

-- Policies for admin_permissions table
CREATE POLICY "Admin can manage all permissions"
  ON public.admin_permissions
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
  ON public.admin_permissions
  FOR SELECT
  USING (
    user_id = auth.uid() AND is_active = true
  );

-- Policies for admin_activity_logs table
CREATE POLICY "Admin and manager can view all logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "System can insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- =====================================================
-- PHASE 6: Update RLS Policies for Existing Tables
-- =====================================================

-- Drop and recreate policies for analysis_sessions with role support
DROP POLICY IF EXISTS "Users can view their own analysis sessions" ON public.analysis_sessions;

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
-- PHASE 7: Create Helper Functions
-- =====================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
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
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = auth.uid()
    AND permission_type = permission_name
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
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
  INSERT INTO public.admin_activity_logs (
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

-- =====================================================
-- PHASE 8: Grant Necessary Permissions
-- =====================================================

-- Grant usage on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_activity TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT SELECT ON public.admin_activity_logs TO authenticated;

-- =====================================================
-- PHASE 9: Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.admin_permissions IS 'Stores granular permissions for admin and manager users';
COMMENT ON TABLE public.admin_activity_logs IS 'Audit trail for all administrative actions';
COMMENT ON FUNCTION public.user_has_permission IS 'Check if current user has a specific permission';
COMMENT ON FUNCTION public.log_admin_activity IS 'Log an administrative action to the audit trail';

-- =====================================================
-- Migration Complete
-- =====================================================