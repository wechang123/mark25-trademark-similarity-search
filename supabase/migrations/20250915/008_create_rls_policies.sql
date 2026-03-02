-- Enable RLS and create policies

-- API call logs - Separated policies for INSERT and SELECT
ALTER TABLE trademark_analysis.api_call_logs ENABLE ROW LEVEL SECURITY;

-- Remove old policy
DROP POLICY IF EXISTS "Admin only access" ON trademark_analysis.api_call_logs;

-- INSERT: Allow all authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert" ON trademark_analysis.api_call_logs;
CREATE POLICY "Authenticated users can insert" ON trademark_analysis.api_call_logs
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- SELECT: Admin only
DROP POLICY IF EXISTS "Admin can select" ON trademark_analysis.api_call_logs;
CREATE POLICY "Admin can select" ON trademark_analysis.api_call_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- UPDATE: Admin only
DROP POLICY IF EXISTS "Admin can update" ON trademark_analysis.api_call_logs;
CREATE POLICY "Admin can update" ON trademark_analysis.api_call_logs
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Admin only
DROP POLICY IF EXISTS "Admin can delete" ON trademark_analysis.api_call_logs;
CREATE POLICY "Admin can delete" ON trademark_analysis.api_call_logs
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Data processing logs - Separated policies for INSERT and SELECT  
ALTER TABLE trademark_analysis.data_processing_logs ENABLE ROW LEVEL SECURITY;

-- Remove old policy
DROP POLICY IF EXISTS "Admin only access" ON trademark_analysis.data_processing_logs;

-- INSERT: Allow all authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert" ON trademark_analysis.data_processing_logs;
CREATE POLICY "Authenticated users can insert" ON trademark_analysis.data_processing_logs
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- SELECT: Admin only
DROP POLICY IF EXISTS "Admin can select" ON trademark_analysis.data_processing_logs;
CREATE POLICY "Admin can select" ON trademark_analysis.data_processing_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- UPDATE: Admin only
DROP POLICY IF EXISTS "Admin can update" ON trademark_analysis.data_processing_logs;
CREATE POLICY "Admin can update" ON trademark_analysis.data_processing_logs
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- DELETE: Admin only
DROP POLICY IF EXISTS "Admin can delete" ON trademark_analysis.data_processing_logs;
CREATE POLICY "Admin can delete" ON trademark_analysis.data_processing_logs
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Debug comments - Admin and Manager
ALTER TABLE debug_management.debug_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and Manager access" ON debug_management.debug_comments;
CREATE POLICY "Admin and Manager access" ON debug_management.debug_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Feedback board - Admin and Manager for full access
ALTER TABLE debug_management.debug_feedback_board ENABLE ROW LEVEL SECURITY;

-- Admin and Manager can do everything
DROP POLICY IF EXISTS "Admin and Manager full access" ON debug_management.debug_feedback_board;
CREATE POLICY "Admin and Manager full access" ON debug_management.debug_feedback_board
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Debug sessions filter for analysis_sessions table
-- Only show debug sessions to admin users
DROP POLICY IF EXISTS "Debug sessions visible to admin only" ON trademark_analysis.analysis_sessions;
CREATE POLICY "Debug sessions visible to admin only" ON trademark_analysis.analysis_sessions
  FOR SELECT USING (
    -- Non-debug sessions: visible to owner
    (is_debug_mode = FALSE AND user_id = auth.uid())
    OR
    -- Debug sessions: visible to admin only
    (is_debug_mode = TRUE AND EXISTS (
      SELECT 1 FROM user_management.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );