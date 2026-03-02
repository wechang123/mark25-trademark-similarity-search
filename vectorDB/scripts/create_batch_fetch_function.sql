-- 배치로 trademark embeddings를 가져오는 RPC 함수
-- Supabase PostgREST의 1000개 제한을 우회 (JSONB array 방식)

-- 기존 함수 삭제 (충돌 방지)
DROP FUNCTION IF EXISTS get_trademark_embeddings_batch(INT, TEXT);
DROP FUNCTION IF EXISTS get_trademark_embeddings_batch(INT, VARCHAR);

CREATE OR REPLACE FUNCTION get_trademark_embeddings_batch(
  batch_size_param INT,
  last_trademark_number_param VARCHAR(50) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Timeout을 5분으로 설정 (JSONB 변환 시간 확보)
  SET LOCAL statement_timeout = '300000'; -- 5분 = 300초 = 300,000ms

  IF last_trademark_number_param IS NULL THEN
    -- 첫 번째 배치: JSONB array로 반환 (PostgREST row 제한 우회)
    SELECT json_agg(
      json_build_object(
        'trademark_number', te.trademark_number,
        'embedding', te.embedding::text
      )
    )::jsonb INTO result
    FROM (
      SELECT trademark_number, embedding
      FROM trademark_embeddings
      ORDER BY trademark_number ASC
      LIMIT batch_size_param
    ) te;
  ELSE
    -- 이후 배치 (cursor 기반): JSONB array로 반환
    SELECT json_agg(
      json_build_object(
        'trademark_number', te.trademark_number,
        'embedding', te.embedding::text
      )
    )::jsonb INTO result
    FROM (
      SELECT trademark_number, embedding
      FROM trademark_embeddings
      WHERE trademark_number > last_trademark_number_param
      ORDER BY trademark_number ASC
      LIMIT batch_size_param
    ) te;
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_trademark_embeddings_batch(INT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trademark_embeddings_batch(INT, VARCHAR) TO service_role;
