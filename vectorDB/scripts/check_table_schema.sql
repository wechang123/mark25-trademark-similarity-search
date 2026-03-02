-- trademark_embeddings 테이블 구조 확인
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'trademark_embeddings'
ORDER BY ordinal_position;
