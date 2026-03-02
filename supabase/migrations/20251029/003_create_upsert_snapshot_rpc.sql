-- RPC function to upsert workflow snapshot with proper handling of generated columns
-- All metadata columns (trademark_name, total_tokens, total_cost, execution_time_ms)
-- are automatically generated from snapshot_data, so we don't set them explicitly
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
  v_result JSON;
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
  RETURNING (
    SELECT row_to_json(ws.*)
    FROM debug_management.workflow_snapshots ws
    WHERE ws.id = workflow_snapshots.id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Add comment
COMMENT ON FUNCTION debug_management.upsert_workflow_snapshot IS
  'Safely upserts a workflow snapshot. Only inserts non-generated columns (session_id, snapshot_data, user_id). All metadata columns are auto-generated from snapshot_data.';
