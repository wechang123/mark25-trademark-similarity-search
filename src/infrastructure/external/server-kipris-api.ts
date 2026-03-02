/**
 * Simplified KIPRIS API integration using only 3 core endpoints
 * 1. Free Search (자유 검색)
 * 2. Trademark Name Search (상표 명칭 검색)  
 * 3. Similarity Code Info (유사군 코드 검색)
 */

import { getAPILogger } from '@/infrastructure/logging/api-logger'

// Define types locally since shared types don't exist
export interface KiprisTrademarkInfo {
  title: string;
  applicationNumber: string;
  registrationNumber?: string;
  applicantName: string;
  applicationDate: string;
  registrationDate?: string;
  applicationStatus: string;
  goodsClassificationCode: string;
  similarityScore?: number;
  pdfFileUrl?: string;
  rejectionReason?: string;
  docName?: string;
  rejectionReasonSummary?: string;
  legalGround?: string;
  similarGroupCodes?: string[];
  designatedProducts?: string;
  imagePath?: string;
  similarityCode?: string;
  similarityCodes?: string[];
  serialNumber?: string;
  thumbnailPath?: string;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'high' | 'medium' | 'low';
  adjustedRiskScore?: number;
  combinedRiskScore?: number;
  similarityCodeOverlap?: {
    overlapCodes: string[];
    overlapPercentage: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    riskScore: number;
  };
  fulltextExistFlag?: string;
}

export interface KiprisSearchResult {
  total: number;
  items: KiprisTrademarkInfo[];
  sameIndustryCount: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  searchQuery: string;
  searchTimestamp: string;
  overlapStatistics?: {
    highOverlapCount: number;
    mediumOverlapCount: number;
    lowOverlapCount: number;
  };
}

/**
 * Main search function that uses only 3 KIPRIS APIs
 */
export async function searchKiprisTrademarks(
  trademark: string,
  productClassificationCodes?: string[],
  similarGroupCodes?: string[],
  designatedProducts?: string[],
  searchTimestamp: string = new Date().toISOString()
): Promise<KiprisSearchResult> {
  const startTime = Date.now()
  const apiLogger = getAPILogger()
  
  console.log(`🔍 [KIPRIS] 상표 검색: "${trademark}"`);
  if (similarGroupCodes && similarGroupCodes.length > 0) {
    console.log(`📊 [KIPRIS] 현재 상표 유사군 코드: ${similarGroupCodes.join(', ')}`);
  }

  // 안전한 문자열 처리
  const safeTrademark = (trademark || "").toString().trim();

  if (!safeTrademark) {
    throw new Error("Invalid trademark parameter");
  }

  // 환경변수 검증
  const kiprisKey = process.env.KIPRIS_SEARCH_API_KEY || process.env.KIPRIS_API_KEY;

  if (!kiprisKey || kiprisKey.trim() === "") {
    console.error("❌ [SERVER] KIPRIS API key is missing");
    throw new Error("KIPRIS API key environment variable is not set");
  }

  try {
    let searchResults: KiprisTrademarkInfo[] = [];

    // PARALLEL EXECUTION: Run free search and trademark name search simultaneously
    const searchPromises: Promise<KiprisTrademarkInfo[]>[] = [
      // 1. Free search (자유 검색)
      performFreeSearch(safeTrademark, kiprisKey),
      // 2. Trademark name search (상표 명칭 검색)
      performTrademarkNameSearch(safeTrademark, kiprisKey)
    ];

    // Execute all searches in parallel
    const allSearchResults = await Promise.all(searchPromises);
    
    // Combine all results
    const combinedResults = allSearchResults.flat();

    // Remove duplicates
    searchResults = removeDuplicateTrademarks(combinedResults);

    // Filter by similar group codes if provided
    if (similarGroupCodes && similarGroupCodes.length > 0) {
      searchResults = filterBySimilarGroupCodes(searchResults, similarGroupCodes);
    }

    // 3. Fetch similarity codes for each trademark
    if (searchResults.length > 0) {
      searchResults = await fetchSimilarityCodes(searchResults, kiprisKey);
    }

    // 결과 분석 및 변환 - 고객 유사군 코드 전달
    const analyzedResults = analyzeResults(
      searchResults,
      safeTrademark,
      searchTimestamp,
      similarGroupCodes // Pass customer's similar group codes for overlap analysis
    );
    
    console.log(`✅ [KIPRIS] 검색 완료: 총 ${searchResults.length}개 발견`);
    
    // Log successful API call (all sessions)
    if (apiLogger) {
      await apiLogger.logAPICall({
        apiType: 'kipris',
        stage: 'kipris_search',
        requestData: {
          trademark: safeTrademark,
          similarGroupCodes,
          designatedProducts,
          productClassificationCodes
        },
        responseData: {
          items: searchResults,
          total: searchResults.length,
          searchTimestamp,
          analyzedResults
        },
        executionTimeMs: Date.now() - startTime
      })
    }
    
    return analyzedResults;

  } catch (error) {
    console.error('❌ [KIPRIS] Search failed:', error);
    
    // Log error (all sessions)
    if (apiLogger) {
      await apiLogger.logAPICall({
        apiType: 'kipris',
        stage: 'kipris_search',
        requestData: { 
          trademark: safeTrademark, 
          similarGroupCodes,
          designatedProducts,
          productClassificationCodes
        },
        responseData: null,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime
      })
    }
    
    throw error;
  }
}

// Types are now defined locally in this file

/**
 * 1. Free Search API (자유 검색)
 */
/**
 * XML 파싱 헬퍼 함수들
 */
export function getXmlValue(xml: string, tag: string): string {
  // 네임스페이스 접두사 처리를 위한 개선된 정규식
  let regex = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([^<]*)<\\/(?:[^:>]+:)?${tag}>`, 'i');
  let match = xml.match(regex);
  
  if (!match) {
    // 대소문자 변형 시도
    regex = new RegExp(`<(?:[^:>]+:)?${tag.toLowerCase()}[^>]*>([^<]*)<\\/(?:[^:>]+:)?${tag.toLowerCase()}>`, 'i');
    match = xml.match(regex);
  }
  
  return match ? match[1].trim() : '';
}

export function getXmlBlocks(xml: string, tag: string): string[] {
  // 더 유연한 정규식 - 네임스페이스와 속성 처리
  const regex = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'gi');
  const matches = xml.match(regex);
  
  if (!matches || matches.length === 0) {
    // 대소문자 변형 시도
    const regexLower = new RegExp(`<(?:[^:>]+:)?${tag.toLowerCase()}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag.toLowerCase()}>`, 'gi');
    const matchesLower = xml.match(regexLower);
    return matchesLower || [];
  }
  
  return matches;
}

/**
 * XML 응답을 KiprisTrademarkInfo 배열로 파싱
 */
function parseXmlResponse(xmlText: string): KiprisTrademarkInfo[] {
  try {
    // 전체 검색 건수 확인 - 대소문자 모두 시도
    let totalCount = getXmlValue(xmlText, 'TotalSearchCount');
    if (!totalCount) {
      totalCount = getXmlValue(xmlText, 'totalSearchCount');
    }
    
    // TradeMarkInfo 블록들 추출 - 다양한 케이스 시도
    let trademarkBlocks = getXmlBlocks(xmlText, 'TradeMarkInfo');
    if (trademarkBlocks.length === 0) {
      trademarkBlocks = getXmlBlocks(xmlText, 'tradeMarkInfo');
    }
    if (trademarkBlocks.length === 0) {
      trademarkBlocks = getXmlBlocks(xmlText, 'trademarkInfo');
    }
    
    if (trademarkBlocks.length === 0) {
      return [];
    }
    
    return trademarkBlocks.map((block) => {
      // 다양한 태그 케이스 시도
      const getValueWithFallback = (block: string, ...tags: string[]): string => {
        for (const tag of tags) {
          const value = getXmlValue(block, tag);
          if (value) return value;
        }
        return '';
      };
      
      const status = getValueWithFallback(block, 'ApplicationStatus', 'applicationStatus');
      const registrationNumber = getValueWithFallback(block, 'RegistrationNumber', 'registrationNumber');
      
      return {
        serialNumber: getValueWithFallback(block, 'SerialNumber', 'serialNumber'),
        applicationNumber: getValueWithFallback(block, 'ApplicationNumber', 'applicationNumber'),
        applicationDate: formatDate(getValueWithFallback(block, 'ApplicationDate', 'applicationDate')),
        registrationNumber,
        registrationDate: formatDate(getValueWithFallback(block, 'RegistrationDate', 'registrationDate')),
        applicationStatus: status,
        goodsClassificationCode: getValueWithFallback(block, 'GoodClassificationCode', 'goodClassificationCode', 'goodsClassificationCode'),
        applicantName: getValueWithFallback(block, 'ApplicantName', 'applicantName'),
        title: getValueWithFallback(block, 'Title', 'title'),
        imagePath: getValueWithFallback(block, 'ImagePath', 'imagePath'),
        thumbnailPath: getValueWithFallback(block, 'ThumbnailPath', 'thumbnailPath'),
        
        // 위험도 자동 계산
        riskLevel: calculateRiskLevel(status, !!registrationNumber),
        similarityScore: 0, // 나중에 계산
        similarityCode: '' // 별도 API로 조회
      };
    });
  } catch (error) {
    console.error('❌ [KIPRIS] XML parse error:', error);
    return [];
  }
}

/**
 * 상태별 위험도 계산
 */
function calculateRiskLevel(
  status: string, 
  hasRegistration: boolean
): 'HIGH' | 'MEDIUM' | 'LOW' {
  // 상태별 위험도 매핑
  const statusRisk: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'> = {
    '등록': 'HIGH',      // 유효한 권리
    '출원': 'MEDIUM',    // 심사 중
    '공고': 'MEDIUM',    // 이의신청 기간
    '거절': 'LOW',       // 권리 없음
    '소멸': 'LOW',       // 만료
    '취하': 'LOW',       // 취하
    '포기': 'LOW',       // 포기
    '무효': 'LOW'        // 무효
  };
  
  return statusRisk[status] || 'LOW';
}

async function performFreeSearch(
  word: string,
  accessKey: string
): Promise<KiprisTrademarkInfo[]> {
  const url = `http://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/freeSearchInfo`;
  const params = new URLSearchParams({
    word,
    accessKey: accessKey,
    docsStart: '1',
    docsCount: '50',
    // 등록 가능성 판단에 유효한 상태만 포함
    application: 'true',    // 출원 - 심사 중
    registration: 'true',   // 등록 - 유효한 권리
    publication: 'true',    // 공고 - 이의신청 기간
    // 충돌 위험이 없는 상태는 제외
    refused: 'false',       // 거절 제외
    expiration: 'false',    // 소멸 제외
    withdrawal: 'false',    // 취하 제외
    abandonment: 'false',   // 포기 제외
    cancel: 'false'         // 무효 제외
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'IP-Doctor/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    
    // XML 응답인지 확인
    if (!text.includes('<?xml') && !text.includes('<response>')) {
      return [];
    }
    
    // Parse XML response
    return parseXmlResponse(text);

  } catch (error) {
    return [];
  }
}

/**
 * 2. Trademark Name Search API (상표 명칭 검색)
 */
async function performTrademarkNameSearch(
  trademarkName: string,
  accessKey: string
): Promise<KiprisTrademarkInfo[]> {
  const url = `http://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/trademarkNameSearchInfo`;
  const params = new URLSearchParams({
    trademarkName,
    docsStart: '1',
    docsCount: '50',
    accessKey: accessKey, 
    // 등록 가능성 판단에 유효한 상태만 포함
    application: 'true',    // 출원 - 심사 중
    registration: 'true',   // 등록 - 유효한 권리
    publication: 'true',    // 공고 - 이의신청 기간
    // 충돌 위험이 없는 상태는 제외
    refused: 'false',       // 거절 제외
    expiration: 'false',    // 소멸 제외
    withdrawal: 'false',    // 취하 제외
    abandonment: 'false',   // 포기 제외
    cancel: 'false'         // 무효 제외
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'IP-Doctor/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    
    // XML 응답인지 확인
    if (!text.includes('<?xml') && !text.includes('<response>')) {
      return [];
    }
    
    // Parse XML response
    return parseXmlResponse(text);

  } catch (error) {
    return [];
  }
}

/**
 * 3. Similarity Code Info API (유사군 코드 검색)
 */
async function fetchSimilarityCodes(
  trademarks: KiprisTrademarkInfo[], 
  accessKey: string
): Promise<KiprisTrademarkInfo[]> {
  // Batch processing for better performance
  const BATCH_SIZE = 10;
  const batches: KiprisTrademarkInfo[][] = [];
  
  // Split into batches
  for (let i = 0; i < trademarks.length; i += BATCH_SIZE) {
    batches.push(trademarks.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`⚙️ [KIPRIS] 유사군 코드 조회: ${batches.length}개 배치 처리 중...`);
  
  const updatedTrademarks: KiprisTrademarkInfo[] = [];
  let successCount = 0;
  
  // Process batches sequentially to avoid rate limiting
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // Process items in each batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (trademark) => {
        if (!trademark.applicationNumber) {
          return trademark;
        }
        
        try {
          const url = `http://plus.kipris.or.kr/openapi/rest/trademarkInfoSearchService/trademarkSimilarityCodeInfo`;
          const params = new URLSearchParams({
            applicationNumber: trademark.applicationNumber,
            accessKey: accessKey
          });
          
          const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/xml',
              'User-Agent': 'IP-Doctor/1.0'
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const text = await response.text();
            const similarityCodes = extractSimilarityCodesFromXml(text);
            
            if (similarityCodes) {
              successCount++;
            }
            
            return {
              ...trademark,
              similarityCode: similarityCodes || trademark.similarityCode,
              // Store as array for easier comparison - Fix: use similarGroupCodes to match repository
              similarGroupCodes: similarityCodes ? similarityCodes.split(',').map(c => c.trim()) : [],
              // Also keep similarityCodes for backward compatibility
              similarityCodes: similarityCodes ? similarityCodes.split(',').map(c => c.trim()) : []
            };
          }
        } catch (error) {
          // Silent fail for individual items
        }
        
        // Return trademark with empty arrays if fetch failed
        return {
          ...trademark,
          similarGroupCodes: [],
          similarityCodes: []
        };
      })
    );
    
    updatedTrademarks.push(...batchResults);
    
    // Add small delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`✅ [KIPRIS] 유사군 코드 조회 완료: ${successCount}/${trademarks.length}개 성공`);
  
  return updatedTrademarks;
}

/**
 * Compare similarity groups between customer and competitor trademarks
 */
function compareSimilarityGroups(
  customerCodes: string[],
  competitorTrademark: KiprisTrademarkInfo
): {
  overlapCodes: string[];
  overlapPercentage: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
} {
  // Get competitor's similarity codes
  const competitorCodes = competitorTrademark.similarityCodes || [];
  
  // If no codes available, assume no overlap
  if (competitorCodes.length === 0 || customerCodes.length === 0) {
    return {
      overlapCodes: [],
      overlapPercentage: 0,
      riskLevel: 'LOW',
      riskScore: 0
    };
  }
  
  // Find overlapping codes
  const overlapCodes = customerCodes.filter(code => 
    competitorCodes.includes(code)
  );
  
  // Calculate overlap percentage (based on customer codes)
  const overlapPercentage = (overlapCodes.length / customerCodes.length) * 100;
  
  // Determine risk level based on overlap
  let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  let riskScore: number;
  
  if (overlapPercentage >= 80) {
    riskLevel = 'HIGH';
    riskScore = 90 + (overlapPercentage - 80) * 0.5; // 90-100
  } else if (overlapPercentage >= 50) {
    riskLevel = 'MEDIUM';
    riskScore = 60 + (overlapPercentage - 50); // 60-90
  } else if (overlapPercentage > 0) {
    riskLevel = 'LOW';
    riskScore = 20 + (overlapPercentage * 0.8); // 20-60
  } else {
    riskLevel = 'LOW';
    riskScore = 0;
  }
  
  return {
    overlapCodes,
    overlapPercentage: Math.round(overlapPercentage),
    riskLevel,
    riskScore: Math.min(100, Math.round(riskScore))
  };
}

/**
 * Parse API response to extract trademark info
 */
// Deprecated - parseApiResponse는 JSON용이므로 제거됨
// 대신 parseXmlResponse 사용

/**
 * Extract similarity codes from API response
 */
function extractSimilarityCodesFromXml(xmlText: string): string {
  try {
    // XML 응답인지 확인
    if (!xmlText.includes('<?xml') && !xmlText.includes('<response>')) {
      return '';
    }
    
    // trademarkSimilarityCodeInfo 블록들 추출
    const codeBlocks = getXmlBlocks(xmlText, 'trademarkSimilarityCodeInfo');
    
    if (codeBlocks.length === 0) {
      return '';
    }
    
    // 각 블록에서 SimilargroupCode 추출
    const codes = codeBlocks
      .map(block => getXmlValue(block, 'SimilargroupCode'))
      .filter(Boolean);
    
    const result = codes.join(',');
    return result;
  } catch (error) {
    console.error('❌ [KIPRIS] Similarity code parse error:', error);
    return '';
  }
}

/**
 * Remove duplicate trademarks
 */
function removeDuplicateTrademarks(trademarks: KiprisTrademarkInfo[]): KiprisTrademarkInfo[] {
  const seen = new Set<string>();
  const unique: KiprisTrademarkInfo[] = [];
  
  for (const trademark of trademarks) {
    const key = trademark.applicationNumber || trademark.title;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(trademark);
    }
  }
  
  console.log(`🧹 Removed ${trademarks.length - unique.length} duplicates`);
  return unique;
}

/**
 * Filter by similar group codes
 */
function filterBySimilarGroupCodes(
  trademarks: KiprisTrademarkInfo[], 
  targetCodes: string[]
): KiprisTrademarkInfo[] {
  // 타겟 코드가 없으면 필터링하지 않음
  if (!targetCodes || targetCodes.length === 0) {
    console.log(`🎯 No filter codes provided, returning all ${trademarks.length} trademarks`);
    return trademarks;
  }
  
  // similarityCode가 없는 경우도 포함 (필터링을 너무 엄격하게 하지 않음)
  const filtered = trademarks.filter(trademark => {
    // similarityCode가 없으면 일단 포함
    if (!trademark.similarityCode) {
      return true;
    }
    
    const codes = trademark.similarityCode.split(',').map(c => c.trim());
    return codes.some(code => targetCodes.includes(code));
  });
  
  console.log(`🎯 Filtered to ${filtered.length}/${trademarks.length} trademarks (including items without similarity codes)`);
  return filtered;
}

/**
 * Analyze and format results
 */
function analyzeResults(
  results: KiprisTrademarkInfo[],
  searchQuery: string,
  searchTimestamp: string,
  customerSimilarGroupCodes?: string[]
): KiprisSearchResult {
  // 상태별 카운트
  const statusCount = {
    registered: results.filter(r => r.applicationStatus === '등록').length,
    pending: results.filter(r => 
      r.applicationStatus === '출원' || 
      r.applicationStatus === '공고'
    ).length,
    total: results.length
  };
  
  // 유사군 코드 겹침 분석 (customerSimilarGroupCodes가 제공된 경우)
  let resultsWithOverlapAnalysis = results;
  let overallRiskScore = 0;
  let highOverlapCount = 0;
  let mediumOverlapCount = 0;
  
  if (customerSimilarGroupCodes && customerSimilarGroupCodes.length > 0) {
    console.log(`🔍 [KIPRIS] Analyzing similarity code overlap with customer codes:`, customerSimilarGroupCodes);
    
    resultsWithOverlapAnalysis = results.map(trademark => {
      const overlapAnalysis = compareSimilarityGroups(
        customerSimilarGroupCodes,
        trademark
      );
      
      // Track overlap statistics
      if (overlapAnalysis.riskLevel === 'HIGH') highOverlapCount++;
      else if (overlapAnalysis.riskLevel === 'MEDIUM') mediumOverlapCount++;
      
      return {
        ...trademark,
        similarityCodeOverlap: overlapAnalysis,
        // Adjust risk based on both status and overlap
        adjustedRiskScore: trademark.applicationStatus === '등록' 
          ? Math.min(100, overlapAnalysis.riskScore * 1.2) // 등록 상표는 위험도 20% 증가
          : overlapAnalysis.riskScore
      };
    });
    
    // Calculate overall risk considering overlap
    const overlapRisk = (highOverlapCount * 100 + mediumOverlapCount * 50) / Math.max(1, statusCount.total);
    overallRiskScore = Math.min(100, (statusCount.registered * 50 / Math.max(1, statusCount.total)) + overlapRisk);
  } else {
    // Original risk calculation when no customer codes provided
    overallRiskScore = Math.min(100, (statusCount.registered * 100) / Math.max(1, statusCount.total));
  }
  
  // 등록 가능성 계산 (역산)
  const registrationProbability = Math.max(0, 100 - overallRiskScore);
  
  // 상표명 유사성 점수 계산
  const resultsWithSimilarity = resultsWithOverlapAnalysis.map(item => ({
    ...item,
    similarityScore: calculateSimilarityScore(searchQuery, item.title || ''),
    // Combined risk considering both name similarity and code overlap
    combinedRiskScore: item.adjustedRiskScore 
      ? Math.min(100, (item.adjustedRiskScore * 0.7) + (calculateSimilarityScore(searchQuery, item.title || '') * 0.3))
      : calculateSimilarityScore(searchQuery, item.title || '')
  }));
  
  // 복합 위험도로 정렬 (높은 순)
  resultsWithSimilarity.sort((a, b) => 
    (b.combinedRiskScore || b.similarityScore) - (a.combinedRiskScore || a.similarityScore)
  );
  
  console.log(`📊 [KIPRIS] Analysis complete:`, {
    total: statusCount.total,
    registered: statusCount.registered,
    pending: statusCount.pending,
    highOverlapCount,
    mediumOverlapCount,
    overallRiskScore: Math.round(overallRiskScore),
    registrationProbability
  });
  
  return {
    total: statusCount.total,
    items: resultsWithSimilarity.slice(0, 100), // 최대 100개
    sameIndustryCount: statusCount.total, // 이미 필터링됨
    riskScore: Math.round(overallRiskScore),
    riskLevel: overallRiskScore > 70 ? 'high' : overallRiskScore > 40 ? 'medium' : 'low',
    searchQuery,
    searchTimestamp,
    // Add overlap statistics to result
    overlapStatistics: customerSimilarGroupCodes ? {
      highOverlapCount,
      mediumOverlapCount,
      lowOverlapCount: statusCount.total - highOverlapCount - mediumOverlapCount
    } : undefined
  };
}

/**
 * Format date string
 */
/**
 * 상표명 유사성 점수 계산
 */
function calculateSimilarityScore(searchTerm: string, trademarkTitle: string): number {
  if (!searchTerm || !trademarkTitle) return 0;
  
  const search = searchTerm.toLowerCase().trim();
  const title = trademarkTitle.toLowerCase().trim();
  
  // 완전 일치
  if (search === title) return 100;
  
  // 포함 관계
  if (title.includes(search) || search.includes(title)) {
    const lengthRatio = Math.min(search.length, title.length) / Math.max(search.length, title.length);
    return Math.round(50 + (lengthRatio * 30)); // 50-80점
  }
  
  // 키워드 일치
  const searchWords = search.split(/\s+/);
  const titleWords = title.split(/\s+/);
  const matchedWords = searchWords.filter(word => 
    titleWords.some(titleWord => titleWord.includes(word))
  );
  
  if (matchedWords.length > 0) {
    const matchRatio = matchedWords.length / searchWords.length;
    return Math.round(30 * matchRatio); // 0-30점
  }
  
  return 0;
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

// Placeholder functions for missing exports (to fix build errors)
// These should be properly implemented when needed
export async function getRejectionReasonFromAPI(applicationNumber: string): Promise<any> {
  console.warn('[KIPRIS] getRejectionReasonFromAPI is not implemented yet');
  return { success: false, error: 'Not implemented' };
}

export async function getRejectionDataFromAPI(keyword: string, options?: any): Promise<any> {
  console.warn('[KIPRIS] getRejectionDataFromAPI is not implemented yet');
  return { success: false, error: 'Not implemented' };
}

export async function fetchRejectionFileContent(filePath: string): Promise<any> {
  console.warn('[KIPRIS] fetchRejectionFileContent is not implemented yet');
  return { success: false, error: 'Not implemented' };
}

// Export additional functions if needed
export {
  performFreeSearch,
  performTrademarkNameSearch,
  fetchSimilarityCodes
};