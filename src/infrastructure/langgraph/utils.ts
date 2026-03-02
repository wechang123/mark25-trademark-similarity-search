/**
 * LangGraph 시스템 편의 함수들
 * 
 * 자주 사용되는 패턴과 헬퍼 함수들을 제공합니다.
 */

import { 
  TrademarkAnalysisState, 
  WorkflowConfig 
} from './types/state';
import { 
  createWorkflowRunner,
  TrademarkAnalysisWorkflowRunner 
} from './trademark-workflow';
import { createInitialState, getStateSummary } from './types/state-utils';

/**
 * 빠른 분석 시작
 * 간단한 인터페이스로 분석을 시작할 수 있습니다.
 */
export async function createQuickAnalysis(params: {
  trademarkName: string;
  businessDescription: string;
  imageUrl?: string;
  productClassificationCodes?: string[];
  similarGroupCodes?: string[];
  designatedProducts?: string[];
  userId?: string;
  config?: Partial<WorkflowConfig>;
}): Promise<{
  sessionId: string;
  runner: TrademarkAnalysisWorkflowRunner;
  initialState: TrademarkAnalysisState;
}> {
  console.log('🚀 [LangGraph Utils] Creating quick analysis for:', params.trademarkName);

  // 1. 워크플로우 러너 생성
  const runner = createWorkflowRunner(params.config);

  // 2. 세션 ID 생성
  const sessionId = `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 3. 초기 입력 구성
  const initialInput = {
    type: params.imageUrl ? 'combined' as const : 'text' as const,
    trademarkName: params.trademarkName,
    businessDescription: params.businessDescription,
    imageUrl: params.imageUrl,
    productClassificationCodes: params.productClassificationCodes || ['35'],
    similarGroupCodes: params.similarGroupCodes || ['N0201'],
    designatedProducts: params.designatedProducts || ['광고업', '사업관리']
  };

  // 4. 초기 상태 생성
  const initialState = createInitialState({
    sessionId,
    initialInput,
    userId: params.userId
  });

  console.log('✅ [LangGraph Utils] Quick analysis setup completed:', sessionId);

  return {
    sessionId,
    runner,
    initialState
  };
}

/**
 * 상태에서 분석 재개
 */
export async function resumeAnalysisFromState(
  state: TrademarkAnalysisState,
  userInput?: {
    type: 'response' | 'confirmation';
    content: string;
    metadata?: any;
  },
  config?: Partial<WorkflowConfig>
): Promise<TrademarkAnalysisState> {
  console.log('🔄 [LangGraph Utils] Resuming analysis from state:', {
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    hasUserInput: !!userInput
  });

  const runner = createWorkflowRunner(config);
  
  try {
    const result = await runner.resumeAnalysis(state, userInput);
    console.log('✅ [LangGraph Utils] Analysis resumed successfully');
    return result;
  } catch (error) {
    console.error('❌ [LangGraph Utils] Failed to resume analysis:', error);
    throw error;
  }
}

/**
 * 새로운 정규화된 데이터베이스에서 분석 상태를 복원하고 재시작
 */
export async function resumeAnalysisFromDatabase(
  sessionId: string,
  userInput?: {
    type: 'response' | 'confirmation';
    content: string;
    metadata?: any;
  },
  config?: Partial<WorkflowConfig>
): Promise<TrademarkAnalysisState> {
  console.log('🔄 [LangGraph Utils] Resuming analysis from database:', sessionId);

  try {
    // 1. 데이터베이스에서 전체 분석 결과 복원
    const reconstructedResult = await reconstructAnalysisFromDatabase(sessionId);
    
    // 2. TrademarkAnalysisState 형식으로 변환
    const restoredState: TrademarkAnalysisState = {
      sessionId: reconstructedResult.searchId,
      initialInput: {
        type: 'text', // 기본값, 필요시 세션 정보에서 가져올 수 있음
        trademarkName: reconstructedResult.trademarkName,
        businessDescription: reconstructedResult.businessDescription,
        productClassificationCodes: reconstructedResult.productClassifications?.map((pc: any) => pc.code) || ['35'],
        similarGroupCodes: reconstructedResult.productClassifications?.flatMap((pc: any) => pc.similarGroupCodes) || ['G3501'],
        designatedProducts: reconstructedResult.productClassifications?.flatMap((pc: any) => pc.designatedProducts) || ['광고업']
      },
      currentStep: reconstructedResult.status === 'completed' ? 'COMPLETE' : 'ANALYZING',
      progress: reconstructedResult.status === 'completed' ? 100 : 50,
      informationChecklist: {
        basicInfoCollected: true,
        analysisReady: true,
        designStory: false,
        businessScale: false,
        previousTrademark: false
      },
      currentSubStep: reconstructedResult.status === 'completed' ? '분석 완료' : '분석 진행 중',
      createdAt: reconstructedResult.createdAt,
      lastActivity: reconstructedResult.updatedAt,
      conversationHistory: reconstructedResult.conversationHistory?.map((conv: any) => ({
        role: conv.role,
        content: conv.content,
        type: conv.type || 'chat',
        metadata: conv.metadata || { timestamp: new Date().toISOString() }
      })) || [],
      
      // 분석 결과 (완료된 경우)
      ...(reconstructedResult.status === 'completed' && {
        finalReport: {
          metadata: {
            reportId: reconstructedResult.searchId,
            analysisVersion: '2.0-normalized',
            generatedAt: reconstructedResult.completedAt || reconstructedResult.updatedAt,
            trademarkName: reconstructedResult.trademarkName
          },
          summary: {
            registrationPossibility: reconstructedResult.aiAnalysis?.probability || 50,
            overallRisk: reconstructedResult.riskLevel === 'HIGH' ? '위험' : 
                        reconstructedResult.riskLevel === 'LOW' ? '안전' : '주의',
            aiConfidence: reconstructedResult.aiAnalysis?.confidence || 85
          },
          legalRisk: {
            riskFactors: reconstructedResult.keyFindings || []
          },
          similarTrademarks: {
            totalCount: reconstructedResult.similarTrademarks?.length || 0,
            highRiskCount: reconstructedResult.similarTrademarks?.filter((st: any) => st.similarity >= 70).length || 0,
            trademarks: reconstructedResult.similarTrademarks || [],
            imageAnalysisIncluded: false
          },
          conclusion: {
            strategicAdvice: reconstructedResult.aiAnalysis?.recommendations || ['전문가 상담 권장']
          },
          ...(reconstructedResult.expertAnalysis && {
            expertAnalysis: reconstructedResult.expertAnalysis
          })
        }
      }),

      // 분석 결과 원본 데이터
      analysisResults: reconstructedResult.kiprisData ? {
        kipris: {
          success: reconstructedResult.kiprisData.success,
          data: {
            similarTrademarks: reconstructedResult.similarTrademarks || [],
            totalCount: reconstructedResult.kiprisData.totalResults,
            searchQuery: reconstructedResult.kiprisData.searchQuery
          },
          executionTime: reconstructedResult.kiprisData.executionTime
        },
        legal: {
          success: true,
          data: {
            relevantLaws: [],
            riskFactors: reconstructedResult.keyFindings || [],
            recommendations: reconstructedResult.aiAnalysis?.recommendations || []
          },
          executionTime: 0
        }
      } : undefined
    };

    console.log('✅ [LangGraph Utils] State restored from database:', {
      sessionId: restoredState.sessionId,
      currentStep: restoredState.currentStep,
      progress: restoredState.progress,
      hasConversationHistory: restoredState.conversationHistory.length > 0,
      hasFinalReport: !!restoredState.finalReport
    });

    // 3. 분석 재시작 (완료되지 않은 경우)
    if (restoredState.currentStep !== 'COMPLETE') {
      console.log('🚀 [LangGraph Utils] Resuming incomplete analysis');
      return await resumeAnalysisFromState(restoredState, userInput, config);
    }

    // 4. 완료된 분석인 경우 그대로 반환
    return restoredState;

  } catch (error) {
    console.error('❌ [LangGraph Utils] Failed to resume analysis from database:', error);
    throw error;
  }
}

/**
 * 분석 상태 조회
 */
export function getAnalysisStatus(state: TrademarkAnalysisState): {
  sessionId: string;
  currentStep: string;
  progress: number;
  isRunning: boolean;
  isComplete: boolean;
  hasError: boolean;
  canResume: boolean;
  needsUserInput: boolean;
  estimatedTimeRemaining?: string;
  summary: string;
} {
  const isRunning = !['COMPLETE', 'ERROR'].includes(state.currentStep);
  const isComplete = state.currentStep === 'COMPLETE';
  const hasError = state.currentStep === 'ERROR' || (state.errors?.length || 0) > 0;
  const canResume = !isComplete && !hasError;
  const needsUserInput = ['COLLECTING', 'CONFIRMING'].includes(state.currentStep);

  // 예상 남은 시간 계산
  let estimatedTimeRemaining: string | undefined;
  if (isRunning && state.analysisStartTime) {
    const elapsed = Date.now() - new Date(state.analysisStartTime).getTime();
    const progressRatio = state.progress / 100;
    
    if (progressRatio > 0.1) {
      const estimatedTotal = elapsed / progressRatio;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      
      if (remaining > 60000) {
        estimatedTimeRemaining = `약 ${Math.round(remaining / 60000)}분`;
      } else {
        estimatedTimeRemaining = `약 ${Math.round(remaining / 1000)}초`;
      }
    }
  }

  // 상태 요약 생성
  let summary = '';
  if (isComplete) {
    const possibility = state.finalReport?.summary.registrationPossibility;
    summary = possibility ? `분석 완료 - 등록 가능성 ${possibility}%` : '분석 완료';
  } else if (hasError) {
    const lastError = state.errors?.[state.errors.length - 1];
    summary = `오류 발생: ${lastError?.error || '알 수 없는 오류'}`;
  } else if (needsUserInput) {
    summary = state.currentStep === 'COLLECTING' ? '정보 수집 중' : '사용자 확인 필요';
  } else {
    summary = state.currentSubStep || state.currentStep;
  }

  return {
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    progress: state.progress,
    isRunning,
    isComplete,
    hasError,
    canResume,
    needsUserInput,
    estimatedTimeRemaining,
    summary
  };
}

/**
 * 새로운 정규화된 데이터베이스에서 분석 상태 조회
 */
export async function getAnalysisStatusFromDatabase(sessionId: string): Promise<{
  sessionId: string;
  currentStep: string;
  progress: number;
  isRunning: boolean;
  isComplete: boolean;
  hasError: boolean;
  canResume: boolean;
  needsUserInput: boolean;
  estimatedTimeRemaining?: string;
  summary: string;
  trademarkName?: string;
  registrationProbability?: number;
}> {
  const { createServerClient } = await import('@/infrastructure/database/server');
  const supabase = await createServerClient();

  try {
    // 1. 세션 기본 정보 조회
    const { data: session, error: sessionError } = await supabase
      .schema('trademark_analysis')
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 2. 최종 결과 조회
    const { data: finalResult } = await supabase
      .schema('trademark_analysis')
      .from('final_results')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // 3. 워크플로우 체크포인트 조회 (최신 상태)
    const { data: latestCheckpoint } = await supabase
      .schema('trademark_analysis')
      .from('workflow_checkpoints')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 상태 분석
    const isComplete = session.status === 'completed';
    const isRunning = session.status === 'analyzing';
    const hasError = session.status === 'error';
    const canResume = !isComplete && !hasError;
    const needsUserInput = session.status === 'pending_user_input';

    // 요약 생성
    let summary = '';
    if (isComplete && finalResult) {
      summary = `분석 완료 - 등록 가능성 ${finalResult.registration_probability}%`;
    } else if (hasError) {
      summary = '오류 발생';
    } else if (needsUserInput) {
      summary = '사용자 확인 필요';
    } else if (isRunning) {
      summary = latestCheckpoint?.step_name || '분석 진행 중';
    }

    return {
      sessionId: session.id,
      currentStep: latestCheckpoint?.step_name || session.status,
      progress: session.progress || 0,
      isRunning,
      isComplete,
      hasError,
      canResume,
      needsUserInput,
      summary,
      trademarkName: session.trademark_name,
      registrationProbability: finalResult?.registration_probability
    };

  } catch (error) {
    console.error('❌ [LangGraph] Failed to get analysis status from database:', error);
    throw error;
  }
}

/**
 * 정규화된 데이터베이스에서 완전한 분석 결과 복원
 */
export async function reconstructAnalysisFromDatabase(sessionId: string): Promise<any> {
  const { createServerClient } = await import('@/infrastructure/database/server');
  const supabase = await createServerClient();

  try {
    // 1. 세션 정보
    const { data: session, error: sessionError } = await supabase
      .schema('trademark_analysis')
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 2. 대화 기록
    const { data: conversations } = await supabase
      .schema('trademark_analysis')
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // 3. 유사 상표 목록
    const { data: similarTrademarks } = await supabase
      .schema('trademark_analysis')
      .from('similar_trademarks')
      .select('*')
      .eq('session_id', sessionId)
      .order('similarity_score', { ascending: false });

    // 4. 최종 결과
    const { data: finalResult } = await supabase
      .schema('trademark_analysis')
      .from('final_results')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // 5. 전문가 분석 결과
    const { data: expertQueries } = await supabase
      .schema('trademark_analysis')
      .from('expert_queries')
      .select('*')
      .eq('session_id', sessionId)
      .limit(1);

    // 6. 상품 분류
    const { data: productClassifications } = await supabase
      .schema('trademark_analysis')
      .from('product_classifications')
      .select('*')
      .eq('session_id', sessionId);

    // 7. KIPRIS 검색 결과
    const { data: kiprisSearches } = await supabase
      .schema('trademark_analysis')
      .from('kipris_searches')
      .select('*')
      .eq('session_id', sessionId)
      .limit(1);

    // TrademarkAnalysisResult 형식으로 재구성
    const reconstructedResult = {
      searchId: session.id,
      trademarkName: session.trademark_name,
      businessDescription: session.business_description,
      industry: 'it', // 기본값
      status: session.status,
      
      // AI 분석 결과
      aiAnalysis: finalResult ? {
        summary: `등록 가능성 ${finalResult.registration_probability}%`,
        probability: finalResult.registration_probability,
        confidence: finalResult.ai_confidence,
        risks: finalResult.legal_risks || [],
        recommendations: finalResult.strategic_recommendations || []
      } : null,

      // 유사 상표 목록
      similarTrademarks: similarTrademarks?.map(st => ({
        id: st.id,
        name: st.trademark_name,
        applicant: st.applicant,
        similarity: st.similarity_score,
        status: st.status,
        applicationDate: st.application_date,
        classification: {
          mainClass: st.classification_codes?.[0] || '35',
          mainClassName: `제${st.classification_codes?.[0] || '35'}류`,
          designatedProducts: Array.isArray(st.classification_codes) ? st.classification_codes : ['광고업']
        },
        riskAnalysis: st.conflict_analysis || { level: st.risk_level, factors: [], conflictProbability: st.similarity_score },
        imageUrl: st.image_url
      })) || [],

      // 위험도 정보
      riskLevel: finalResult?.risk_level || 'MEDIUM',
      riskScore: finalResult?.risk_score || 50,
      keyFindings: finalResult?.key_findings || [],

      // 전문가 분석
      expertAnalysis: expertQueries?.[0]?.response_content || null,

      // 메타데이터
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      completedAt: session.completed_at,

      // 추가된 정보들
      conversationHistory: conversations?.map(conv => ({
        role: conv.role,
        content: conv.content,
        type: conv.message_type,
        metadata: conv.metadata
      })) || [],

      productClassifications: productClassifications?.map(pc => ({
        code: pc.nice_class_code,
        name: pc.class_name,
        designatedProducts: pc.designated_products,
        similarGroupCodes: pc.similar_group_codes,
        confidence: pc.confidence_score
      })) || [],

      kiprisData: kiprisSearches?.[0] ? {
        searchQuery: kiprisSearches[0].search_query,
        totalResults: kiprisSearches[0].total_results,
        executionTime: kiprisSearches[0].execution_time_ms,
        success: kiprisSearches[0].success,
        rawResponse: kiprisSearches[0].raw_response
      } : null
    };

    console.log('✅ [LangGraph] Successfully reconstructed analysis from database:', {
      sessionId,
      similarTrademarkCount: similarTrademarks?.length || 0,
      conversationCount: conversations?.length || 0,
      hasExpertAnalysis: !!expertQueries?.[0],
      hasFinalResult: !!finalResult
    });

    return reconstructedResult;

  } catch (error) {
    console.error('❌ [LangGraph] Failed to reconstruct analysis from database:', error);
    throw error;
  }
}

/**
 * 분석 취소
 */
export async function cancelAnalysis(
  state: TrademarkAnalysisState,
  reason?: string
): Promise<TrademarkAnalysisState> {
  console.log('❌ [LangGraph Utils] Cancelling analysis:', state.sessionId, reason);

  const cancelledState: TrademarkAnalysisState = {
    ...state,
    currentStep: 'ERROR',
    progress: 0,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        content: `분석이 취소되었습니다. ${reason || ''}`,
        type: 'response',
        metadata: {
          timestamp: new Date().toISOString(),
          stepName: 'analysis_cancelled'
        }
      }
    ],
    errors: [
      ...(state.errors || []),
      {
        step: 'user_cancellation',
        error: reason || 'Analysis cancelled by user',
        timestamp: new Date().toISOString(),
        recoverable: false
      }
    ],
    lastActivity: new Date().toISOString(),
    analysisEndTime: new Date().toISOString()
  };

  return cancelledState;
}

/**
 * 분석 결과 요약 생성
 */
export function generateAnalysisSummary(state: TrademarkAnalysisState): {
  basic: string;
  detailed: string;
  keyPoints: string[];
  recommendations: string[];
} {
  const report = state.finalReport;
  
  if (!report) {
    return {
      basic: '분석이 완료되지 않았습니다.',
      detailed: '분석이 진행 중이거나 오류가 발생했습니다.',
      keyPoints: [],
      recommendations: []
    };
  }

  const basic = `${report.metadata.trademarkName} 상표의 등록 가능성은 ${report.summary.registrationPossibility}%이며, 전체적으로 ${report.summary.overallRisk} 수준입니다.`;

  const detailed = `
상표 "${report.metadata.trademarkName}"에 대한 전문 분석 결과:

📊 **핵심 지표**
- 등록 가능성: ${report.summary.registrationPossibility}%
- 위험도: ${report.summary.overallRisk}
- AI 신뢰도: ${report.summary.aiConfidence}%

🔍 **유사 상표 분석**
- 발견된 유사 상표: ${report.similarTrademarks.totalCount}개
- 고위험 상표: ${report.similarTrademarks.highRiskCount}개
- 이미지 분석 포함: ${report.similarTrademarks.imageAnalysisIncluded ? '예' : '아니오'}

⚖️ **법률 위험도**
- 위험 수준: ${report.legalRisk.riskLevel}
- 주요 위험 요소: ${report.legalRisk.riskFactors.slice(0, 2).join(', ')}

💡 **권장 조치**
${report.conclusion.recommendation === 'PROCEED' ? '✅ 출원 진행 권장' :
  report.conclusion.recommendation === 'PROCEED_WITH_CAUTION' ? '⚠️ 신중한 검토 후 진행' :
  report.conclusion.recommendation === 'MODIFY_APPROACH' ? '🔄 상표 수정 후 재검토' :
  '🎯 대안 전략 수립'}
`.trim();

  return {
    basic,
    detailed,
    keyPoints: report.summary.keyFindings,
    recommendations: report.conclusion.strategicAdvice
  };
}

/**
 * 워크플로우 성능 분석
 */
export function analyzeWorkflowPerformance(state: TrademarkAnalysisState): {
  totalTime: number;
  stepTimes: Record<string, number>;
  bottlenecks: string[];
  efficiency: number;
  suggestions: string[];
} {
  const startTime = state.analysisStartTime ? new Date(state.analysisStartTime).getTime() : Date.now();
  const endTime = state.analysisEndTime ? new Date(state.analysisEndTime).getTime() : Date.now();
  const totalTime = endTime - startTime;

  // 대화 기록에서 단계별 시간 추출
  const stepTimes: Record<string, number> = {};
  const stepOrder = ['INITIAL', 'COLLECTING', 'ANALYZING', 'SYNTHESIZING', 'COMPLETE'];
  
  let lastTimestamp = startTime;
  for (const message of state.conversationHistory) {
    if (message.metadata?.stepName) {
      const messageTime = new Date(message.metadata.timestamp || 0).getTime();
      const stepDuration = messageTime - lastTimestamp;
      
      if (stepDuration > 0) {
        stepTimes[message.metadata.stepName] = 
          (stepTimes[message.metadata.stepName] || 0) + stepDuration;
      }
      
      lastTimestamp = messageTime;
    }
  }

  // 병목 구간 식별
  const bottlenecks: string[] = [];
  const avgStepTime = totalTime / stepOrder.length;
  
  for (const [step, time] of Object.entries(stepTimes)) {
    if (time > avgStepTime * 1.5) {
      bottlenecks.push(step);
    }
  }

  // 효율성 계산 (0-100)
  const expectedTime = 60000; // 1분 기대 시간
  const efficiency = Math.max(0, Math.min(100, (expectedTime / totalTime) * 100));

  // 개선 제안
  const suggestions: string[] = [];
  
  if (totalTime > 180000) { // 3분 초과
    suggestions.push('전체 분석 시간이 길어지고 있습니다. 병렬 처리 최적화를 고려하세요.');
  }
  
  if (bottlenecks.includes('ANALYZING')) {
    suggestions.push('분석 단계가 병목입니다. 외부 API 호출 최적화를 검토하세요.');
  }
  
  if (state.errors && state.errors.length > 0) {
    suggestions.push('오류가 발생했습니다. 에러 처리 및 재시도 로직을 개선하세요.');
  }

  return {
    totalTime,
    stepTimes,
    bottlenecks,
    efficiency: Math.round(efficiency),
    suggestions
  };
}

/**
 * 디버그 정보 수집
 */
export function collectDebugInfo(state: TrademarkAnalysisState): {
  sessionId: string;
  version: string;
  timestamp: string;
  state: {
    current: string;
    progress: number;
    conversationLength: number;
    hasResults: boolean;
    hasErrors: boolean;
  };
  performance: ReturnType<typeof analyzeWorkflowPerformance>;
  errors: Array<{
    step: string;
    error: string;
    timestamp: string;
    recoverable: boolean;
  }>;
  metadata: {
    userId?: string;
    createdAt: string;
    lastActivity: string;
    executionTime?: number;
  };
} {
  return {
    sessionId: state.sessionId,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    state: {
      current: state.currentStep,
      progress: state.progress,
      conversationLength: state.conversationHistory.length,
      hasResults: !!state.finalReport,
      hasErrors: (state.errors?.length || 0) > 0
    },
    performance: analyzeWorkflowPerformance(state),
    errors: state.errors || [],
    metadata: {
      userId: state.userId,
      createdAt: state.createdAt,
      lastActivity: state.lastActivity,
      executionTime: state.totalExecutionTime
    }
  };
}

/**
 * LangGraph 상태를 PRD 형식으로 변환
 * API 응답을 위한 변환 함수
 */
export function transformLangGraphToPRD(
  state: TrademarkAnalysisState, 
  analysisResults?: any, 
  finalReport?: any, 
  expertAnalysis?: any
): any {
  console.log('🔄 [LangGraph] Transforming LangGraph results to compatible format');
  
  // 상태에서 finalReport가 없는 경우 매개변수에서 사용
  const report = state.finalReport || finalReport;
  
  if (!report) {
    // 부분 완료 상태 처리
    console.log('⚠️ [LangGraph] No final report, returning in-progress state');
    return {
      id: state.sessionId,
      trademarkName: state.initialInput?.trademarkName || 'Unknown',
      analysisStatus: 'in_progress',
      progress: state.progress,
      registrationPossibility: 50, // 기본값
      overallRisk: 'medium',
      riskFactors: ['분석 진행 중'],
      strategicAdvice: ['분석 완료 후 확인 가능'],
      similarTrademarks: [],
      legalBasis: '분석 진행 중',
      executionSummary: state.currentSubStep || '분석 진행 중...',
      timestamp: state.lastActivity
    };
  }

  // 완료된 분석 결과 변환
  console.log('✅ [LangGraph] Converting completed analysis results');
  
  // 전문가 분석 데이터 처리
  const processedExpertAnalysis = expertAnalysis || report.expertAnalysis;
  
  return {
    // 기본 메타데이터
    metadata: {
      searchId: state.sessionId,
      trademarkName: state.initialInput?.trademarkName,
      businessDescription: state.initialInput?.businessDescription,
      analysisDate: report.metadata?.generatedAt || new Date().toISOString(),
      analysisVersion: report.metadata?.analysisVersion || '2.0-normalized'
    },

    // 요약 정보
    summary: {
      overallRisk: report.summary?.overallRisk || '주의',
      registrationPossibility: report.summary?.registrationPossibility || 50,
      aiConfidence: report.summary?.aiConfidence || 85,
      keyFindings: report.legalRisk?.riskFactors || []
    },

    // 법적 위험 분석
    legalRisk: {
      riskFactors: report.legalRisk?.riskFactors || [],
      legalBasis: report.legalRisk?.legalBasis || '상표법 관련 조항'
    },

    // 유사 상표 정보
    similarTrademarks: {
      totalCount: report.similarTrademarks?.totalCount || 0,
      highRiskCount: report.similarTrademarks?.highRiskCount || 0,
      trademarks: (report.similarTrademarks?.trademarks || []).map((tm: any) => ({
        id: tm.id || `tm-${Math.random()}`,
        name: tm.name,
        applicant: tm.applicant,
        similarity: tm.similarity,
        status: tm.status,
        applicationDate: tm.applicationDate,
        applicationNumber: tm.applicationNumber,
        classification: tm.classification || { mainClass: '35', mainClassName: '제35류' },
        riskAnalysis: tm.riskAnalysis || { 
          level: tm.similarity >= 70 ? 'HIGH' : 'MEDIUM',
          factors: [`${tm.similarity}% 유사도`],
          conflictProbability: tm.similarity 
        },
        imageUrl: tm.imageUrl,
        // 🔥 거절사유 정보 포함
        rejectionReason: tm.rejectionReason,
        rejectionReasonSummary: tm.rejectionReasonSummary,
        legalGround: tm.legalGround,
        pdfFileUrl: tm.pdfFileUrl,
        docName: tm.docName,
        rejectionDate: tm.rejectionDate,
        decisionNumber: tm.decisionNumber
      })),
      imageAnalysisIncluded: report.similarTrademarks?.imageAnalysisIncluded || false
    },

    // 결론 및 권장사항
    conclusion: {
      strategicAdvice: report.conclusion?.strategicAdvice || ['전문가 상담 권장']
    },

    // 🔥 전문가 분석 (있는 경우)
    ...(processedExpertAnalysis && {
      expertAnalysis: processedExpertAnalysis
    }),

    // 🔥 경쟁업체 분석 (있는 경우)
    ...(state.competitorAnalysis && {
      competitorAnalysis: state.competitorAnalysis
    }),

    // 추가 메타데이터
    analysisProcess: {
      sessionId: state.sessionId,
      analysisStartTime: state.analysisStartTime,
      totalExecutionTime: state.totalExecutionTime,
      currentStep: state.currentStep,
      progress: state.progress,
      conversationLength: state.conversationHistory?.length || 0,
      channelsUsed: analysisResults ? Object.keys(analysisResults) : [],
      fallbackMode: state.fallbackMode || false
    },

    // 호환성을 위한 기존 필드들
    id: state.sessionId,
    analysisStatus: 'completed',
    progress: 100,
    registrationPossibility: report.summary?.registrationPossibility || 50,
    overallRisk: report.summary?.overallRisk === '안전' ? 'low' : 
                 report.summary?.overallRisk === '주의' ? 'medium' : 'high',
    riskFactors: report.legalRisk?.riskFactors || [],
    strategicAdvice: report.conclusion?.strategicAdvice || [],
    legalBasis: report.legalRisk?.legalBasis || '상표법 제7조 등',
    executionSummary: generateAnalysisSummary(state).basic,
    timestamp: report.metadata?.generatedAt || new Date().toISOString()
  };
}