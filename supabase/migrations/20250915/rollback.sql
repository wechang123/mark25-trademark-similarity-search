-- Rollback script for debugging schema
-- Run this script if you need to completely remove the debugging infrastructure

-- Drop functions first (due to dependencies)
DROP FUNCTION IF EXISTS get_debug_session_stats(UUID);
DROP FUNCTION IF EXISTS calculate_api_cost(VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_debug_logs();
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop policies
DROP POLICY IF EXISTS "Admin only access" ON trademark_analysis.api_call_logs;
DROP POLICY IF EXISTS "Admin only access" ON trademark_analysis.data_processing_logs;
DROP POLICY IF EXISTS "Admin and Manager access" ON debug_management.debug_comments;
DROP POLICY IF EXISTS "Admin and Manager full access" ON debug_management.debug_feedback_board;
DROP POLICY IF EXISTS "Debug sessions visible to admin only" ON trademark_analysis.analysis_sessions;

-- Drop tables in debug_management schema
DROP TABLE IF EXISTS debug_management.debug_feedback_board CASCADE;
DROP TABLE IF EXISTS debug_management.debug_comments CASCADE;

-- Drop tables in trademark_analysis schema
DROP TABLE IF EXISTS trademark_analysis.data_processing_logs CASCADE;
DROP TABLE IF EXISTS trademark_analysis.api_call_logs CASCADE;

-- Drop schema
DROP SCHEMA IF EXISTS debug_management CASCADE;

-- Remove columns from existing tables
ALTER TABLE trademark_analysis.analysis_sessions 
  DROP COLUMN IF EXISTS is_debug_mode,
  DROP COLUMN IF EXISTS debug_user_id,
  DROP COLUMN IF EXISTS debug_notes;

ALTER TABLE trademark_analysis.langgraph_executions
  DROP COLUMN IF EXISTS is_debug_mode;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Debugging schema rollback completed successfully';
END $$;