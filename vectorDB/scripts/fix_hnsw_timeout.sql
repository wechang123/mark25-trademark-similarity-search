-- HNSW 함수에서 SET LOCAL 제거하고 ALTER ROLE 설정에 의존
-- Connection Pooler (Transaction Mode)는 SET LOCAL을 무시하므로
-- 이미 설정한 ALTER ROLE service_role SET statement_timeout = '300000'만 사용

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
SET statement_timeout = '300000'  -- 함수 레벨에서 설정 (LOCAL 제거)
AS $$
BEGIN
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
