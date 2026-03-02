-- RPC function to get snapshot with all related comments in one query
CREATE OR REPLACE FUNCTION debug_management.get_snapshot_with_comments(p_snapshot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_session_id TEXT;
BEGIN
  -- First get the session_id from the snapshot
  SELECT session_id INTO v_session_id
  FROM debug_management.workflow_snapshots
  WHERE id = p_snapshot_id;

  IF v_session_id IS NULL THEN
    RETURN json_build_object('error', 'Snapshot not found');
  END IF;

  -- Build combined result with snapshot and comments
  SELECT json_build_object(
    'snapshot', row_to_json(s.*),
    'comments', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'stageId', c.stage_id,
            'stageName', c.stage_name,
            'text', c.text,
            'author', c.author,
            'resolved', c.resolved,
            'replies', c.replies,
            'timestamp', c.created_at
          )
          ORDER BY c.created_at ASC
        )
        FROM debug_management.workflow_stage_comments c
        WHERE c.session_id = v_session_id
      ),
      '[]'::json
    )
  ) INTO result
  FROM debug_management.workflow_snapshots s
  WHERE s.id = p_snapshot_id;

  RETURN result;
END;
$$;

-- RPC function to get paginated snapshots with optional user filtering
CREATE OR REPLACE FUNCTION debug_management.get_snapshots_paginated(
  p_user_id UUID DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_offset INT;
  v_total INT;
  v_query TEXT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Get total count
  IF p_user_id IS NULL THEN
    SELECT COUNT(*) INTO v_total
    FROM debug_management.workflow_snapshots;
  ELSE
    SELECT COUNT(*) INTO v_total
    FROM debug_management.workflow_snapshots
    WHERE user_id = p_user_id;
  END IF;

  -- Build dynamic query for sorting
  v_query := format('
    SELECT json_build_object(
      ''data'', json_agg(row_to_json(s.*)),
      ''total'', %s,
      ''page'', %s,
      ''pageSize'', %s,
      ''totalPages'', CEIL(%s::DECIMAL / %s)
    )
    FROM (
      SELECT *
      FROM debug_management.workflow_snapshots
      %s
      ORDER BY %I %s
      LIMIT %s OFFSET %s
    ) s',
    v_total,
    p_page,
    p_page_size,
    v_total,
    p_page_size,
    CASE WHEN p_user_id IS NULL THEN '' ELSE format('WHERE user_id = %L', p_user_id) END,
    p_sort_by,
    CASE WHEN p_sort_order = 'asc' THEN 'ASC' ELSE 'DESC' END,
    p_page_size,
    v_offset
  );

  EXECUTE v_query INTO result;

  RETURN result;
END;
$$;

-- Add comments
COMMENT ON FUNCTION debug_management.get_snapshot_with_comments IS
  'Fetches a workflow snapshot along with all its stage comments in a single query for performance';

COMMENT ON FUNCTION debug_management.get_snapshots_paginated IS
  'Fetches paginated workflow snapshots with optional user filtering and sorting';
