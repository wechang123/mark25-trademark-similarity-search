/**
 * Test KIPRIS API XML response with actual trademark numbers
 */

import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const KIPRIS_API_KEY = process.env.KIPRIS_API_KEY

if (!KIPRIS_API_KEY) {
  console.error('❌ Error: Missing KIPRIS_API_KEY')
  process.exit(1)
}

async function testKiprisApi() {
  // Test with a trademark that exists in our database
  const testNumbers = [
    '4020160002421',  // From our sample records
    '4020160002435',  // From our sample records
    '4520120004900',  // Starbucks (not in DB)
    '4020160015394'   // Starbucks (not in DB)
  ]

  console.log('🔍 Testing KIPRIS API...')
  console.log(`   API Key: ${KIPRIS_API_KEY!.substring(0, 20)}...`)
  console.log()

  for (const trademarkNumber of testNumbers) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`Testing: ${trademarkNumber}`)
    console.log('='.repeat(70))

    try {
      const url = `http://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/trademarkInfo?ServiceKey=${KIPRIS_API_KEY}&applicationNumber=${trademarkNumber}`

      console.log(`\n📡 Fetching from KIPRIS...`)
      console.log(`   URL: ${url.replace(KIPRIS_API_KEY!, 'HIDDEN')}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'IP-Doctor/1.0'
        }
      })

      console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)

      const xmlText = await response.text()

      console.log(`\n📄 Response Length: ${xmlText.length} characters`)
      console.log(`\n📝 Response Preview (first 800 chars):`)
      console.log('─'.repeat(70))
      console.log(xmlText.substring(0, 800))
      console.log('─'.repeat(70))

      // Check if it's valid XML
      const isXml = xmlText.includes('<?xml') || xmlText.includes('<response>')
      console.log(`\n✓ Is XML: ${isXml}`)

      if (isXml) {
        // Try to extract some basic fields
        const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/i) ||
                          xmlText.match(/<MarkName>([^<]+)<\/MarkName>/i)
        const applicantMatch = xmlText.match(/<applicantName>([^<]+)<\/applicantName>/i) ||
                              xmlText.match(/<ApplicantName>([^<]+)<\/ApplicantName>/i)

        console.log(`   Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`)
        console.log(`   Applicant: ${applicantMatch ? applicantMatch[1] : 'NOT FOUND'}`)
      }

    } catch (error) {
      console.error(`\n❌ Error:`, error)
    }
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log('✅ Test Complete')
  console.log('='.repeat(70))
}

testKiprisApi()
