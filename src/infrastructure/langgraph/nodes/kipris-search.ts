/**
 * kiprisSearchNode - KIPRIS 검색 전용 노드
 * 
 * 특허청 공식 데이터베이스에서 동일/유사 상표 검색을 전담합니다.
 */

import { 
  TrademarkAnalysisState, 
  PartialTrademarkAnalysisState,
  AnalysisResults,
  LangGraphMessage
} from '../types/state';
import { searchKiprisTrademarks, KiprisSearchResult, KiprisTrademarkInfo } from '@/infrastructure/external/server-kipris-api';
// Use KiprisTrademarkInfo as the SimilarTrademark type
type SimilarTrademark = KiprisTrademarkInfo;
// import { niceClassificationMap } from '@/shared/constants/nice-classification'; // Module not found
// import { generateSearchKeywords } from '@/shared/utils/keyword-generator'; // TODO: 유사 상표명 변형 검색 기능 구현 시 활성화
import { createServerClient } from '@/infrastructure/database/server';
import { initializeAPILogger } from '@/infrastructure/logging/api-logger';
import { initializeDataProcessingLogger, getDataProcessingLogger } from '@/infrastructure/logging/data-processing-logger';
import { 
  recordKiprisSearchEvent,
  updateSessionProgress 
} from '@/infrastructure/database/workflow-events';

/**
 * kiprisSearchNode 메인 함수
 * KIPRIS 데이터베이스에서 유사 상표 검색을 수행합니다.
 */
export async function kiprisSearchNode(
  state: TrademarkAnalysisState
): Promise<PartialTrademarkAnalysisState> {
  const startTime = Date.now();
  const sessionId = state.sessionId || 'unknown';
  const isDebugMode = state.isDebugMode || false;
  
  // Initialize loggers for this session
  initializeAPILogger(sessionId, isDebugMode);
  initializeDataProcessingLogger(sessionId, isDebugMode);
  const dataLogger = getDataProcessingLogger();
  
  try {
    console.log(`🔍 [KIPRIS-NODE-${sessionId.slice(0, 8)}] Starting KIPRIS search`);
    
    // 📊 State 디버깅 로그 추가
    console.log(`\n📊 [KIPRIS-NODE-${sessionId.slice(0, 8)}] State Analysis:`);
    console.log(`  ┌─ initialInput:`);
    console.log(`  │  - trademarkName: "${state.initialInput?.trademarkName || 'not found'}"`);
    console.log(`  │  - similarGroupCodes: [${state.initialInput?.similarGroupCodes?.join(', ') || 'empty'}]`);
    console.log(`  │  - designatedProducts: ${state.initialInput?.designatedProducts?.length || 0} items`);
    console.log(`  │`);
    console.log(`  ├─ goodsClassification:`);
    console.log(`  │  - relatedProducts: ${state.goodsClassification?.relatedProducts?.length || 0} items`);
    if (state.goodsClassification?.relatedProducts?.length) {
      const codes = state.goodsClassification.relatedProducts
        .map(p => p.similarGroupCode)
        .filter(Boolean);
      console.log(`  │    → similarGroupCodes: [${codes.join(', ') || 'none'}]`);
    }
    console.log(`  │  - relatedProducts: ${state.goodsClassification?.relatedProducts?.length || 0} items`);
    console.log(`  │  - similarGroupCodes: ${state.goodsClassification?.similarGroupCodes?.length || 0} items`);
    console.log(`  │`);
    console.log(`  └─ No additional analysis results to display`);
    console.log(``);
    
    // Validation check
    const validationResult = validateKiprisSearchInputs(state);
    if (!validationResult.isValid) {
      console.warn(`⚠️ [KIPRIS-NODE-${sessionId.slice(0, 8)}] Validation failed:`, validationResult.errors);
      return await createKiprisFallbackResponse(state, validationResult.errors.join(', '), startTime);
    }

    const progressMessage: LangGraphMessage = {
      role: 'assistant',
      content: `🔍 **KIPRIS 검색 시작**\n\n"${state.initialInput.trademarkName}" 상표의 유사 상표를 검색합니다...`,
      type: 'analysis',
      metadata: { timestamp: new Date().toISOString(), stepName: 'kipris_search_start' }
    };

    // 1. 검색 키워드 생성
    const trademarkName = state.initialInput.trademarkName;
    
    // GoodsClassificationResult 타입에 맞게 수정
    const productClassificationCodes = state.goodsClassification?.primaryClassification 
      ? [state.goodsClassification.primaryClassification.classCode]
      : (state.initialInput.productClassificationCodes || []);
    
    // 🔥 유사군 코드 추출 - 여러 소스에서 탐색
    let similarGroupCodes: string[] = [];
    
    // 1) initialInput에서 (goodsClassifier가 업데이트한 것) - 최우선
    if (state.initialInput?.similarGroupCodes && state.initialInput.similarGroupCodes.length > 0) {
      similarGroupCodes = state.initialInput.similarGroupCodes;
      console.log(`✅ [KIPRIS-NODE] Using similar codes from initialInput: ${similarGroupCodes.join(', ')}`);
    }
    // 2) goodsClassification.relatedProducts에서 추출 (가장 정확한 소스)
    else if (state.goodsClassification?.relatedProducts && state.goodsClassification.relatedProducts.length > 0) {
      const extractedCodes = state.goodsClassification.relatedProducts
        .map(product => product.similarGroupCode)
        .filter(Boolean) // null/undefined 제거
        .filter((code, index, self) => self.indexOf(code) === index); // 중복 제거
      
      if (extractedCodes.length > 0) {
        similarGroupCodes = extractedCodes;
        console.log(`✅ [KIPRIS-NODE] Extracted similar codes from relatedProducts: ${similarGroupCodes.join(', ')}`);
      }
    }
    // 3) Skip - analysisResults.goods not available in current type structure
    // 4) goodsClassification.similarGroupCodes에서
    else if (state.goodsClassification?.similarGroupCodes && state.goodsClassification.similarGroupCodes.length > 0) {
      similarGroupCodes = state.goodsClassification.similarGroupCodes.map(sg => sg.code);
      console.log(`✅ [KIPRIS-NODE] Using similar codes from goodsClassification.similarGroupCodes: ${similarGroupCodes.join(', ')}`);
    }
    // 5) goodsClassification.relatedProducts에서 추출 (마지막 fallback)
    else if (state.goodsClassification?.relatedProducts && state.goodsClassification.relatedProducts.length > 0) {
      const extractedFromRelated = state.goodsClassification.relatedProducts
        .map(product => product.similarGroupCode)
        .filter(Boolean)
        .filter((code, index, self) => self.indexOf(code) === index);
      
      if (extractedFromRelated.length > 0) {
        similarGroupCodes = extractedFromRelated;
        console.log(`✅ [KIPRIS-NODE] Extracted similar codes from relatedProducts: ${similarGroupCodes.join(', ')}`);
      }
    }
    
    // 유사군 코드가 없으면 오류
    if (similarGroupCodes.length === 0) {
      console.error(`❌ [KIPRIS-NODE] No similar group codes found in state`);
      return await createKiprisFallbackResponse(state, '유사군코드가 필요합니다', startTime);
    }
    
    const designatedProducts = state.goodsClassification?.relatedProducts
      ?.map(rp => rp.productName) || state.initialInput.designatedProducts || [];

    // Update session to kipris_search stage
    await updateSessionProgress(sessionId, {
      current_stage: 'kipris_search',
      current_substep: 'kipris_request',
      progress: 40,
      status: 'processing'
    });

    // TODO: 유사 상표명 변형 검색 기능 추가 (예: mark25 -> MARK25, Mark25, mark 25 등)
    // 현재는 입력된 상표명만 검색
    const searchKeywords = [trademarkName];
    console.log(`🔍 [KIPRIS-NODE-${sessionId.slice(0, 8)}] Searching for exact trademark name: "${trademarkName}"`);

    // KIPRIS API 요청 시작
    await recordKiprisSearchEvent(
      sessionId,
      'kipris_request',
      'processing',
      {
        query: trademarkName,
        request_timestamp: new Date().toISOString()
      },
      isDebugMode
    );

    // 2. 병렬 API 호출
    console.log(`🚀 [KIPRIS-NODE-${sessionId.slice(0, 8)}] Starting parallel API calls for ${searchKeywords.length} keywords`);
    console.log(`   Using similar group codes: ${similarGroupCodes.join(', ')}`);
    
    const searchPromises = searchKeywords.map(keyword =>
      searchKiprisTrademarks(
        keyword,
        productClassificationCodes,
        similarGroupCodes,
        designatedProducts
      )
    );
    const searchResults = await Promise.all(searchPromises);

    // KIPRIS API 응답 완료
    await recordKiprisSearchEvent(
      sessionId,
      'kipris_response',
      'completed',
      {
        response_time_ms: Date.now() - startTime,
        total_results: searchResults.reduce((sum, r) => sum + r.items.length, 0)
      },
      isDebugMode
    );

    // 데이터 처리 시작
    await recordKiprisSearchEvent(
      sessionId,
      'data_processing',
      'processing',
      {},
      isDebugMode
    );

    // 3. 결과 취합 및 중복 제거
    const allItems = searchResults.flatMap((result: KiprisSearchResult) => result.items);
    const uniqueItems = Array.from(new Map(allItems.map((item: KiprisTrademarkInfo) => [item.applicationNumber, item])).values());
    
    console.log(`✅ [KIPRIS-NODE-${sessionId.slice(0, 8)}] Total ${allItems.length} items found, ${uniqueItems.length} unique items after merging`);
    
    // Log duplicate removal process
    await dataLogger.logDuplicateRemoval(sessionId, allItems, uniqueItems, 'applicationNumber');

    // 3.5 유사군 코드 추출
    let itemsWithSimilarityCodes = uniqueItems;
    try {
      const { fetchSimilarityCodes } = await import('@/infrastructure/external/server-kipris-api');
      itemsWithSimilarityCodes = await fetchSimilarityCodes(
        uniqueItems,
        process.env.KIPRIS_API_KEY || ''
      );
      console.log(`✅ [KIPRIS-NODE-${sessionId.slice(0, 8)}] Similarity codes fetched for ${itemsWithSimilarityCodes.length} items`);
    } catch (error) {
      console.warn(`⚠️ [KIPRIS-NODE-${sessionId.slice(0, 8)}] Failed to fetch similarity codes:`, error);
      // Continue with items without similarity codes
    }

    // 🔥 NEW: 유사군 코드가 겹치는 상표만 필터링
    const currentSimilarCodes = similarGroupCodes;
    const overlappingTrademarks = itemsWithSimilarityCodes.filter(item => {
      const itemCodes = item.similarGroupCodes || [];
      const hasOverlap = itemCodes.some(code => currentSimilarCodes.includes(code));
      if (hasOverlap) {
        // 겹치는 코드 정보 추가
        (item as any).hasOverlappingCodes = true;
        (item as any).overlappingCodes = itemCodes.filter(code => currentSimilarCodes.includes(code));
      }
      return hasOverlap;
    });

    // Log code overlap check process
    await dataLogger.logCodeOverlapCheck(sessionId, itemsWithSimilarityCodes, overlappingTrademarks, currentSimilarCodes);

    // 간소화된 로그 출력
    console.log(`📊 [KIPRIS] 유사군 코드 분석 완료`);
    console.log(`  현재 상표 코드: ${currentSimilarCodes.join(', ')}`);
    console.log(`  검색 결과: 총 ${itemsWithSimilarityCodes.length}개`);
    console.log(`  유사군 겹침: ${overlappingTrademarks.length}개`);
    
    // 겹치는 상표가 있을 경우 상세 정보 출력
    if (overlappingTrademarks.length > 0) {
      console.log(`\n🎯 [KIPRIS] 유사군 코드가 겹치는 상표 목록:`);
      overlappingTrademarks.slice(0, 5).forEach((tm, idx) => {
        const overlappingCodes = (tm as any).overlappingCodes || [];
        console.log(`  ${idx + 1}. "${tm.title}" (${tm.applicationNumber})`);
        console.log(`     겹치는 코드: [${overlappingCodes.join(', ')}]`);
      });
      if (overlappingTrademarks.length > 5) {
        console.log(`  ... 외 ${overlappingTrademarks.length - 5}개`);
      }
    }

    // KiprisSearchResult with filtered data
    const kiprisResult: KiprisSearchResult = {
      items: itemsWithSimilarityCodes, // 전체 결과 유지
      total: itemsWithSimilarityCodes.length,
      searchQuery: trademarkName,
      searchTimestamp: new Date().toISOString(),
      sameIndustryCount: overlappingTrademarks.length, // 유사군 코드 겹치는 수
      riskScore: overlappingTrademarks.length > 10 ? 70 : overlappingTrademarks.length > 5 ? 50 : 30,
      riskLevel: overlappingTrademarks.length > 10 ? 'high' : overlappingTrademarks.length > 5 ? 'medium' : 'low',
      // 🔥 NEW: 필터링된 데이터 추가
      overlappingTrademarks: overlappingTrademarks,
      overlappingCount: overlappingTrademarks.length
    } as KiprisSearchResult & { overlappingTrademarks: any[], overlappingCount: number };

    const executionTime = Date.now() - startTime;
    console.log(`✅ [KIPRIS-NODE-${sessionId.slice(0, 8)}] KIPRIS multi-search completed in ${executionTime}ms`);

    // 데이터 처리 완료
    await recordKiprisSearchEvent(
      sessionId,
      'data_processing',
      'completed',
      {
        filtered_count: overlappingTrademarks.length,
        high_risk_count: overlappingTrademarks.filter((t: any) => t.status === '등록').length,
        search_results: overlappingTrademarks.slice(0, 10).map((t: any) => ({
          name: t.applicationName,
          applicant: t.applicantName,
          status: t.status,
          codes: t.similarGroupCodes
        }))
      },
      isDebugMode
    );

    // 💾 KIPRIS 검색 결과 DB 저장 - 유사군 코드가 겹치는 것만 저장
    try {
      // 기존 saveKiprisSearchResultsToDatabase 호출 (전체 데이터 저장)
      await saveKiprisSearchResultsToDatabase(sessionId, kiprisResult, searchKeywords);
      
      // 🔥 UPDATED: trademark_analysis.kipris_search_results 테이블에 모든 검색 결과 저장 (관리자 뷰용)
      // Direct Supabase query replacing repository.saveKiprisResultsToTrademarkAnalysis (which doesn't exist)
      const { createServiceRoleClient } = await import('@/infrastructure/database/server');
      const supabase = await createServiceRoleClient();
      
      // 모든 검색 결과를 저장 (유사군 코드 겹침 여부와 상관없이)
      for (const trademark of itemsWithSimilarityCodes) {
        // Fix: Ensure similarity score fits in NUMERIC(3,2) field (max 9.99)
        const rawScore = trademark.similarityScore || 0;
        const adjustedScore = Math.min(rawScore / 10, 9.99);
        
        const kiprisResultData = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          search_query: trademarkName,
          application_number: trademark.applicationNumber || null,
          registration_number: trademark.registrationNumber || null,
          trademark_name: trademark.title || '',
          applicant_name: trademark.applicantName || null,
          status: trademark.applicationStatus || 'unknown',
          application_date: trademark.applicationDate || null,
          registration_date: trademark.registrationDate || null,
          similarity_score: adjustedScore,
          risk_level: rawScore >= 80 ? 'high' : rawScore >= 50 ? 'medium' : 'low',
          similar_group_codes: trademark.similarGroupCodes || [],
          raw_data: trademark,
          is_debug_mode: isDebugMode || false,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .schema('trademark_analysis')
          .from('kipris_search_results')
          .insert(kiprisResultData);

        if (error) {
          console.error('[KIPRIS-NODE] Failed to save KIPRIS result:', {
            error,
            trademarkName: trademark.title,
            sessionId
          });
        }
      }
      
      console.log(`💾 [KIPRIS-NODE-${sessionId.slice(0, 8)}] Saved ${itemsWithSimilarityCodes.length} total trademarks to trademark_analysis (${overlappingTrademarks.length} overlapping)`);
    } catch (saveError) {
      console.warn(`⚠️ [KIPRIS-NODE-${sessionId.slice(0, 8)}] Failed to save search results:`, saveError);
      // Continue execution even if save fails
    }

    const processedResult = await processKiprisResult(kiprisResult, executionTime, sessionId);
    // 🔥 NEW: 필터링된 데이터를 processedResult에 추가
    (processedResult.data as any).overlappingTrademarks = overlappingTrademarks;
    (processedResult.data as any).overlappingCount = overlappingTrademarks.length;
    
    const resultMessage = generateKiprisResultMessage(processedResult, trademarkName);

    // 데이터 처리 완료 이벤트 기록 (검색 결과 포함)
    await recordKiprisSearchEvent(
      sessionId,
      'data_processing',
      'completed',
      {
        total_results: processedResult.data?.similarTrademarks?.length || 0,
        high_risk_count: processedResult.data?.highRiskCount || 0,
        search_results: processedResult.data?.similarTrademarks || []
      },
      isDebugMode
    );

    // Update session progress - KIPRIS search completed
    await updateSessionProgress(sessionId, {
      current_stage: 'kipris_search',
      current_substep: 'data_processing',  // Use the last valid substep instead of 'completed'
      progress: 66,
      status: 'completed'
    });

    const updatedAnalysisResults: AnalysisResults = {
      ...state.analysisResults,
      kipris: processedResult,
      legal: state.analysisResults?.legal || {
        success: false,
        data: undefined,
        error: 'Not started',
        executionTime: 0
      }
    };

    return {
      analysisResults: updatedAnalysisResults,
      conversationHistory: [...state.conversationHistory, progressMessage, resultMessage],
      lastActivity: new Date().toISOString(),
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ [KIPRIS-NODE-${sessionId.slice(0, 8)}] KIPRIS search error:`, error);
    const failedResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime,
      data: undefined
    };
    const errorMessage: LangGraphMessage = {
      role: 'assistant',
      content: '❌ **KIPRIS 검색 실패**\n\nKIPRIS 검색 중 오류가 발생했습니다.',
      type: 'analysis',
      metadata: { timestamp: new Date().toISOString(), stepName: 'kipris_search_error' }
    };
    return {
      analysisResults: { 
        ...state.analysisResults, 
        kipris: failedResult,
        legal: state.analysisResults?.legal || {
          success: false,
          data: undefined,
          error: 'Not started',
          executionTime: 0
        }
      },
      conversationHistory: [...state.conversationHistory, errorMessage],
      errors: [...(state.errors || []), { step: 'kipris_search_node', error: failedResult.error, timestamp: new Date().toISOString(), recoverable: true }],
      lastActivity: new Date().toISOString(),
    };
  }
}

/**
 * KIPRIS 검색 입력 데이터 검증
 * - 상표명: KIPRIS 검색에 필수
 * - 유사군코드: 내부 로직에 필요 (KIPRIS API에서는 사용하지 않음)
 */
function validateKiprisSearchInputs(state: TrademarkAnalysisState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 1. 상표명 검증 (KIPRIS 검색에 필수)
  if (!state.initialInput.trademarkName?.trim()) {
    errors.push('상표명이 필요합니다');
  }
  
  // 2. 유사군코드 검증 (내부 로직에 필요, KIPRIS API에서는 미사용)
  // 여러 위치에서 유사군 코드 확인
  const hasSimilarCodes = 
    (state.initialInput?.similarGroupCodes?.length) ||
    (state.goodsClassification?.relatedProducts?.length && 
     state.goodsClassification.relatedProducts.some(p => p.similarGroupCode)) ||
    (state.goodsClassification?.similarGroupCodes?.length) ||
    (state.goodsClassification?.relatedProducts?.length &&
     state.goodsClassification.relatedProducts.some(p => p.similarGroupCode));
  
  if (!hasSimilarCodes) {
    errors.push('유사군코드가 필요합니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * KiprisTrademarkInfo를 SimilarTrademark 형식으로 변환
 */
function convertKiprisToSimilarTrademark(kiprisInfo: KiprisTrademarkInfo, index: number): SimilarTrademark {
  // Since SimilarTrademark is just an alias for KiprisTrademarkInfo, 
  // we should return the enhanced kiprisInfo object with any additional properties
  
  // Ensure all required properties exist
  const enhanced: KiprisTrademarkInfo = {
    ...kiprisInfo,
    serialNumber: kiprisInfo.serialNumber || `kipris_${index}`,
    title: kiprisInfo.title || 'Unknown',
    applicantName: kiprisInfo.applicantName || 'Unknown',
    applicationNumber: kiprisInfo.applicationNumber || '',
    applicationDate: kiprisInfo.applicationDate || '',
    applicationStatus: kiprisInfo.applicationStatus || 'Unknown',
    goodsClassificationCode: kiprisInfo.goodsClassificationCode || '',
    similarityScore: kiprisInfo.similarityScore || 0,
    riskLevel: kiprisInfo.riskLevel || 'LOW'
  };
  
  return enhanced;
}

/**
 * KIPRIS 검색 결과 처리
 */
async function processKiprisResult(
  kiprisResult: KiprisSearchResult,
  executionTime: number,
  sessionId?: string
): Promise<{
  success: boolean;
  data?: {
    similarTrademarks: SimilarTrademark[];
    totalCount: number;
    searchQuery: string;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    overlappingTrademarks?: any[];
    overlappingCount?: number;
  };
  error?: string;
  executionTime: number;
}> {
  try {
    if (!kiprisResult || !kiprisResult.items) {
      throw new Error('Invalid KIPRIS search result');
    }

    console.log('🔄 [KIPRIS] Processing results', {
      rawItems: kiprisResult.items.length,
      total: kiprisResult.total
    });

    // 🚨 CRITICAL FIX: 거절 사유 조회 기능 추가
    const enhancedItems = await enhanceKiprisResultsWithRejectionInfo(kiprisResult.items);

    // KiprisTrademarkInfo[]를 SimilarTrademark[]로 변환
    const similarTrademarks = enhancedItems.map((item, index) => 
      convertKiprisToSimilarTrademark(item, index)
    );
    
    console.log('✅ [KIPRIS] Converted trademarks', {
      convertedItems: similarTrademarks.length,
      sample: similarTrademarks.slice(0, 2).map(tm => ({
        id: tm.serialNumber || '',
        name: tm.title || '',
        similarity: tm.similarityScore || 0
      }))
    });

    // 💾 의견제출통지서 DB 저장 (세션은 별도 단계에서 전달되므로 여기서는 application_number 캐시)
    try {
      // const supabase = await createServerClient();
      const notices = enhancedItems
        .filter((i) => !!i.applicationNumber && (!!i.pdfFileUrl || !!i.rejectionReason))
        .map((i) => ({
          session_id: null,
          similar_trademark_id: null,
          application_number: i.applicationNumber!,
          decision_number: (i as any).decisionNumber || null,
          doc_name: i.docName || '의견제출통지서',
          rejection_reason: i.rejectionReason || null,
          rejection_reason_summary: i.rejectionReasonSummary || null,
          legal_ground: i.legalGround || null,
          pdf_file_url: i.pdfFileUrl || null,
          rejection_date: (i as any).rejectionDate || null
        }));

      if (notices.length > 0) {
        // Database operations temporarily disabled for cleanup
        console.log('💾 [KIPRIS] Mock save rejection notices:', notices.length);
      }
    } catch (saveErr) {
      console.warn('⚠️ [KIPRIS] Error saving rejection notices:', saveErr);
    }

    // 유사도에 따른 위험도 분류
    const highRiskCount = similarTrademarks.filter(tm => (tm.similarityScore || 0) >= 80).length;
    const mediumRiskCount = similarTrademarks.filter(tm => (tm.similarityScore || 0) >= 50 && (tm.similarityScore || 0) < 80).length;
    const lowRiskCount = similarTrademarks.filter(tm => (tm.similarityScore || 0) < 50).length;
    
    // Log similarity calculation for risk assessment
    if (sessionId && similarTrademarks.length > 0) {
      const dataLogger = getDataProcessingLogger();
      // Add risk level to each trademark for logging
      const trademarksWithRiskLevel = similarTrademarks.map(tm => ({
        ...tm,
        riskLevel: (tm.similarityScore || 0) >= 80 ? 'HIGH' : 
                   (tm.similarityScore || 0) >= 50 ? 'MEDIUM' : 'LOW'
      }));
      
      await dataLogger.logSimilarityCalculation(sessionId, trademarksWithRiskLevel);
    }

    return {
      success: true,
      data: {
        similarTrademarks,
        totalCount: kiprisResult.total || similarTrademarks.length,
        searchQuery: kiprisResult.searchQuery || '',
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        // 유사군 코드 겹침 데이터 추가
        overlappingTrademarks: (kiprisResult as any).overlappingTrademarks || [],
        overlappingCount: (kiprisResult as any).overlappingCount || 0
      },
      executionTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    };
  }
}

/**
 * KIPRIS 결과 메시지 생성
 */
function generateKiprisResultMessage(
  result: {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
  },
  _trademarkName: string
): LangGraphMessage {
  if (!result.success) {
    return {
      role: 'assistant',
      content: `❌ **KIPRIS 검색 실패**\n\n검색 중 오류가 발생했습니다: ${result.error}`,
      type: 'analysis',
      metadata: {
        timestamp: new Date().toISOString(),
        stepName: 'kipris_search_failed',
        analysisChannel: 'KIPRIS',
        executionTime: result.executionTime
      }
    };
  }

  const { data } = result;
  let content = `✅ **KIPRIS 검색 완료**\n\n`;
  
  content += `🔍 **검색 결과**: ${data.totalCount}개의 유사 상표 발견\n\n`;
  
  if (data.totalCount > 0) {
    content += `📊 **위험도별 분류**:\n`;
    content += `🔴 **고위험** (유사도 80% 이상): ${data.highRiskCount}개\n`;
    content += `🟡 **중위험** (유사도 50-79%): ${data.mediumRiskCount}개\n`;
    content += `🟢 **저위험** (유사도 50% 미만): ${data.lowRiskCount}개\n\n`;
    
    if (data.highRiskCount > 0) {
      content += `⚠️ **주의**: 고위험 유사 상표가 발견되었습니다. 상세 분석이 필요합니다.\n\n`;
    }
    
    // 상위 3개 유사 상표 표시
    if (data.similarTrademarks.length > 0) {
      content += `📋 **주요 유사 상표** (상위 3개):\n`;
      data.similarTrademarks.slice(0, 3).forEach((tm: any, index: number) => {
        content += `${index + 1}. "${tm.title}" (${tm.applicantName}) - 유사도 ${tm.similarityScore}%\n`;
      });
    }
  } else {
    content += `✅ 동일하거나 매우 유사한 상표가 발견되지 않았습니다.\n`;
  }
  
  content += `\n⏱️ 검색 시간: ${result.executionTime}ms`;

  return {
    role: 'assistant',
    content,
    type: 'analysis',
    metadata: {
      timestamp: new Date().toISOString(),
      stepName: 'kipris_search_completed',
      analysisChannel: 'KIPRIS',
      executionTime: result.executionTime,
      resultSummary: {
        totalCount: data.totalCount,
        highRiskCount: data.highRiskCount,
        mediumRiskCount: data.mediumRiskCount,
        lowRiskCount: data.lowRiskCount
      }
    }
  };
}

/**
 * KIPRIS 검색 가능 여부 확인
 */
export function canExecuteKiprisSearch(state: TrademarkAnalysisState): boolean {
  const validationResult = validateKiprisSearchInputs(state);
  return validationResult.isValid;
}

/**
 * KIPRIS 검색 우선순위 계산
 */
export function getKiprisSearchPriority(): number {
  // KIPRIS는 공식 데이터베이스이므로 가장 높은 우선순위
  return 1;
}

/**
 * KIPRIS 검색 결과 요약 추출
 */
export function extractKiprisResultSummary(analysisResults: any): {
  isCompleted: boolean;
  isSuccessful: boolean;
  totalSimilarTrademarks: number;
  highRiskCount: number;
  executionTime: number;
} | null {
  if (!analysisResults?.kipris) {
    return null;
  }

  const kipris = analysisResults.kipris;
  
  return {
    isCompleted: true,
    isSuccessful: kipris.success,
    totalSimilarTrademarks: kipris.data?.totalCount || 0,
    highRiskCount: kipris.data?.highRiskCount || 0,
    executionTime: kipris.executionTime || 0
  };
}

/**
 * KIPRIS 검색 실패 시 fallback 응답 생성
 */
async function createKiprisFallbackResponse(
  state: TrademarkAnalysisState, 
  reason: string, 
  startTime: number
): Promise<PartialTrademarkAnalysisState> {
  const executionTime = Date.now() - startTime;
  
  console.log(`⚠️ [LangGraph] Creating KIPRIS fallback response: ${reason}`);
  
  const fallbackMessage: LangGraphMessage = {
    role: 'assistant',
    content: `⚠️ **KIPRIS 검색 대체 분석**\n\n${reason}\n\n기본적인 상표 검토를 진행하겠습니다.`,
    type: 'analysis',
    metadata: {
      timestamp: new Date().toISOString(),
      stepName: 'kipris_fallback',
      analysisChannel: 'KIPRIS',
      executionTime
    }
  };

  return {
    analysisResults: {
      kipris: {
        success: false,
        data: {
          similarTrademarks: [],
          totalCount: 0,
          searchQuery: state.initialInput.trademarkName,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0
        },
        error: reason,
        executionTime
      },
      legal: state.analysisResults?.legal || {
        success: false,
        data: undefined,
        error: 'Not started',
        executionTime: 0
      }
    },
    conversationHistory: [
      ...state.conversationHistory,
      fallbackMessage
    ],
    lastActivity: new Date().toISOString(),
  };
}

/**
 * KIPRIS 검색 결과에 거절 사유 정보를 추가하는 함수
 * Note: Simplified version - rejection reason fetching removed as API is not available
 */
async function enhanceKiprisResultsWithRejectionInfo(
  items: KiprisTrademarkInfo[],
  isCompetitorAnalysis: boolean = false,
  fetchLimit: number = 3,
  concurrency: number = 3
): Promise<KiprisTrademarkInfo[]> {
  console.log(`🔍 [KIPRIS] Processing ${items.length} items (rejection info API not available in simplified version)`);
  
  // In the simplified version, we just return items as-is
  // Rejection reason fetching would require additional API implementation
  return items;
}

/**
 * 사용자가 입력한 경쟁사 상표를 분석하는 함수
 */
export async function analyzeCompetitorTrademarks(
  competitorNames: string[],
  productClassificationCodes: string[],
  similarGroupCodes: string[]
): Promise<{
  success: boolean;
  data?: {
    competitors: Array<{
      name: string;
      searchResults: KiprisTrademarkInfo[];
      rejectionHistory: Array<{
        applicationNumber: string;
        rejectionReasons: string[];
        rejectionDate?: string;
        decisionNumber?: string;
        legalGround?: string;
        docName?: string;
      }>;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    totalRejections: number;
    commonRejectionReasons: string[];
  };
  error?: string;
}> {
  try {
    console.log('🔍 [KIPRIS] Analyzing competitor trademarks:', competitorNames);
    
    const competitorAnalysis = await Promise.all(
      competitorNames.map(async (competitorName) => {
        try {
          // 경쟁사 상표 검색
          const searchResult = await searchKiprisTrademarks(
            competitorName,
            productClassificationCodes,
            similarGroupCodes,
            []
          );

          // 모든 검색 결과에 대해 거절 사유 조회 (경쟁사 분석이므로)
          const enhancedSearchResults = await enhanceKiprisResultsWithRejectionInfo(searchResult.items, true);

          // 거절 이력 추출
          const rejectionHistory = enhancedSearchResults
            .filter(item => item.rejectionReason) // rejectionReason이 존재하는 경우 포함
            .map(item => ({
              applicationNumber: item.applicationNumber!,
              rejectionReasons: [item.rejectionReason || '상세 사유 확인 필요'],
              legalGround: item.legalGround,
              docName: item.docName,
            }));
          
          // 위험도 평가
          const riskLevel = calculateCompetitorRiskLevel(searchResult, rejectionHistory);
          
          return {
            name: competitorName,
            searchResults: enhancedSearchResults,
            rejectionHistory,
            riskLevel
          };
        } catch (error) {
          console.warn(`⚠️ [KIPRIS] Failed to analyze competitor ${competitorName}:`, error);
          return {
            name: competitorName,
            searchResults: [],
            rejectionHistory: [],
            riskLevel: 'LOW' as const
          };
        }
      })
    );
    
    // 전체 거절 이력 통계
    const allRejections = competitorAnalysis.flatMap(comp => comp.rejectionHistory);
    const totalRejections = allRejections.length;
    
    // 공통 거절 사유 분석
    const allRejectionReasons = allRejections.flatMap(rejection => 
      rejection ? rejection.rejectionReasons : []
    );
    const reasonCounts = allRejectionReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonRejectionReasons = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([reason]) => reason);
    
    console.log('✅ [KIPRIS] Competitor analysis completed:', {
      totalCompetitors: competitorAnalysis.length,
      totalRejections,
      commonRejectionReasons
    });
    
    return {
      success: true,
      data: {
        competitors: competitorAnalysis.map(comp => ({
          ...comp,
          rejectionHistory: comp.rejectionHistory.filter((rejection): rejection is NonNullable<typeof rejection> => rejection !== null)
        })),
        totalRejections,
        commonRejectionReasons
      }
    };
    
  } catch (error) {
    console.error('❌ [KIPRIS] Competitor analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Competitor analysis failed'
    };
  }
}

/**
 * 경쟁사 위험도 평가 함수
 */
function calculateCompetitorRiskLevel(
  searchResult: KiprisSearchResult,
  rejectionHistory: any[]
): 'LOW' | 'MEDIUM' | 'HIGH' {
  const totalTrademarks = searchResult.items.length;
  const rejectionCount = rejectionHistory.length;
  const rejectionRate = totalTrademarks > 0 ? rejectionCount / totalTrademarks : 0;
  
  if (rejectionRate >= 0.5 || rejectionCount >= 3) {
    return 'HIGH';
  } else if (rejectionRate >= 0.2 || rejectionCount >= 1) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * KIPRIS 검색 결과를 데이터베이스에 저장
 */
async function saveKiprisSearchResultsToDatabase(
  sessionId: string,
  kiprisResult: KiprisSearchResult,
  searchKeywords: string[]
): Promise<void> {
  try {
    // Direct Supabase queries replacing deprecated repository pattern
    const { createServiceRoleClient } = await import('@/infrastructure/database/server');
    const supabase = await createServiceRoleClient();
    
    // 1. kipris_search_results 테이블에 검색 결과 저장
    // Note: The repository's saveKiprisSearchResults method actually saves to kipris_search_results table
    // It iterates through overlappingTrademarks, but here we'll save all items
    
    if (kiprisResult.items && kiprisResult.items.length > 0) {
      for (const item of kiprisResult.items) {
        const rawScore = item.similarityScore || 0;
        const adjustedScore = Math.min(rawScore / 10, 9.99); // Fit in NUMERIC(3,2)
        
        const kiprisResultData = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          search_query: searchKeywords.join(' '),
          application_number: item.applicationNumber || null,
          registration_number: item.registrationNumber || null,
          trademark_name: item.title || '',
          applicant_name: item.applicantName || null,
          status: item.applicationStatus || 'unknown',
          application_date: item.applicationDate || null,
          registration_date: item.registrationDate || null,
          similarity_score: adjustedScore,
          risk_level: rawScore >= 80 ? 'high' : rawScore >= 50 ? 'medium' : 'low',
          similar_group_codes: item.similarGroupCodes || [],
          raw_data: item,
          is_debug_mode: false,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .schema('trademark_analysis')
          .from('kipris_search_results')
          .insert(kiprisResultData);

        if (error) {
          console.error('[KIPRIS] Failed to save KIPRIS result:', {
            error,
            trademarkName: item.title,
            sessionId
          });
        }
      }
      
      console.log(`✅ [KIPRIS] Saved ${kiprisResult.items.length} search results to kipris_search_results table`);
    }

    // 2. similar_trademarks 테이블 저장은 deprecated - 테이블이 존재하지 않음
    // Repository의 saveSimilarTrademarks 메서드가 null을 반환하므로 skip
    // console.warn('[DEPRECATED] similar_trademarks table does not exist');
    
    // 3. rejection_notices 테이블 저장도 deprecated - 테이블이 존재하지 않음  
    // Repository의 saveRejectionNotices 메서드가 null을 반환하므로 skip
    // console.warn('[DEPRECATED] rejection_notices table does not exist');

  } catch (error) {
    console.error('❌ [KIPRIS] Error saving search results to database:', error);
    throw error;
  }
}

/**
 * 유사도 점수를 기반으로 위험 레벨 계산
 */
// Function removed - risk level calculation moved to comprehensive analysis