-- Add debug flags to existing tables
ALTER TABLE trademark_analysis.analysis_sessions 
  ADD COLUMN IF NOT EXISTS is_debug_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS debug_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS debug_notes TEXT;

ALTER TABLE trademark_analysis.langgraph_executions
  ADD COLUMN IF NOT EXISTS is_debug_mode BOOLEAN DEFAULT FALSE;

-- Add comments for new columns
COMMENT ON COLUMN trademark_analysis.analysis_sessions.is_debug_mode IS 'Flag to indicate if this session is in debug mode';
COMMENT ON COLUMN trademark_analysis.analysis_sessions.debug_user_id IS 'Admin user who initiated the debug session';
COMMENT ON COLUMN trademark_analysis.analysis_sessions.debug_notes IS 'General notes about the debug session';
COMMENT ON COLUMN trademark_analysis.langgraph_executions.is_debug_mode IS 'Flag to indicate if this execution is in debug mode';