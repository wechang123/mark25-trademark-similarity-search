-- 유사도 계산 버그 수정: distance를 similarity로 올바르게 변환
-- 문제: 현재 함수가 distance (0.95)를 그대로 반환하여 similarity가 매우 낮게 표시됨
-- 해결: 1 - distance로 변환하여 similarity (0.05 → 0.95)로 정상화

DROP FUNCTION IF EXISTS search_similar_trademarks_hnsw_filtered(TEXT, INT);

CREATE OR REPLACE FUNCTION search_similar_trademarks_hnsw_filtered(
  query_embedding TEXT,  -- JSON string format: '[0.1, 0.2, ...]'
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  trademark_number VARCHAR(50),
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300000'  -- 5분 timeout
AS $$
BEGIN
  -- HNSW 검색 품질 향상: ef_search = 100
  PERFORM set_config('hnsw.ef_search', '100', true);

  -- HNSW 인덱스를 활용한 유사도 검색
  -- <-> 연산자: Cosine 거리 (낮을수록 유사)
  -- ✅ 1 - distance로 유사도 점수로 변환 (높을수록 유사)
  RETURN QUERY
  SELECT
    te.trademark_number,
    (1 - (te.embedding <-> query_embedding::vector(1024)))::FLOAT AS similarity
  FROM trademark_embeddings te
  ORDER BY te.embedding <-> query_embedding::vector(1024)
  LIMIT match_count;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION search_similar_trademarks_hnsw_filtered(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_trademarks_hnsw_filtered(TEXT, INT) TO service_role;

-- 테스트용 쿼리
-- SELECT trademark_number, similarity
-- FROM search_similar_trademarks_hnsw_filtered('[0.1, 0.2, ...]', 10)
-- ORDER BY similarity DESC;
