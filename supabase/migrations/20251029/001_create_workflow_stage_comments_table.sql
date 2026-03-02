-- Create workflow_stage_comments table for stage-level debugging comments
-- This is separate from debug_comments which is for position-based inline comments

CREATE TABLE IF NOT EXISTS debug_management.workflow_stage_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  stage_id VARCHAR(100) NOT NULL,
  stage_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  replies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_workflow_stage_comments_session
  ON debug_management.workflow_stage_comments(session_id);

-- Create index for filtering by resolved status
CREATE INDEX IF NOT EXISTS idx_workflow_stage_comments_resolved
  ON debug_management.workflow_stage_comments(resolved);

-- Add comment
COMMENT ON TABLE debug_management.workflow_stage_comments IS
  'Stage-level comments for workflow debugging. Related to workflow_snapshots via session_id.';

COMMENT ON COLUMN debug_management.workflow_stage_comments.session_id IS
  'Links to workflow_snapshots.session_id for the analysis session';

COMMENT ON COLUMN debug_management.workflow_stage_comments.stage_id IS
  'Stage identifier (e.g., goods_classification, kipris_search, final_analysis)';

COMMENT ON COLUMN debug_management.workflow_stage_comments.replies IS
  'Array of reply objects: [{id, text, author, timestamp}]';
