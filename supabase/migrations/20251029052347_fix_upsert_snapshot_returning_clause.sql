-- Fix upsert_workflow_snapshot RPC function RETURNING clause
-- The previous version had invalid subquery syntax in RETURNING clause causing null returns

CREATE OR REPLACE FUNCTION debug_management.upsert_workflow_snapshot(
  p_session_id TEXT,
  p_snapshot_data JSONB,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot RECORD;
BEGIN
  -- Upsert only non-generated columns
  -- Generated columns (trademark_name, total_tokens, total_cost, execution_time_ms)
  -- will be automatically populated from snapshot_data by PostgreSQL
  INSERT INTO debug_management.workflow_snapshots (
    session_id,
    snapshot_data,
    user_id
  ) VALUES (
    p_session_id,
    p_snapshot_data,
    p_user_id
  )
  ON CONFLICT (session_id) DO UPDATE SET
    snapshot_data = EXCLUDED.snapshot_data,
    user_id = EXCLUDED.user_id,
    created_at = workflow_snapshots.created_at  -- Keep original created_at
  RETURNING * INTO v_snapshot;

  -- Convert the entire row to JSON and return
  RETURN row_to_json(v_snapshot);
END;
$$;

-- Add comment
COMMENT ON FUNCTION debug_management.upsert_workflow_snapshot IS
  'Safely upserts a workflow snapshot. Returns the complete row as JSON including generated columns.';
