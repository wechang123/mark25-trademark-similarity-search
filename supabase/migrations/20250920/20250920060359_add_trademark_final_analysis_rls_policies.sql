-- Enable RLS on trademark_final_analysis table
ALTER TABLE trademark_analysis.trademark_final_analysis ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own final analysis
CREATE POLICY "Users can view own final analysis"
ON trademark_analysis.trademark_final_analysis
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own final analysis
CREATE POLICY "Users can insert own final analysis"
ON trademark_analysis.trademark_final_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own final analysis
CREATE POLICY "Users can update own final analysis"
ON trademark_analysis.trademark_final_analysis
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own final analysis
CREATE POLICY "Users can delete own final analysis"
ON trademark_analysis.trademark_final_analysis
FOR DELETE
USING (auth.uid() = user_id);

-- Service role has full access (already exists but adding for completeness)
CREATE POLICY IF NOT EXISTS "Service role full access to trademark_final_analysis"
ON trademark_analysis.trademark_final_analysis
FOR ALL
USING (auth.role() = 'service_role');