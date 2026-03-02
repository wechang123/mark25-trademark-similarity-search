/**
 * Similar Image Search API (Supabase + Cloud Run)
 *
 * Flow:
 * 1. 이미지 업로드 받기
 * 2. Cloud Run embedding service 호출 (DINOv2)
 * 3. Supabase pgvector로 유사도 검색
 * 4. KIPRIS API로 서지정보 조회
 * 5. 결과 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST as extractSimilarCodesHandler } from '../../../trademark/extract-similar-codes/route'
import { getXmlValue, getXmlBlocks } from '@/infrastructure/external/server-kipris-api'

// 환경변수 (빌드 시점에는 검증하지 않음)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL
const KIPRIS_API_KEY = process.env.KIPRIS_SEARCH_API_KEY || process.env.KIPRIS_API_KEY
// 로컬 Flask 벡터 검색 서버 (Cloud Run 대체)
const LOCAL_VECTOR_SEARCH_URL = process.env.LOCAL_VECTOR_SEARCH_URL || 'http://localhost:3001'

// Lazy Supabase client initialization (런타임에만 생성)
function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        // PostgREST max-rows 제한 우회 (기본 1000 → 10000으로 증가)
        'Range-Unit': 'items',
        'Prefer': 'count=exact'
      }
    }
  })
}

interface SimilarTrademarkResult {
  rank: number
  trademark_number: string
  similarity: number
  confidence: 'high' | 'medium' | 'low'
  similarity_level: 'excellent' | 'very_high' | 'high' | 'medium' | 'low' | 'very_low'
  similarity_label: string
  kipris_image_url?: string
  bibliographic?: {
    title?: string
    applicantName?: string
    applicationNumber?: string
    registrationNumber?: string
    applicationDate?: string
    registrationDate?: string
    applicationStatus?: string
    goodsClassificationCode?: string
    similarityCodes?: string[]
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('🔍 [Similar Image Search] Starting search...')

    // 1. 이미지 파일 및 사업설명 받기
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const businessDescription = formData.get('businessDescription') as string | null

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    console.log(`📸 [Similar Image Search] Image received: ${imageFile.name} (${imageFile.size} bytes)`)

    // Step 1: 유사군 코드 자동 추출 (사업설명이 있으면)
    let similarGroupCodes: string[] = []

    if (businessDescription?.trim()) {
      console.log(`📝 [Step 1/5] Business description provided, extracting similar group codes...`)
      console.log(`   Description: "${businessDescription.substring(0, 100)}..."`)

      try {
        // 내부적으로 extract-similar-codes API 호출 (직접 핸들러 호출)
        const extractRequest = new NextRequest('http://localhost/api/trademark/extract-similar-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessDescription: businessDescription.trim(),
            userChoice: 'both'
          })
        })

        const codesResponse = await extractSimilarCodesHandler(extractRequest)

        if (codesResponse.ok) {
          const codesData = await codesResponse.json()
          similarGroupCodes = codesData.selectedCodes || []
          console.log(`✅ [Step 1/5] Similar group codes extracted: ${similarGroupCodes.join(', ')}`)
        } else {
          console.warn(`⚠️ [Step 1/5] Failed to extract codes: ${codesResponse.status}`)
        }
      } catch (error) {
        console.error(`❌ [Step 1/5] Error extracting codes:`, error)
        console.log(`⚠️ [Step 1/5] Continuing without code filtering`)
      }
    } else {
      console.log(`ℹ️ [Step 1/5] No business description provided, skipping code extraction`)
    }

    // Step 2+3: 로컬 Flask 벡터 서버로 임베딩 + 유사도 검색 통합 처리
    console.log(`🖼️ [Step 2/5] Embedding + similarity search via local Flask server (${LOCAL_VECTOR_SEARCH_URL})...`)

    const flaskFormData = new FormData()
    flaskFormData.append('image', imageFile)

    let flaskResponse: Response
    try {
      flaskResponse = await fetch(`${LOCAL_VECTOR_SEARCH_URL}/api/search`, {
        method: 'POST',
        body: flaskFormData,
        signal: AbortSignal.timeout(300000), // 5분 timeout
      })
    } catch (err: any) {
      console.error('❌ [Step 2/5] Local Flask server unreachable:', err.message)
      return NextResponse.json(
        { error: '로컬 벡터 검색 서버에 연결할 수 없습니다. python app.py를 먼저 실행해주세요. (port 3001)', details: err.message },
        { status: 503 }
      )
    }

    if (!flaskResponse.ok) {
      const errText = await flaskResponse.text()
      console.error('❌ [Step 2/5] Flask server error:', errText)
      return NextResponse.json(
        { error: 'Flask 벡터 검색 서버 오류', details: errText },
        { status: 500 }
      )
    }

    const flaskData = await flaskResponse.json()

    if (!flaskData.success || !flaskData.results) {
      return NextResponse.json(
        { error: flaskData.error || 'Flask 서버 검색 실패' },
        { status: 500 }
      )
    }

    // Flask 결과를 route.ts 포맷으로 변환
    // Flask: { rank, trademark_number, similarity, filename, filepath }
    // filepath 예시: C:\KIPRIS_FULL\ALL_IMAGES\4020247005427_md000001.jpg
    // → 실제 출원번호: 4020247005427
    const vectorResults: Array<{ trademark_number: string; similarity: number }> =
      flaskData.results.map((r: any) => {
        // Windows/Unix 경로에서 파일명만 추출
        const filepath: string = r.filepath || r.filename || r.trademark_number
        const filename = filepath.split(/[/\\]/).pop() || filepath
        // 파일명에서 출원번호 추출: 4020247005427_md000001.jpg → 4020247005427
        const baseName = filename.replace(/\.[^.]+$/, '') // 확장자 제거
        const trademarkNumber = baseName.split('_')[0]    // _md000001 등 제거
        return {
          trademark_number: trademarkNumber,
          similarity: r.similarity,
        }
      })

    console.log(`✅ [Step 3/5] Found ${vectorResults.length} results from local vector search`)

    // Step 4: 결과 처리 및 KIPRIS 서지정보 조회 + 유사군 코드 필터링
    console.log(`🎯 [Step 4/5] Processing results and filtering by similar group codes...`)
    const processedResults = await processResults(vectorResults, similarGroupCodes)

    const elapsed = Date.now() - startTime

    console.log(`✅ [Step 5/5] Search completed in ${elapsed}ms`)
    console.log(`📊 [Step 5/5] Final results: ${processedResults.length} trademarks (filtered from ${vectorResults?.length || 0})`)

    return NextResponse.json({
      success: true,
      results: processedResults,
      total: processedResults.length,
      search_time_ms: elapsed,
      filtered_by_classification: similarGroupCodes.length > 0,
      extracted_codes: similarGroupCodes  // 추출된 유사군 코드 포함
    })

  } catch (error: any) {
    console.error('❌ [Similar Image Search] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * 코사인 유사도 계산
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)

  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

/**
 * 결과 처리 및 KIPRIS 서지정보 조회
 */
async function processResults(
  vectorResults: Array<{ trademark_number: string; similarity: number }>,
  filterBySimilarGroupCodes: string[] = []
): Promise<SimilarTrademarkResult[]> {

  const results: SimilarTrademarkResult[] = []
  const seenTrademarks = new Set<string>()
  const shouldFilter = filterBySimilarGroupCodes.length > 0

  console.log(`📊 [Process Results] Processing ${vectorResults.length} results${shouldFilter ? ` (filtering by codes: ${filterBySimilarGroupCodes.join(', ')})` : ''}`)

  // 배치 병렬 처리 설정 (KIPRIS API 과부하 대응)
  const BATCH_SIZE = 2 // KIPRIS 과부하 시 최소화 (현재 응답시간: 10-65초)
  const DELAY_BETWEEN_REQUESTS = 500 // ms - 과부하 서버 보호
  console.log(`🚀 [Process Results] Using batch parallel processing (batch size: ${BATCH_SIZE}, delay: ${DELAY_BETWEEN_REQUESTS}ms)`)
  console.log(`⚠️ [Process Results] KIPRIS API currently overloaded (response time: 10-65s)`)

  // 배치 단위로 처리
  for (let i = 0; i < vectorResults.length; i += BATCH_SIZE) {
    const batch = vectorResults.slice(i, i + BATCH_SIZE)
    console.log(`📦 [Process Results] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(vectorResults.length / BATCH_SIZE)} (${batch.length} items)`)

    // 배치 내 병렬 처리 (Staggered start for rate limiting)
    const batchPromises = batch.map(async (result, batchIndex) => {
      // Staggered start: 각 요청을 일정 간격으로 시작
      await new Promise(resolve => setTimeout(resolve, batchIndex * DELAY_BETWEEN_REQUESTS))

      const trademarkNumber = result.trademark_number
      const similarity = result.similarity

      // 중복 제거
      if (seenTrademarks.has(trademarkNumber)) {
        return null
      }
      seenTrademarks.add(trademarkNumber)

      // 유사도 레벨 계산
      let similarity_level: SimilarTrademarkResult['similarity_level']
      let similarity_label: string
      let confidence: SimilarTrademarkResult['confidence']

      if (similarity >= 0.90) {
        similarity_level = 'excellent'
        similarity_label = '거의 동일'
        confidence = 'high'
      } else if (similarity >= 0.70) {
        similarity_level = 'very_high'
        similarity_label = '매우 유사'
        confidence = 'high'
      } else if (similarity >= 0.50) {
        similarity_level = 'high'
        similarity_label = '유사'
        confidence = 'medium'
      } else if (similarity >= 0.30) {
        similarity_level = 'medium'
        similarity_label = '일부 유사'
        confidence = 'medium'
      } else if (similarity >= 0.15) {
        similarity_level = 'low'
        similarity_label = '참고용 (낮은 유사도)'
        confidence = 'low'
      } else {
        similarity_level = 'very_low'
        similarity_label = '관련성 의심'
        confidence = 'low'
      }

      // KIPRIS 서지정보 조회 (retry 로직 포함)
      let bibliographic: SimilarTrademarkResult['bibliographic']
      let kipris_image_url: string | undefined

      if (KIPRIS_API_KEY) {
        const biblioData = await fetchKiprisBibliographicWithRetry(trademarkNumber)
        bibliographic = biblioData?.bibliographic
        kipris_image_url = biblioData?.imageUrl
      }

      return {
        trademarkNumber,
        similarity,
        confidence,
        similarity_level,
        similarity_label,
        kipris_image_url,
        bibliographic
      }
    })

    // 모든 배치 요청이 완료될 때까지 대기
    const batchResults = await Promise.allSettled(batchPromises)

    // 배치 결과 처리 및 필터링
    for (const promiseResult of batchResults) {
      if (promiseResult.status === 'fulfilled' && promiseResult.value) {
        const item = promiseResult.value
        const { trademarkNumber, similarity, confidence, similarity_level, similarity_label, kipris_image_url, bibliographic } = item

        // 유사군 코드로 필터링 (KIPRIS 정보 필요)
        if (shouldFilter && bibliographic) {
          let hasMatch = false

          // 1순위: 유사군 코드로 매칭 (가장 정확)
          if (bibliographic.similarityCodes && bibliographic.similarityCodes.length > 0) {
            hasMatch = bibliographic.similarityCodes.some(simCode =>
              filterBySimilarGroupCodes.some(filterCode => simCode === filterCode)
            )

            if (hasMatch) {
              console.log(`✅ [Process Results] Matched ${trademarkNumber} by similarity codes: ${bibliographic.similarityCodes.join(', ')}`)
            }
          }

          // 2순위: 상품분류 번호로 매칭 (대체 방법)
          if (!hasMatch && bibliographic.goodsClassificationCode) {
            const classCode = bibliographic.goodsClassificationCode

            // filterBySimilarGroupCodes에서 숫자 부분 추출 (예: "G430301" → "43", "S120602" → "12")
            const filterClassNumbers = filterBySimilarGroupCodes
              .map(code => {
                const match = code.match(/\d+/)
                return match ? match[0] : null
              })
              .filter(num => num !== null)

            // goodsClassificationCode에 해당 번호가 포함되는지 확인 (예: "35|43" includes "43")
            hasMatch = filterClassNumbers.some(num => classCode.includes(num!))

            if (hasMatch) {
              console.log(`✅ [Process Results] Matched ${trademarkNumber} by product class: ${classCode}`)
            }
          }

        if (!hasMatch) {
          console.log(`🚫 [Process Results] Filtered out ${trademarkNumber} (codes: ${bibliographic.similarityCodes?.join(', ') || 'none'}, class: ${bibliographic.goodsClassificationCode || 'none'})`)
          continue
        }
      }

      results.push({
        rank: results.length + 1,
        trademark_number: trademarkNumber,
        similarity,
        confidence,
        similarity_level,
        similarity_label,
        kipris_image_url,
        bibliographic
      })
    }
  }
  }

  console.log(`📊 [Process Results] Returning ${results.length} results${shouldFilter ? ` (filtered from ${vectorResults.length})` : ''}`)

  return results
}

/**
 * Retry 로직을 포함한 KIPRIS 서지정보 조회 wrapper 함수
 */
async function fetchKiprisBibliographicWithRetry(
  trademarkNumber: string,
  maxRetries: number = 2
): Promise<{
  bibliographic?: SimilarTrademarkResult['bibliographic']
  imageUrl?: string
} | null> {

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fetchKiprisBibliographic(trademarkNumber)

      // 성공하면 바로 반환
      if (result !== null) {
        if (attempt > 1) {
          console.log(`✅ [KIPRIS] Retry succeeded for ${trademarkNumber} (attempt ${attempt})`)
        }
        return result
      }

      // successYN=N인 경우 재시도하지 않음 (잘못된 상표번호)
      // 이 경우는 null을 반환하지만 재시도하지 않음
      break

    } catch (error: any) {
      const is502 = error?.message?.includes('502') || error?.cause?.code === 'ECONNRESET'
      const isTimeout = error?.name === 'AbortError' || error?.name === 'TimeoutError'

      // 502 오류 또는 timeout인 경우만 재시도
      if ((is502 || isTimeout) && attempt <= maxRetries) {
        const delay = 500 * attempt // Exponential backoff: 500ms, 1000ms
        console.log(`🔄 [KIPRIS] Retry ${attempt}/${maxRetries} for ${trademarkNumber} after ${delay}ms (${error?.name || 'error'})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // 재시도 횟수 초과 또는 재시도 불가능한 오류
      console.warn(`⚠️ [KIPRIS] Failed after ${attempt} attempts for ${trademarkNumber}:`, error?.message)
      return null
    }
  }

  return null
}

/**
 * KIPRIS API로 서지정보 및 이미지 URL 조회
 * getBibliographyDetailInfoSearch 엔드포인트 사용 (단건 상세 조회)
 */
async function fetchKiprisBibliographic(trademarkNumber: string): Promise<{
  bibliographic?: SimilarTrademarkResult['bibliographic']
  imageUrl?: string
} | null> {

  if (!KIPRIS_API_KEY) {
    return null
  }

  try {
    // KIPRIS getBibliographyDetailInfoSearch 엔드포인트 (단건 상세 조회)
    const url = `http://plus.kipris.or.kr/kipo-api/kipi/trademarkInfoSearchService/getBibliographyDetailInfoSearch?applicationNumber=${trademarkNumber}&ServiceKey=${KIPRIS_API_KEY}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'IP-Doctor/1.0'
      },
      signal: AbortSignal.timeout(70000) // 70초 timeout (KIPRIS 과부하 시 최대 65초 소요)
    })

    if (!response.ok) {
      console.warn(`⚠️ [KIPRIS] API returned ${response.status} for ${trademarkNumber}`)
      return null
    }

    const xmlText = await response.text()

    // XML 응답인지 확인
    if (!xmlText.includes('<?xml') && !xmlText.includes('<response>')) {
      console.warn(`⚠️ [KIPRIS] Invalid XML response for ${trademarkNumber}`)
      return null
    }

    // 성공 여부 확인
    const successYN = getXmlValue(xmlText, 'successYN')
    if (successYN !== 'Y') {
      console.warn(`⚠️ [KIPRIS] API returned successYN=${successYN} for ${trademarkNumber}`)
      return null
    }

    // XML 파싱 - 각 섹션별로 추출
    // 1. 이미지 - <sampleImageInfoArray><sampleImageInfo><path>
    const sampleImageBlocks = getXmlBlocks(xmlText, 'sampleImageInfo')
    const imagePath = sampleImageBlocks.length > 0 ? getXmlValue(sampleImageBlocks[0], 'path') : ''
    const smallPath = sampleImageBlocks.length > 0 ? getXmlValue(sampleImageBlocks[0], 'smallPath') : ''

    // 2. 출원인 - <applicantInfoArray><applicantInfo><nameKoreanLong>
    const applicantBlocks = getXmlBlocks(xmlText, 'applicantInfo')
    const applicantName = applicantBlocks.length > 0 ? getXmlValue(applicantBlocks[0], 'nameKoreanLong') : ''

    // 3. 서지정보 - <biblioSummaryInfoArray><biblioSummaryInfo>
    const biblioBlocks = getXmlBlocks(xmlText, 'biblioSummaryInfo')

    let title = ''
    let applicationNumber = trademarkNumber
    let registrationNumber = ''
    let applicationDate = ''
    let registrationDate = ''
    let registerStatus = ''

    if (biblioBlocks.length > 0) {
      const biblioBlock = biblioBlocks[0]
      // 상표명 추출: productNameEng (영문) 또는 productName (한글)
      title = getXmlValue(biblioBlock, 'productNameEng') ||
              getXmlValue(biblioBlock, 'productName')

      console.log(`📋 [KIPRIS] Trademark name for ${trademarkNumber}: "${title}"`)
      applicationNumber = getXmlValue(biblioBlock, 'applicationNumber') || trademarkNumber
      registrationNumber = getXmlValue(biblioBlock, 'registrationNumber')
      applicationDate = getXmlValue(biblioBlock, 'applicationDate')
      registrationDate = getXmlValue(biblioBlock, 'registrationDate')
      registerStatus = getXmlValue(biblioBlock, 'registerStatus')
    }

    // 4. 유사군 코드 - <similarityCodeInfoArray><similarityCodeInfo><similarCode>
    const similarityBlocks = getXmlBlocks(xmlText, 'similarityCodeInfo')
    const similarityCodes = similarityBlocks
      .map(block => getXmlValue(block, 'similarCode'))
      .filter(code => code !== '')

    // 5. 상품분류 - <asignProductArray><asignProduct><mainCode>
    const productBlocks = getXmlBlocks(xmlText, 'asignProduct')
    const productCodes = [...new Set(productBlocks
      .map(block => getXmlValue(block, 'mainCode'))
      .filter(code => code !== ''))]
    const goodsClassificationCode = productCodes.length > 0 ? productCodes.join('|') : ''

    // 이미지 URL (CORS 우회를 위해 프록시 경유)
    const rawImageUrl = imagePath || smallPath || undefined
    const imageUrl = rawImageUrl
      ? `/api/admin/kipris-image-proxy?url=${encodeURIComponent(rawImageUrl)}`
      : undefined

    console.log(`✅ [KIPRIS] Found data for ${trademarkNumber}: ${registerStatus || '(no status)'} | Codes: ${similarityCodes.join(', ')}`)

    return {
      bibliographic: {
        title: title || undefined,
        applicantName: applicantName || undefined,
        applicationNumber,
        registrationNumber: registrationNumber || undefined,
        applicationDate: applicationDate || undefined,
        registrationDate: registrationDate || undefined,
        applicationStatus: registerStatus || undefined,
        goodsClassificationCode: goodsClassificationCode || undefined,
        similarityCodes: similarityCodes.length > 0 ? similarityCodes : undefined
      },
      imageUrl
    }

  } catch (error) {
    console.error(`❌ [KIPRIS] Error fetching ${trademarkNumber}:`, error)
    return null
  }
}
