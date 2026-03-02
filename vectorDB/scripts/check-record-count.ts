/**
 * Check actual record count in trademark_embeddings table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function checkRecordCount() {
  console.log('🔗 Connecting to Supabase...')
  console.log(`   URL: ${SUPABASE_URL}`)
  console.log()

  try {
    // Get total count
    console.log('📊 Checking trademark_embeddings table...')
    const { count: totalCount, error: countError } = await supabase
      .from('trademark_embeddings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw countError
    }

    console.log(`   Total records: ${totalCount?.toLocaleString() || 0}`)
    console.log()

    // Check if specific Starbucks trademarks exist
    const starbucksNumbers = ['4520120004900', '4020160015394']

    console.log('🔍 Checking for specific Starbucks trademarks...')
    for (const trademarkNum of starbucksNumbers) {
      const { data, error } = await supabase
        .from('trademark_embeddings')
        .select('trademark_number')
        .eq('trademark_number', trademarkNum)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn(`   ⚠️ Error checking ${trademarkNum}:`, error.message)
      } else if (data) {
        console.log(`   ✅ Found: ${trademarkNum}`)
      } else {
        console.log(`   ❌ NOT FOUND: ${trademarkNum}`)
      }
    }

    console.log()

    // Get sample records
    console.log('📝 Sample records (first 10):')
    const { data: samples, error: sampleError } = await supabase
      .from('trademark_embeddings')
      .select('trademark_number')
      .limit(10)

    if (sampleError) {
      throw sampleError
    }

    samples?.forEach((row: any) => {
      console.log(`   ${row.trademark_number}`)
    })

    console.log()

    // Get range of trademark numbers
    console.log('📊 Trademark number range:')
    const { data: firstRecord } = await supabase
      .from('trademark_embeddings')
      .select('trademark_number')
      .order('trademark_number', { ascending: true })
      .limit(1)
      .single()

    const { data: lastRecord } = await supabase
      .from('trademark_embeddings')
      .select('trademark_number')
      .order('trademark_number', { ascending: false })
      .limit(1)
      .single()

    if (firstRecord && lastRecord) {
      console.log(`   First: ${firstRecord.trademark_number}`)
      console.log(`   Last: ${lastRecord.trademark_number}`)
    }

    console.log()
    console.log('='.repeat(70))
    console.log('✅ Check Complete')
    console.log('='.repeat(70))
    console.log()

    if (totalCount && totalCount < 100000) {
      console.log('⚠️  WARNING: Database has fewer than expected records!')
      console.log(`   Expected: ~690,079 records`)
      console.log(`   Actual: ${totalCount.toLocaleString()} records`)
      console.log()
      console.log('💡 This may indicate:')
      console.log('   1. Migration is incomplete')
      console.log('   2. Data was not fully imported')
      console.log('   3. Some records were filtered during import')
      console.log()
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkRecordCount()
