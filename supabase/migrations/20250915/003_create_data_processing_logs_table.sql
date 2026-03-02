-- Create data_processing_logs table
CREATE TABLE IF NOT EXISTS trademark_analysis.data_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES trademark_analysis.analysis_sessions(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  process_type VARCHAR(100) NOT NULL CHECK (process_type IN (
    'duplicate_removal', 
    'similarity_filtering', 
    'code_overlap_check',
    'similarity_score_calculation',
    'risk_level_classification',
    'data_transformation',
    'json_parsing',
    'array_processing'
  )),
  input_count INTEGER NOT NULL,
  output_count INTEGER NOT NULL,
  processing_details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE trademark_analysis.data_processing_logs IS 'Logs for data transformation and filtering processes';
COMMENT ON COLUMN trademark_analysis.data_processing_logs.session_id IS 'Reference to the analysis session';
COMMENT ON COLUMN trademark_analysis.data_processing_logs.stage IS 'Stage where the processing occurred';
COMMENT ON COLUMN trademark_analysis.data_processing_logs.process_type IS 'Type of data processing performed';
COMMENT ON COLUMN trademark_analysis.data_processing_logs.input_count IS 'Number of items before processing';
COMMENT ON COLUMN trademark_analysis.data_processing_logs.output_count IS 'Number of items after processing';
COMMENT ON COLUMN trademark_analysis.data_processing_logs.processing_details IS 'Detailed information about the processing (filters applied, criteria used, etc.)';