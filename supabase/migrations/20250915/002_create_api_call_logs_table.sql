-- Create api_call_logs table in trademark_analysis schema
CREATE TABLE IF NOT EXISTS trademark_analysis.api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES trademark_analysis.analysis_sessions(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL CHECK (stage IN ('goods_classifier', 'kipris_search', 'final_analysis')),
  api_type VARCHAR(50) NOT NULL CHECK (api_type IN ('gemini', 'openai', 'kipris', 'rag')),
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_timestamp TIMESTAMPTZ,
  request_data JSONB NOT NULL,
  response_data JSONB,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,4),
  error_message TEXT,
  execution_time_ms INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN response_timestamp IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (response_timestamp - request_timestamp)) * 1000
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE trademark_analysis.api_call_logs IS 'Logs for all API calls made during trademark analysis workflow';
COMMENT ON COLUMN trademark_analysis.api_call_logs.session_id IS 'Reference to the analysis session';
COMMENT ON COLUMN trademark_analysis.api_call_logs.stage IS 'Analysis stage where the API call was made';
COMMENT ON COLUMN trademark_analysis.api_call_logs.api_type IS 'Type of API called (gemini, openai, kipris, rag)';
COMMENT ON COLUMN trademark_analysis.api_call_logs.request_data IS 'Complete request payload sent to the API';
COMMENT ON COLUMN trademark_analysis.api_call_logs.response_data IS 'Complete response received from the API';
COMMENT ON COLUMN trademark_analysis.api_call_logs.tokens_used IS 'Number of tokens used in the API call';
COMMENT ON COLUMN trademark_analysis.api_call_logs.cost_estimate IS 'Estimated cost of the API call in USD';
COMMENT ON COLUMN trademark_analysis.api_call_logs.execution_time_ms IS 'Calculated execution time in milliseconds';