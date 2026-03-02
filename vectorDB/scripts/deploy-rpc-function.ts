/**
 * Deploy optimized RPC function to Supabase
 *
 * This script deploys the optimized match_trademark_embeddings function
 * that properly utilizes the HNSW index.
 *
 * Usage:
 *   npx ts-node vectorDB/scripts/deploy-rpc-function.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function deployRpcFunction() {
  console.log('🔗 Connecting to Supabase...')
  console.log(`   URL: ${SUPABASE_URL}`)
  console.log()

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_rpc_function_optimized.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    console.log('📄 Deploying optimized RPC function...')
    console.log('   Function: match_trademark_embeddings')
    console.log('   Optimization: Removed WHERE clause to use HNSW index')
    console.log()

    // Execute SQL using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    })

    if (error) {
      // Try direct SQL execution if exec_sql doesn't exist
      console.log('⚠️  exec_sql not available, using alternative method...')
      console.log()

      // We need to use postgres connection for this
      // For now, just output instructions
      console.log('📋 Manual deployment required:')
      console.log()
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Copy and paste the following SQL:')
      console.log()
      console.log('=' * 70)
      console.log(sqlContent)
      console.log('=' * 70)
      console.log()
      console.log('3. Click "Run" to execute')
      console.log()

      return
    }

    console.log('✅ RPC function deployed successfully!')
    console.log()

    console.log('=' * 70)
    console.log('🎉 Deployment Complete!')
    console.log('=' * 70)
    console.log()
    console.log('📝 Next Steps:')
    console.log('   1. Test the similar image search')
    console.log('   2. Verify HNSW index is being used (should be much faster)')
    console.log('   3. Check query performance')
    console.log()

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

deployRpcFunction()
