-- Create debug_comments table
CREATE TABLE IF NOT EXISTS debug_management.debug_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  stage VARCHAR(50) NOT NULL,
  element_id VARCHAR(255) NOT NULL,
  position_data JSONB NOT NULL,
  comment_text TEXT NOT NULL,
  thread_id UUID REFERENCES debug_management.debug_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE debug_management.debug_comments IS 'Inline comments for debugging sessions';
COMMENT ON COLUMN debug_management.debug_comments.session_id IS 'Analysis session ID this comment belongs to';
COMMENT ON COLUMN debug_management.debug_comments.stage IS 'Stage where the comment was added (goods_classifier, kipris_search, final_analysis)';
COMMENT ON COLUMN debug_management.debug_comments.element_id IS 'DOM element ID or unique identifier for anchoring the comment';
COMMENT ON COLUMN debug_management.debug_comments.position_data IS 'JSON object with x, y coordinates and anchor position {x: number, y: number, anchor: "left"|"right"}';
COMMENT ON COLUMN debug_management.debug_comments.thread_id IS 'Parent comment ID for threaded replies';
COMMENT ON COLUMN debug_management.debug_comments.is_resolved IS 'Whether the comment/issue has been resolved';