-- Optimized Supabase RPC function for vector similarity search
-- Removes WHERE clause to properly utilize HNSW index

CREATE OR REPLACE FUNCTION match_trademark_embeddings(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  trademark_number varchar,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    trademark_number,
    1 - (embedding <=> query_embedding) AS similarity
  FROM trademark_embeddings
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_trademark_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_trademark_embeddings TO anon;
GRANT EXECUTE ON FUNCTION match_trademark_embeddings TO service_role;

-- Note: WHERE clause removed to allow HNSW index to be used effectively
-- The ORDER BY embedding <=> query_embedding will use the HNSW index
-- Filtering by threshold can be done in application code if needed
