-- Step 1: 삭제할 레코드 개수 확인
SELECT
  COUNT(*) as total_records,
  COUNT(CASE WHEN trademark_type = 'Type D - 순수 텍스트' THEN 1 END) as type_d_count,
  COUNT(CASE WHEN trademark_type != 'Type D - 순수 텍스트' OR trademark_type IS NULL THEN 1 END) as remaining_count
FROM trademark_embeddings;

-- Step 2: Type D 상표 샘플 확인 (처음 10개)
SELECT trademark_number, trademark_name, trademark_type, trademark_type_code
FROM trademark_embeddings
WHERE trademark_type = 'Type D - 순수 텍스트'
LIMIT 10;

-- Step 3: 삭제 실행 (주석 해제 후 실행)
-- DELETE FROM trademark_embeddings
-- WHERE trademark_type = 'Type D - 순수 텍스트';

-- Step 4: 삭제 후 확인
-- SELECT COUNT(*) as remaining_count FROM trademark_embeddings;
