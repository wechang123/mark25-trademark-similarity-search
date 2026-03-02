-- Add score columns for non-registrable reasons and famousness check
BEGIN;

-- 1. Add non_registrable_score column
ALTER TABLE trademark_analysis.trademark_final_analysis 
ADD COLUMN IF NOT EXISTS non_registrable_score NUMERIC;

-- 2. Add famousness_score column  
ALTER TABLE trademark_analysis.trademark_final_analysis 
ADD COLUMN IF NOT EXISTS famousness_score NUMERIC;

-- 3. Update existing data with calculated scores
UPDATE trademark_analysis.trademark_final_analysis 
SET 
  non_registrable_score = CASE 
    WHEN article_34_1to6_violations IS NULL OR jsonb_array_length(article_34_1to6_violations) = 0 THEN 100
    WHEN jsonb_array_length(article_34_1to6_violations) >= 3 THEN 0
    ELSE 100 - (jsonb_array_length(article_34_1to6_violations) * 30)
  END,
  famousness_score = CASE 
    WHEN article_34_9to14_violations IS NULL OR jsonb_array_length(article_34_9to14_violations) = 0 THEN 100
    WHEN jsonb_array_length(article_34_9to14_violations) >= 3 THEN 0
    ELSE 100 - (jsonb_array_length(article_34_9to14_violations) * 30)
  END
WHERE non_registrable_score IS NULL OR famousness_score IS NULL;

-- 4. Create organized view for better readability
CREATE OR REPLACE VIEW trademark_analysis.v_final_analysis_organized AS
SELECT 
  -- Basic information
  id, 
  session_id, 
  user_id, 
  registration_possibility, 
  processing_time_ms,
  
  -- Designated goods compatibility (5 fields)
  designated_goods_compatibility_score,
  designated_goods_compatibility_reason,
  designated_goods_summary,
  designated_goods,
  designated_goods_recommended,
  
  -- Distinctiveness evaluation (4 fields)
  distinctiveness_score,
  distinctiveness_reason,
  distinctiveness_summary,
  article_33_violations,
  
  -- Prior trademark similarity (6 fields)
  prior_trademark_similarity_score,
  prior_trademark_similarity_reason,
  prior_trademark_summary,
  article_34_1_7_violation,
  article_35_1_violation,
  conflicting_trademarks,
  
  -- Non-registrable reasons (3 fields)
  non_registrable_score,
  non_registrable_summary,
  article_34_1to6_violations,
  
  -- Famousness check (4 fields)
  famousness_score,
  famousness_summary,
  article_34_9to14_violations,
  internet_search_results,
  
  -- Final recommendations (4 fields)
  final_recommendation,
  detailed_advice,
  legal_risks,
  action_items,
  
  -- Metadata
  created_at,
  updated_at
  
FROM trademark_analysis.trademark_final_analysis;

-- 5. Grant permissions on the new view
GRANT SELECT ON trademark_analysis.v_final_analysis_organized TO authenticated;
GRANT SELECT ON trademark_analysis.v_final_analysis_organized TO service_role;

COMMIT;