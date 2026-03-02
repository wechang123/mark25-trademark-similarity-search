-- Create triggers and functions

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to debug comments table
DROP TRIGGER IF EXISTS update_debug_comments_updated_at ON debug_management.debug_comments;
CREATE TRIGGER update_debug_comments_updated_at 
  BEFORE UPDATE ON debug_management.debug_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to feedback board table
DROP TRIGGER IF EXISTS update_feedback_board_updated_at ON debug_management.debug_feedback_board;
CREATE TRIGGER update_feedback_board_updated_at 
  BEFORE UPDATE ON debug_management.debug_feedback_board
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Data retention function - DISABLED for permanent storage
-- All logs are kept permanently as requested
-- CREATE OR REPLACE FUNCTION cleanup_old_debug_logs()
-- RETURNS void AS $$
-- BEGIN
--   -- Delete old API call logs
--   DELETE FROM trademark_analysis.api_call_logs 
--   WHERE created_at < NOW() - INTERVAL '30 days';
--   
--   -- Delete old data processing logs
--   DELETE FROM trademark_analysis.data_processing_logs 
--   WHERE timestamp < NOW() - INTERVAL '30 days';
--   
--   -- Log the cleanup activity
--   RAISE NOTICE 'Cleaned up debug logs older than 30 days at %', NOW();
-- END;
-- $$ LANGUAGE plpgsql;

-- COMMENT: Cleanup function disabled - all logs are kept permanently for analysis

-- Function to calculate API costs based on token usage
CREATE OR REPLACE FUNCTION calculate_api_cost(
  p_api_type VARCHAR,
  p_tokens_used INTEGER
) RETURNS DECIMAL(10,4) AS $$
DECLARE
  v_cost DECIMAL(10,4);
BEGIN
  -- Cost calculation based on API type and token usage
  -- These are approximate costs, adjust as needed
  CASE p_api_type
    WHEN 'gemini' THEN
      -- Gemini Pro pricing (approximate)
      v_cost := (p_tokens_used / 1000.0) * 0.00025; -- $0.00025 per 1K tokens
    WHEN 'openai' THEN
      -- GPT-4 pricing (approximate)
      v_cost := (p_tokens_used / 1000.0) * 0.03; -- $0.03 per 1K tokens
    WHEN 'rag' THEN
      -- GCP Agent Builder pricing (approximate)
      v_cost := (p_tokens_used / 1000.0) * 0.0005; -- $0.0005 per 1K tokens
    WHEN 'kipris' THEN
      -- KIPRIS API is free or has fixed cost
      v_cost := 0.0;
    ELSE
      v_cost := 0.0;
  END CASE;
  
  RETURN v_cost;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_api_cost(VARCHAR, INTEGER) IS 'Calculate estimated API cost based on type and token usage';

-- Function to get debug session statistics
CREATE OR REPLACE FUNCTION get_debug_session_stats(p_session_id UUID)
RETURNS TABLE (
  total_api_calls INTEGER,
  total_tokens_used INTEGER,
  total_cost DECIMAL(10,4),
  avg_execution_time_ms NUMERIC,
  error_count INTEGER,
  data_processing_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_api_calls,
    COALESCE(SUM(tokens_used), 0)::INTEGER as total_tokens_used,
    COALESCE(SUM(cost_estimate), 0)::DECIMAL(10,4) as total_cost,
    COALESCE(AVG(execution_time_ms), 0)::NUMERIC as avg_execution_time_ms,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END)::INTEGER as error_count,
    (SELECT COUNT(*)::INTEGER FROM trademark_analysis.data_processing_logs WHERE session_id = p_session_id)
  FROM trademark_analysis.api_call_logs
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_debug_session_stats(UUID) IS 'Get statistics for a debug session';