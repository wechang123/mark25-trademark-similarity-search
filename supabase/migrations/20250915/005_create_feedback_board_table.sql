-- Create feedback_board table
CREATE TABLE IF NOT EXISTS debug_management.debug_feedback_board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_ids UUID[] NOT NULL,
  insights TEXT NOT NULL,
  improvement_suggestions TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  category VARCHAR(50) CHECK (category IN (
    'performance',
    'api_optimization',
    'data_quality',
    'ui_ux',
    'bug',
    'feature_request',
    'documentation',
    'other'
  )),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  github_issue_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE debug_management.debug_feedback_board IS 'Centralized feedback and insights from debugging sessions';
COMMENT ON COLUMN debug_management.debug_feedback_board.title IS 'Brief title of the feedback/issue';
COMMENT ON COLUMN debug_management.debug_feedback_board.description IS 'Detailed description of the issue or feedback';
COMMENT ON COLUMN debug_management.debug_feedback_board.session_ids IS 'Array of related debug session IDs';
COMMENT ON COLUMN debug_management.debug_feedback_board.insights IS 'Key insights discovered during debugging';
COMMENT ON COLUMN debug_management.debug_feedback_board.improvement_suggestions IS 'Suggested improvements or solutions';
COMMENT ON COLUMN debug_management.debug_feedback_board.priority IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN debug_management.debug_feedback_board.status IS 'Current status: open, in_progress, resolved, wont_fix';
COMMENT ON COLUMN debug_management.debug_feedback_board.category IS 'Category of the feedback';
COMMENT ON COLUMN debug_management.debug_feedback_board.github_issue_url IS 'Link to related GitHub issue if created';