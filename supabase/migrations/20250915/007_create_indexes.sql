-- Create indexes for performance optimization

-- API call logs indexes
CREATE INDEX IF NOT EXISTS idx_api_call_logs_session_id 
  ON trademark_analysis.api_call_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_stage 
  ON trademark_analysis.api_call_logs(stage);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_api_type 
  ON trademark_analysis.api_call_logs(api_type);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_timestamp 
  ON trademark_analysis.api_call_logs(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_session_stage 
  ON trademark_analysis.api_call_logs(session_id, stage);

-- Data processing logs indexes
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_session_id 
  ON trademark_analysis.data_processing_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_process_type 
  ON trademark_analysis.data_processing_logs(process_type);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_timestamp 
  ON trademark_analysis.data_processing_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_session_stage 
  ON trademark_analysis.data_processing_logs(session_id, stage);

-- Debug comments indexes
CREATE INDEX IF NOT EXISTS idx_debug_comments_session_id 
  ON debug_management.debug_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_debug_comments_element_id 
  ON debug_management.debug_comments(element_id);
CREATE INDEX IF NOT EXISTS idx_debug_comments_thread_id 
  ON debug_management.debug_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_debug_comments_user_id 
  ON debug_management.debug_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_debug_comments_is_resolved 
  ON debug_management.debug_comments(is_resolved) 
  WHERE is_resolved = FALSE;

-- Feedback board indexes
CREATE INDEX IF NOT EXISTS idx_feedback_board_status 
  ON debug_management.debug_feedback_board(status);
CREATE INDEX IF NOT EXISTS idx_feedback_board_priority 
  ON debug_management.debug_feedback_board(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_board_assigned 
  ON debug_management.debug_feedback_board(assigned_to);
CREATE INDEX IF NOT EXISTS idx_feedback_board_created_by 
  ON debug_management.debug_feedback_board(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_board_category 
  ON debug_management.debug_feedback_board(category);
CREATE INDEX IF NOT EXISTS idx_feedback_board_status_priority 
  ON debug_management.debug_feedback_board(status, priority) 
  WHERE status IN ('open', 'in_progress');

-- GIN index for JSONB columns for better query performance
CREATE INDEX IF NOT EXISTS idx_api_call_logs_request_data_gin 
  ON trademark_analysis.api_call_logs USING GIN (request_data);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_response_data_gin 
  ON trademark_analysis.api_call_logs USING GIN (response_data);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_details_gin 
  ON trademark_analysis.data_processing_logs USING GIN (processing_details);