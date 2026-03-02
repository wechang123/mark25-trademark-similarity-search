-- HNSW 인덱스 상태 확인

-- 1. 인덱스 존재 여부 확인
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'trademark_embeddings'
  AND indexname LIKE '%hnsw%';

-- 2. 모든 인덱스 확인
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'trademark_embeddings';

-- 3. 테이블 통계
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE tablename = 'trademark_embeddings';

-- 4. pgvector 확장 버전 확인
SELECT * FROM pg_extension WHERE extname = 'vector';
