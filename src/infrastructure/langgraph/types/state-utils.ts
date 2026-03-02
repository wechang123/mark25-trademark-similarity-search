import { 
  TrademarkAnalysisState, 
  InformationChecklist, 
  StateValidationResult,
  LangGraphMessage,
  CriticalIssue
} from './state';

/**
 * 새로운 세션을 위한 초기 상태 생성
 */
export function createInitialState(input: {
  sessionId: string;
  initialInput?: any;
  userId?: string;
}): TrademarkAnalysisState {
  const now = new Date().toISOString();
  
  // 🚨 EMPTY TRADEMARK VALIDATION: 빈 상표명 검증
  const trademarkName = input.initialInput?.trademarkName?.trim() || '';
  
  return {
    sessionId: input.sessionId,
    userId: input.userId,
    createdAt: now,
    lastActivity: now,
    initialInput: {
      type: 'text',
      trademarkName,
      businessDescription: input.initialInput?.businessDescription || '',
      imageUrl: input.initialInput?.imageUrl,
      imageFile: input.initialInput?.imageFile,
      productClassificationCodes: input.initialInput?.productClassificationCodes,
      similarGroupCodes: input.initialInput?.similarGroupCodes,
      designatedProducts: input.initialInput?.designatedProducts,
    },
    conversationHistory: [],
    informationChecklist: {
      basicInfoCollected: false,
      analysisReady: false,
      designStory: false,
      businessScale: false,
      previousTrademark: false,
    },
    // 🚨 빈 상표명인 경우 COLLECTING 단계부터 시작하여 정보 수집 강제
    currentStep: trademarkName ? 'INITIAL' : 'COLLECTING',
    progress: 0,
    retryCount: 0,
    fallbackMode: false,
  };
}

/**
 * 정보 수집 완성도 분석
 */
export function analyzeMissingInformation(checklist: InformationChecklist): Array<{
  field: keyof InformationChecklist;
  priority: 'required' | 'optional';
  description: string;
}> {
  const missing: Array<{
    field: keyof InformationChecklist;
    priority: 'required' | 'optional';
    description: string;
  }> = [];

  // 필수 정보 확인 (새로운 InformationChecklist 구조에 맞게 업데이트)
  if (!checklist.basicInfoCollected) {
    missing.push({
      field: 'basicInfoCollected',
      priority: 'required',
      description: '기본 정보 수집이 필요합니다'
    });
  }

  if (!checklist.analysisReady) {
    missing.push({
      field: 'analysisReady',
      priority: 'required',
      description: '분석 시작 준비가 필요합니다'
    });
  }

  // 선택적 정보 확인
  if (!checklist.designStory) {
    missing.push({
      field: 'designStory',
      priority: 'optional',
      description: '디자인 의도/상표 스토리 정보 (선택적)'
    });
  }

  if (!checklist.businessScale) {
    missing.push({
      field: 'businessScale',
      priority: 'optional',
      description: '사업 규모/계획 정보 (선택적)'
    });
  }

  if (!checklist.previousTrademark) {
    missing.push({
      field: 'previousTrademark',
      priority: 'optional',
      description: '기존 상표 보유 여부 (선택적)'
    });
  }

  return missing;
}

/**
 * 상태 검증 함수
 */
export function validateState(state: TrademarkAnalysisState): StateValidationResult {
  const missingFields: string[] = [];
  
  // 기본 필수 필드 검증
  if (!state.sessionId) missingFields.push('sessionId');
  
  // 🚨 EMPTY TRADEMARK VALIDATION: 상표명 검증 강화
  const trademarkName = state.initialInput.trademarkName?.trim();
  if (!trademarkName) {
    missingFields.push('trademarkName');
  }
  
  if (!state.initialInput.businessDescription) missingFields.push('businessDescription');
  
  // 단계별 검증
  let readyForNextStep = false;
  let suggestedAction: string | undefined;

  switch (state.currentStep) {
    case 'INITIAL':
      readyForNextStep = missingFields.length === 0;
      suggestedAction = readyForNextStep ? 'Start information collection' : 'Complete required fields';
      break;
      
    case 'COLLECTING':
      const missingInfo = analyzeMissingInformation(state.informationChecklist);
      const requiredMissing = missingInfo.filter(info => info.priority === 'required');
      readyForNextStep = requiredMissing.length === 0;
      suggestedAction = readyForNextStep ? 'Proceed to analysis' : 'Continue information collection';
      break;
      
    case 'ANALYZING':
      readyForNextStep = !!state.analysisResults && 
        state.analysisResults.kipris.success &&
        state.analysisResults.legal?.success === true;
      suggestedAction = readyForNextStep ? 'Proceed to synthesis' : 'Continue analysis';
      break;
      
    case 'CONFIRMING':
      readyForNextStep = !state.pendingConfirmations || state.pendingConfirmations.length === 0;
      suggestedAction = readyForNextStep ? 'Resume analysis' : 'Wait for user confirmation';
      break;
      
    case 'SYNTHESIZING':
      readyForNextStep = !!state.finalReport;
      suggestedAction = readyForNextStep ? 'Save to database' : 'Continue synthesis';
      break;
      
    case 'COMPLETE':
      readyForNextStep = state.dbSaveStatus === 'success';
      suggestedAction = 'Analysis completed';
      break;
      
    case 'ERROR':
      readyForNextStep = false;
      suggestedAction = 'Handle error and retry';
      break;
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    readyForNextStep,
    suggestedAction,
  };
}

/**
 * 대화 기록에 메시지 추가
 */
export function addMessageToHistory(
  state: TrademarkAnalysisState,
  message: LangGraphMessage
): TrademarkAnalysisState {
  return {
    ...state,
    conversationHistory: [
      ...state.conversationHistory,
      {
        ...message,
        metadata: {
          ...message.metadata,
          timestamp: new Date().toISOString(),
        },
      },
    ],
    lastActivity: new Date().toISOString(),
  };
}

/**
 * 진행률 업데이트
 */
export function updateProgress(
  state: TrademarkAnalysisState,
  progress: number,
  subStep?: string
): TrademarkAnalysisState {
  return {
    ...state,
    progress: Math.max(0, Math.min(100, progress)),
    currentSubStep: subStep,
    lastActivity: new Date().toISOString(),
  };
}

/**
 * 에러 추가
 */
export function addError(
  state: TrademarkAnalysisState,
  step: string,
  error: string,
  recoverable: boolean = true
): TrademarkAnalysisState {
  const newError = {
    step,
    error,
    timestamp: new Date().toISOString(),
    recoverable,
  };

  return {
    ...state,
    errors: [...(state.errors || []), newError],
    lastActivity: new Date().toISOString(),
  };
}

/**
 * 중요 이슈 감지
 */
export function detectCriticalIssues(
  analysisResults: TrademarkAnalysisState['analysisResults']
): CriticalIssue[] {
  const issues: CriticalIssue[] = [];

  if (!analysisResults) return issues;

  // KIPRIS 검색 결과에서 중요 이슈 감지
  if (analysisResults.kipris.success && analysisResults.kipris.data) {
    const { similarTrademarks } = analysisResults.kipris.data;
    
    // 동일 상표 감지
    const identicalTrademarks = similarTrademarks.filter(tm => (tm.similarityScore || 0) >= 95);
    if (identicalTrademarks.length > 0) {
      issues.push({
        id: `identical_${Date.now()}`,
        type: 'IDENTICAL_TRADEMARK',
        severity: 'HIGH',
        title: '동일 또는 거의 동일한 상표 발견',
        description: `${identicalTrademarks.length}개의 매우 유사한 상표가 발견되었습니다. 등록이 어려울 수 있습니다.`,
        affectedTrademarks: identicalTrademarks,
        requiredAction: 'USER_CONFIRMATION',
        autoResolvable: false,
      });
    }
    
    // 고위험 유사 상표 감지
    const highRiskTrademarks = similarTrademarks.filter(tm => 
      (tm.similarityScore || 0) >= 70 && (tm.similarityScore || 0) < 95 && tm.riskLevel === 'HIGH'
    );
    if (highRiskTrademarks.length >= 3) {
      issues.push({
        id: `high_similarity_${Date.now()}`,
        type: 'HIGH_SIMILARITY',
        severity: 'MEDIUM',
        title: '다수의 유사 상표 존재',
        description: `${highRiskTrademarks.length}개의 유사도가 높은 상표가 존재합니다. 상표 전략 수정을 고려해보세요.`,
        affectedTrademarks: highRiskTrademarks,
        requiredAction: 'ADDITIONAL_INFO',
        autoResolvable: false,
      });
    }
  }

  return issues;
}

/**
 * 상태 정리 함수 (메모리 최적화용)
 */
export function cleanupState(state: TrademarkAnalysisState): TrademarkAnalysisState {
  // 오래된 대화 기록 정리 (최근 50개만 유지)
  const conversationHistory = state.conversationHistory.slice(-50);
  
  // 오래된 에러 기록 정리 (최근 10개만 유지)
  const errors = (state.errors || []).slice(-10);
  
  return {
    ...state,
    conversationHistory,
    errors,
  };
}

/**
 * 세션 만료 확인
 */
export function isSessionExpired(state: TrademarkAnalysisState, timeoutMs: number = 3600000): boolean {
  const lastActivity = new Date(state.lastActivity);
  const now = new Date();
  return (now.getTime() - lastActivity.getTime()) > timeoutMs;
}

/**
 * 복구 가능한 상태인지 확인
 */
export function isRecoverable(state: TrademarkAnalysisState): boolean {
  if (state.currentStep === 'ERROR') {
    // 복구 가능한 에러가 있는지 확인
    return (state.errors || []).some(error => error.recoverable);
  }
  
  if (state.currentStep === 'COMPLETE') {
    return false; // 완료된 상태는 복구할 필요 없음
  }
  
  return true;
}

/**
 * 디버깅용 상태 요약
 */
export function getStateSummary(state: TrademarkAnalysisState) {
  return {
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    progress: state.progress,
    conversationLength: state.conversationHistory.length,
    hasResults: !!state.analysisResults,
    hasReport: !!state.finalReport,
    errorCount: (state.errors || []).length,
    lastActivity: state.lastActivity,
  };
}

/**
 * 🚨 빈 상표명 검증 및 처리
 */
export function validateTrademarkName(trademarkName?: string): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  const trimmed = trademarkName?.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: '상표명을 입력해주세요',
      suggestion: '분석을 진행하려면 등록하려는 상표명이 필요합니다.'
    };
  }
  
  if (trimmed.length < 1) {
    return {
      isValid: false,
      error: '상표명이 너무 짧습니다',
      suggestion: '최소 1글자 이상의 상표명을 입력해주세요.'
    };
  }
  
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: '상표명이 너무 깁니다',
      suggestion: '상표명은 100자 이하로 입력해주세요.'
    };
  }
  
  return { isValid: true };
}

/**
 * 초기 상태에서 필수 정보 누락 확인
 */
export function checkInitialRequirements(state: TrademarkAnalysisState): {
  hasTrademarkName: boolean;
  hasBusinessDescription: boolean;
  canProceedToCollection: boolean;
  missingItems: string[];
} {
  const trademarkValid = validateTrademarkName(state.initialInput.trademarkName);
  const hasBusinessDescription = !!state.initialInput.businessDescription?.trim();
  
  const missingItems: string[] = [];
  if (!trademarkValid.isValid) missingItems.push('상표명');
  if (!hasBusinessDescription) missingItems.push('사업 설명');
  
  return {
    hasTrademarkName: trademarkValid.isValid,
    hasBusinessDescription,
    canProceedToCollection: missingItems.length === 0,
    missingItems
  };
}

/**
 * 강화된 오류 처리 및 복구 시스템
 */

/**
 * 개별 채널 실패 시 fallback 처리 로직
 */
export function createChannelFallback(
  channelName: 'kipris' | 'legal',
  error: Error,
  state: TrademarkAnalysisState
): {
  success: boolean;
  data?: any;
  error: string;
  executionTime: number;
  fallbackUsed: boolean;
} {
  console.log(`⚠️ [Fallback] Creating fallback for ${channelName} channel:`, error.message);
  
  const fallbackData = generateChannelFallbackData(channelName, state);
  
  return {
    success: true, // fallback으로 성공 처리
    data: fallbackData,
    error: `Original ${channelName} failed, using fallback: ${error.message}`,
    executionTime: 100, // 즉시 처리
    fallbackUsed: true
  };
}

/**
 * 채널별 fallback 데이터 생성
 */
function generateChannelFallbackData(
  channelName: 'kipris' | 'legal',
  state: TrademarkAnalysisState
): any {
  const trademarkName = state.initialInput.trademarkName;
  
  switch (channelName) {
    case 'kipris':
      return {
        similarTrademarks: [], // 빈 배열로 처리
        totalCount: 0,
        searchQuery: trademarkName,
        fallbackMessage: 'KIPRIS API 연결 실패로 유사 상표 검색을 건너뜁니다. 수동 검토가 필요합니다.'
      };
      
    case 'legal':
      return {
        relevantLaws: [
          '상표법 제33조 - 상표등록 요건',
          '상표법 제34조 - 상표등록 거절사유'
        ],
        riskFactors: [
          'API 연결 실패로 상세 법률 검토 불가',
          '전문가 상담 권장'
        ],
        recommendations: [
          '변리사 상담을 통한 정밀 검토',
          '수동 법률 검토 실시'
        ],
        fallbackMessage: '법률 검토 API 실패로 기본 조항만 제공합니다.'
      };
      
    default:
      return {};
  }
}

/**
 * 전체 분석 실패 시 복구 전략
 */
export function createRecoveryStrategy(
  failedChannels: string[],
  state: TrademarkAnalysisState
): {
  strategy: 'RETRY' | 'PARTIAL_PROCEED' | 'MANUAL_REVIEW' | 'ABORT';
  message: string;
  nextAction: string;
  retryPossible: boolean;
} {
  const totalChannels = 3;
  const failedCount = failedChannels.length;
  const retryCount = state.retryCount || 0;
  const maxRetries = 2;
  
  if (failedCount === totalChannels) {
    // 모든 채널 실패
    if (retryCount < maxRetries) {
      return {
        strategy: 'RETRY',
        message: '모든 분석 채널이 실패했습니다. 잠시 후 다시 시도하겠습니다.',
        nextAction: 'ANALYZING',
        retryPossible: true
      };
    } else {
      return {
        strategy: 'MANUAL_REVIEW',
        message: '시스템 오류로 자동 분석이 불가능합니다. 수동 검토를 진행하거나 고객센터에 문의해주세요.',
        nextAction: 'ERROR',
        retryPossible: false
      };
    }
  } else if (failedCount >= totalChannels / 2) {
    // 절반 이상 실패
    return {
      strategy: 'PARTIAL_PROCEED',
      message: `일부 분석 채널(${failedChannels.join(', ')})이 실패했지만 사용 가능한 결과로 분석을 계속합니다.`,
      nextAction: 'SYNTHESIZING',
      retryPossible: true
    };
  } else {
    // 소수 채널 실패
    return {
      strategy: 'PARTIAL_PROCEED',
      message: '일부 분석 채널이 실패했지만 충분한 데이터로 분석을 진행합니다.',
      nextAction: 'SYNTHESIZING',
      retryPossible: false
    };
  }
}

/**
 * 에러 심각도 분류
 */
export function classifyErrorSeverity(error: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  
  // 네트워크 관련 오류
  if (lowerMessage.includes('network') || lowerMessage.includes('timeout') || lowerMessage.includes('connection')) {
    return 'MEDIUM';
  }
  
  // 인증/권한 오류
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden') || lowerMessage.includes('api key')) {
    return 'HIGH';
  }
  
  // 시스템 오류
  if (lowerMessage.includes('internal server') || lowerMessage.includes('system') || lowerMessage.includes('database')) {
    return 'CRITICAL';
  }
  
  // 데이터 유효성 오류
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('missing required')) {
    return 'MEDIUM';
  }
  
  // 기타
  return 'LOW';
}

/**
 * 자동 복구 시도
 */
export function attemptAutoRecovery(
  error: any,
  channelName: string,
  state: TrademarkAnalysisState
): {
  canRecover: boolean;
  recoveryAction: string;
  estimatedDelay: number;
} {
  const severity = classifyErrorSeverity(error);
  const retryCount = state.retryCount || 0;
  
  switch (severity) {
    case 'LOW':
      return {
        canRecover: retryCount < 3,
        recoveryAction: 'IMMEDIATE_RETRY',
        estimatedDelay: 1000 // 1초
      };
      
    case 'MEDIUM':
      return {
        canRecover: retryCount < 2,
        recoveryAction: 'DELAYED_RETRY',
        estimatedDelay: 5000 // 5초
      };
      
    case 'HIGH':
      return {
        canRecover: retryCount < 1,
        recoveryAction: 'FALLBACK_MODE',
        estimatedDelay: 0 // 즉시 fallback
      };
      
    case 'CRITICAL':
      return {
        canRecover: false,
        recoveryAction: 'MANUAL_INTERVENTION',
        estimatedDelay: 0
      };
      
    default:
      return {
        canRecover: false,
        recoveryAction: 'UNKNOWN_ERROR',
        estimatedDelay: 0
      };
  }
}

/**
 * 에러 보고서 생성
 */
export function generateErrorReport(state: TrademarkAnalysisState): {
  sessionId: string;
  timestamp: string;
  currentStep: string;
  errors: any[];
  recoveryAttempts: number;
  failurePoints: string[];
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
} {
  const errors = state.errors || [];
  const retryCount = state.retryCount || 0;
  
  // 실패 지점 분석
  const failurePoints = Array.from(new Set(errors.map(e => e.step)));
  
  // 시스템 건강 상태 평가
  let systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  const criticalErrors = errors.filter(e => classifyErrorSeverity(e.error) === 'CRITICAL');
  const highErrors = errors.filter(e => classifyErrorSeverity(e.error) === 'HIGH');
  
  if (criticalErrors.length > 0 || errors.length > 10) {
    systemHealth = 'CRITICAL';
  } else if (highErrors.length > 0 || errors.length > 5) {
    systemHealth = 'DEGRADED';
  } else {
    systemHealth = 'HEALTHY';
  }
  
  return {
    sessionId: state.sessionId,
    timestamp: new Date().toISOString(),
    currentStep: state.currentStep,
    errors: errors.map(e => ({
      step: e.step,
      error: e.error,
      timestamp: e.timestamp,
      severity: classifyErrorSeverity(e.error),
      recoverable: e.recoverable
    })),
    recoveryAttempts: retryCount,
    failurePoints,
    systemHealth
  };
}

/**
 * 성능 메트릭 계산
 */
export function calculatePerformanceMetrics(state: TrademarkAnalysisState): {
  totalExecutionTime?: number;
  channelPerformance: {
    kipris: { success: boolean; executionTime: number; };

    legal: { success: boolean; executionTime: number; };
  };
  successRate: number;
  avgResponseTime: number;
} {
  const analysisResults = state.analysisResults;
  
  if (!analysisResults) {
    return {
      channelPerformance: {
        kipris: { success: false, executionTime: 0 },

        legal: { success: false, executionTime: 0 }
      },
      successRate: 0,
      avgResponseTime: 0
    };
  }
  
  const channelPerformance = {
    kipris: {
      success: analysisResults.kipris.success,
      executionTime: analysisResults.kipris.executionTime || 0
    },

    legal: {
      success: analysisResults.legal?.success || false,
      executionTime: analysisResults.legal?.executionTime || 0
    }
  };
  
  const successCount = Object.values(channelPerformance).filter(c => c.success).length;
  const totalChannels = 3;
  const successRate = (successCount / totalChannels) * 100;
  
  const totalTime = Object.values(channelPerformance).reduce((sum, c) => sum + c.executionTime, 0);
  const avgResponseTime = totalTime / totalChannels;
  
  // 전체 실행 시간 계산 (생성 시간부터 현재까지)
  let totalExecutionTime: number | undefined;
  if (state.analysisStartTime && state.analysisEndTime) {
    totalExecutionTime = new Date(state.analysisEndTime).getTime() - new Date(state.analysisStartTime).getTime();
  }
  
  return {
    totalExecutionTime,
    channelPerformance,
    successRate,
    avgResponseTime
  };
}