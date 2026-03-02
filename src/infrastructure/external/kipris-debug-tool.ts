/**
 * KIPRIS API 디버깅 도구
 * 환경변수, API 연결, 키 검증 등을 종합적으로 테스트
 */

export interface KiprisDebugResult {
  timestamp: string
  environment: {
    kiprisApiKey: {
      exists: boolean
      length: number
      isValid: boolean
      preview: string
    }
    nodeVersion: string
    platform: string
  }
  connectivity: {
    httpsTest: {
      success: boolean
      status?: number
      error?: string
      responseTime?: number
    }
    httpTest: {
      success: boolean
      status?: number  
      error?: string
      responseTime?: number
    }
  }
  apiTest: {
    success: boolean
    responseStatus?: number
    responseLength?: number
    hasValidXml?: boolean
    errorMessage?: string
    sampleData?: any
  }
  recommendations: string[]
}

export async function debugKiprisConnection(): Promise<KiprisDebugResult> {
  const startTime = Date.now()
  console.log("🔍 [KIPRIS-DEBUG] Starting comprehensive KIPRIS debugging...")

  const result: KiprisDebugResult = {
    timestamp: new Date().toISOString(),
    environment: {
      kiprisApiKey: {
        exists: false,
        length: 0,
        isValid: false,
        preview: "N/A"
      },
      nodeVersion: process.version,
      platform: process.platform
    },
    connectivity: {
      httpsTest: { success: false },
      httpTest: { success: false }
    },
    apiTest: {
      success: false
    },
    recommendations: []
  }

  // 1. 환경변수 검증
  console.log("🔑 [KIPRIS-DEBUG] Step 1: Environment Variable Check")
  const kiprisApiKey = process.env.KIPRIS_API_KEY
  
  result.environment.kiprisApiKey = {
    exists: !!kiprisApiKey,
    length: kiprisApiKey?.length || 0,
    isValid: isValidKiprisKey(kiprisApiKey),
    preview: kiprisApiKey ? `${kiprisApiKey.substring(0, 10)}...` : "N/A"
  }

  if (!kiprisApiKey) {
    result.recommendations.push("KIPRIS_API_KEY 환경변수가 설정되지 않았습니다.")
    return result
  }

  if (!isValidKiprisKey(kiprisApiKey)) {
    result.recommendations.push("KIPRIS_API_KEY 형식이 올바르지 않습니다. KIPRIS에서 발급받은 키인지 확인하세요.")
  }

  // 2. 연결성 테스트
  console.log("🌐 [KIPRIS-DEBUG] Step 2: Connectivity Tests")
  
  // HTTPS 테스트
  try {
    const httpsStart = Date.now()
    const httpsResponse = await testConnection("https://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/freeSearchInfo")
    result.connectivity.httpsTest = {
      success: httpsResponse.ok,
      status: httpsResponse.status,
      responseTime: Date.now() - httpsStart
    }
  } catch (error) {
    result.connectivity.httpsTest = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  // HTTP 테스트  
  try {
    const httpStart = Date.now()
    const httpResponse = await testConnection("http://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/freeSearchInfo")
    result.connectivity.httpTest = {
      success: httpResponse.ok,
      status: httpResponse.status,
      responseTime: Date.now() - httpStart
    }
  } catch (error) {
    result.connectivity.httpTest = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }

  // 3. 실제 API 테스트
  console.log("📡 [KIPRIS-DEBUG] Step 3: API Test with Real Key")
  
  // 연결 가능한 URL 선택
  const workingUrl = result.connectivity.httpsTest.success 
    ? "https://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/freeSearchInfo"
    : result.connectivity.httpTest.success
    ? "http://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/freeSearchInfo"
    : null

  if (workingUrl) {
    try {
      const apiTestResult = await testKiprisApi(workingUrl, kiprisApiKey)
      result.apiTest = apiTestResult
    } catch (error) {
      result.apiTest = {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      }
    }
  } else {
    result.apiTest = {
      success: false,
      errorMessage: "No working connection found"
    }
    result.recommendations.push("KIPRIS 서버에 연결할 수 없습니다. 네트워크 설정을 확인하세요.")
  }

  // 4. 권장사항 생성
  generateRecommendations(result)

  const totalTime = Date.now() - startTime
  console.log(`✅ [KIPRIS-DEBUG] Debug completed in ${totalTime}ms`)
  
  return result
}

function isValidKiprisKey(key?: string): boolean {
  if (!key) return false
  
  // KIPRIS API 키는 일반적으로 특정 패턴을 가짐
  // 영문자, 숫자, 특수문자(=, /, +) 조합으로 20자 이상
  const kiprisKeyPattern = /^[A-Za-z0-9+/=]{20,}$/
  return kiprisKeyPattern.test(key)
}

async function testConnection(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, {
      method: "HEAD", // GET 대신 HEAD 사용하여 빠른 연결 테스트
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function testKiprisApi(baseUrl: string, apiKey: string) {
  const testUrl = `${baseUrl}?word=테스트&docsStart=1&docsCount=1&accessKey=${apiKey}`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/xml, text/xml, */*",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8"
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const responseText = await response.text()
    
    return {
      success: response.ok,
      responseStatus: response.status,
      responseLength: responseText.length,
      hasValidXml: responseText.includes("<?xml") && responseText.includes("<response>"),
      sampleData: responseText.substring(0, 300)
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

function generateRecommendations(result: KiprisDebugResult) {
  const recommendations = result.recommendations

  if (!result.environment.kiprisApiKey.exists) {
    recommendations.push("1. .env.local 파일에 KIPRIS_API_KEY를 설정하세요.")
    recommendations.push("2. KIPRIS 홈페이지에서 API 키를 발급받으세요.")
    return
  }

  if (!result.environment.kiprisApiKey.isValid) {
    recommendations.push("API 키 형식이 올바르지 않습니다. KIPRIS에서 발급받은 정확한 키인지 확인하세요.")
  }

  if (!result.connectivity.httpsTest.success && !result.connectivity.httpTest.success) {
    recommendations.push("KIPRIS 서버에 연결할 수 없습니다. 방화벽이나 네트워크 설정을 확인하세요.")
    recommendations.push("회사 네트워크에서는 프록시 설정이 필요할 수 있습니다.")
  }

  if (!result.apiTest.success) {
    if (result.apiTest.responseStatus === 403) {
      recommendations.push("API 키가 유효하지 않거나 권한이 없습니다.")
      recommendations.push("KIPRIS에서 발급받은 API 키가 활성화되었는지 확인하세요.")
    } else if (result.apiTest.responseStatus === 429) {
      recommendations.push("API 호출 한도를 초과했습니다. 잠시 후 다시 시도하세요.")
    } else {
      recommendations.push("API 호출에 실패했습니다. API 키와 요청 형식을 확인하세요.")
    }
  }

  if (result.apiTest.success && !result.apiTest.hasValidXml) {
    recommendations.push("API 응답이 유효한 XML 형식이 아닙니다. API 엔드포인트를 확인하세요.")
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ 모든 테스트가 성공적으로 완료되었습니다!")
  }
} 