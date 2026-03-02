-- HNSW 인덱스를 활용한 유사 상표 검색 RPC 함수
-- pgvector의 <=> 연산자로 빠른 검색 (타임아웃 우회)

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS search_similar_trademarks_hnsw(vector, INT);

CREATE OR REPLACE FUNCTION search_similar_trademarks_hnsw(
  query_embedding vector(1024),
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  trademark_number VARCHAR(50),
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Timeout을 5분으로 설정 (HNSW 인덱스 검색 시간 확보)
  SET LOCAL statement_timeout = '300000'; -- 5분 = 300,000ms

  -- HNSW 인덱스를 활용한 유사도 검색
  -- <-> 연산자: Cosine 거리 (낮을수록 유사) - HNSW 인덱스 활용!
  -- 1 - distance로 유사도 점수로 변환 (높을수록 유사)
  RETURN QUERY
  SELECT
    te.trademark_number,
    (1 - (te.embedding <-> query_embedding))::FLOAT AS similarity
  FROM trademark_embeddings te
  ORDER BY te.embedding <-> query_embedding
  LIMIT match_count;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION search_similar_trademarks_hnsw(vector, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_trademarks_hnsw(vector, INT) TO service_role;

-- 사용 예시:
-- SELECT * FROM search_similar_trademarks_hnsw(
--   '[0.1, 0.2, ...]'::vector(1024),
--   20
-- );
