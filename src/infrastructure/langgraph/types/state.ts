import type { TrademarkAnalysisResult } from "@/features/trademark-analysis/_types";
import type { KiprisTrademarkInfo } from "@/infrastructure/external/server-kipris-api";
// Use KiprisTrademarkInfo as the SimilarTrademark type
type SimilarTrademark = KiprisTrademarkInfo;
import { ExpertAnalysisResult as DatabaseExpertAnalysisResult } from "@/shared/types/database";

/**
 * LangGraph 메시지 타입 정의
 */
export interface LangGraphMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  type?: 'question' | 'response' | 'analysis' | 'confirmation' | 'result';
  metadata?: {
    questionType?: string;
    purpose?: string;
    timestamp?: string;
    stepName?: string;
    issueId?: string;
    issueSeverity?: string;
    [key: string]: any; // 추가 메타데이터 지원
  };
}

/**
 * 정보 수집 체크리스트
 */
/**
 * 사용자에게 질문할 수 있는 항목들의 타입 정의
 */
export type QuestionType = 
  | 'basicInfoCollected'   // 기본 정보 수집 완료 여부
  | 'analysisReady'        // 분석 시작 준비 완료 여부
  | 'designStory'          // 디자인 의도/상표 스토리 (선택적)
  | 'businessScale'        // 사업 규모/계획 (선택적)
  | 'previousTrademark';   // 기존 상표 보유 여부 (선택적)

/**
 * 데이터베이스 세션 상태와 매핑되는 타입들
 */
export type DatabaseSessionStatus = 
  | 'pending'      // 대기 중
  | 'processing'   // 처리 중
  | 'briefing'     // 브리핑 중
  | 'confirming'   // 확인 중
  | 'completed'    // 완료
  | 'failed';      // 실패

export interface InformationChecklist {
  // 🔄 REFACTORED: 3가지 질문 필드 제거, 자동 완료 처리
  // 기본 정보만으로 분석 진행 가능하도록 간소화
  
  // 분석 준비 상태
  basicInfoCollected: boolean;      // 기본 정보 수집 완료 여부
  analysisReady: boolean;           // 분석 시작 준비 완료 여부
  
  // 선택적 정보 (향후 확장용, 현재는 모두 자동 완료)
  designStory?: boolean;            // 디자인 의도/상표 스토리 (자동 처리)
  businessScale?: boolean;          // 사업 규모/계획 (자동 처리)
  previousTrademark?: boolean;      // 기존 상표 보유 여부 (자동 처리)
}

/**
 * 🚀 OPTIMIZED: Critical issue handling integrated into askUser node
 * Keeping interface for compatibility but functionality is now embedded
 */
export interface CriticalIssue {
  id: string;
  type: 'IDENTICAL_TRADEMARK' | 'HIGH_SIMILARITY' | 'LEGAL_CONFLICT' | 'CLASSIFICATION_ERROR';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affectedTrademarks?: SimilarTrademark[];
  requiredAction: 'USER_CONFIRMATION' | 'ADDITIONAL_INFO' | 'STRATEGY_CHANGE';
  autoResolvable: boolean;
}

/**
 * 사용자 확인 응답
 */
export interface UserConfirmation {
  issueId: string;
  userResponse: string;
  confirmationType: 'PROCEED' | 'MODIFY' | 'CANCEL';
  additionalInfo?: string;
  timestamp: string;
}

/**
 * 🚀 OPTIMIZED: Parallel analysis integrated into comprehensiveAnalysis node
 * Results are now collected within the comprehensive analysis step
 */
export interface AnalysisResults {
  kipris: {
    success: boolean;
    data?: {
      similarTrademarks: SimilarTrademark[];
      totalCount: number;
      searchQuery: string;
      highRiskCount?: number;
      mediumRiskCount?: number;
      lowRiskCount?: number;
    };
    error?: string;
    executionTime: number;
  };
  legal?: {
    success: boolean;
    data?: {
      relevantLaws: string[];
      riskFactors: string[];
      recommendations: string[];
    };
    error?: string;
    executionTime: number;
  };
}

/**
 * 상품 분류 분석 결과 (GCP goods-data-search 기반)
 */
export interface GoodsClassificationResult {
  primaryClassification: {
    classCode: string;
    className: string;
    description: string;
    confidence: number;
  };
  alternativeClassifications: Array<{
    classCode: string;
    className: string;
    description: string;
    confidence: number;
    reason: string;
  }>;
  similarGroupCodes: Array<{
    code: string;
    description: string;
    products: string[];
    relevance: number;
  }>;
  relatedProducts: Array<{
    productName: string;
    classCode: string;
    similarGroupCode: string;
    similarityScore: number;
  }>;
  recommendations: {
    strategy: string;
    multiClassFiling: boolean;
    riskAssessment: string;
    suggestedProducts: string[];
  };
  analysisMetadata: {
    dataSource: string;
    searchQueries: number;
    totalResults: number;
    confidence: number;
    executionTime: number;
  };
}

/**
 * 🔥 NEW: 전문가 분석 결과 (Gemini 2.5 Pro 10년차 변리사 수준)
 */
export interface LangGraphExpertAnalysisResult {
  classificationAnalysis?: {
    optimal_class: string;
    class_name: string;
    alternative_classes: string[];
    strategic_reasoning: string;
  };
  marketAnalysis?: {
    competitor_density: string;
    market_saturation: number;
    industry_specific_risks: string[];
    strategic_positioning: string;
  };
  professionalInsights?: {
    success_factors: string[];
    critical_warnings: string[];
    cost_considerations: {
      estimated_filing_costs: string;
      potential_response_costs: string;
      total_investment: string;
    };
    long_term_strategy: string;
    industry_best_practices: string[];
  };
  finalVerdict?: {
    proceed_recommendation: boolean;
    modification_priority: string;
    professional_consultation_needed: boolean;
    expert_conclusion: string;
  };
}

/**
 * 구조화된 최종 분석 보고서 (RPA 연동용)
 */
export interface StructuredAnalysisReport {
  // 기본 정보
  metadata: {
    reportId: string;
    generatedAt: string;
    trademarkName: string;
    businessDescription: string;
    analysisVersion: string;
    processingTimeMs?: number;
  };
  
  // 핵심 요약
  summary: {
    overallRisk: "안전" | "주의" | "위험";
    registrationPossibility: number;
    aiConfidence: number;
    keyFindings: string[];
  };
  
  // 새로운 상세 분석 구조
  detailAnalysis: {
    // 1. 등록 가능성 (%)
    registrationPossibility: {
      percentage: number;
      confidence: number;
      calculationBasis: string[];
    };
    
    // 2. 유사군 코드 분석
    similarGroupAnalysis: {
      applicableCodes: Array<{
        code: string;
        name: string;
        applicability: "적합" | "부분적합" | "부적합";
        rationale: string;
      }>;
      primaryCode: string;
      recommendations: string[];
    };
    
    // 3. 상표의 식별력 검토
    distinctivenessAnalysis: {
      level: "강함" | "보통" | "약함";
      factors: {
        descriptive: { score: number; explanation: string; };
        technical: { score: number; explanation: string; };
        creative: { score: number; explanation: string; };
      };
      strengtheningSuggestions: string[];
      legalBasis: string[];
    };
    
    // 4. 선행상표 유사여부 분석
    priorTrademarkAnalysis: {
      totalFound: number;
      highRiskCount: number;
      detailedAnalysis: Array<{
        name: string;
        registrationNumber: string;
        applicant: string;
        similarity: number;
        riskLevel: "높음" | "보통" | "낮음";
        conflictFactors: string[];
        avoidanceStrategy: string;
      }>;
      overallConflictRisk: "높음" | "보통" | "낮음";
      mitigationRecommendations: string[];
    };
    
    // 기존 상품 분류 (유지)
    productClassification?: {
      recommendedClass: string;
      className: string;
      confidence: number;
      similarGroupCodes: string[];
      rationale: string;
    };
  };
  
  // 법률 리스크
  legalRisk: {
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    riskFactors: string[];
    conflictingTrademarks: SimilarTrademark[];
    legalBasis: string[];
  };
  
  // 유사 상표 목록
  similarTrademarks: {
    totalCount: number;
    highRiskCount: number;
    trademarks: SimilarTrademark[];
    imageAnalysisIncluded: boolean;
  };
  
  // 최종 결론 및 제언
  conclusion: {
    recommendation: 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'MODIFY_APPROACH' | 'ALTERNATIVE_STRATEGY';
    strategicAdvice: string[];
    nextSteps: string[];
    estimatedProcessingTime: string;
    finalDecision?: string;
  };
  
  // 전문가 분석 (선택사항)
  expertAnalysis?: DatabaseExpertAnalysisResult & {
    classificationAnalysis?: any;
  };
  
  // 사용자 확인 사항 반영
  userConfirmations?: {
    issues: CriticalIssue[];
    resolutions: UserConfirmation[];
    impact: string;
  };
}

/**
 * LangGraph 중앙 상태 정의
 * 모든 워크플로우 상태를 중앙 집중식으로 관리
 */
export interface TrademarkAnalysisState {
  // === 세션 관리 ===
  sessionId: string;
  userId?: string;
  createdAt: string;
  lastActivity: string;
  isDebugMode?: boolean; // Admin debug mode flag
  
  // === 분석 대상 정보 ===
  initialInput: {
    type: 'text' | 'image' | 'combined';
    trademarkName: string;
    businessDescription: string;
    imageUrl?: string;
    imageFile?: File;
    // AI 분류 결과
    productClassificationCodes?: string[];
    similarGroupCodes?: string[];
    designatedProducts?: string[];
    // 경쟁업체 정보
    competitorNames?: string[];
  };
  
  // === 대화 진행 상태 ===
  conversationHistory: LangGraphMessage[];
  informationChecklist: InformationChecklist;
  currentQuestionType?: QuestionType;
  
  // === 워크플로우 상태 ===
  currentStep: 
    | 'INITIAL'             // 초기 상태
    | 'COLLECTING'          // 정보 수집 중
    | 'WAITING_FOR_RESPONSE' // 사용자 응답 대기
    | 'BRIEFING'            // 중간 브리핑 단계 (PRD/TRD 요구사항)
    | 'DEEP_INFO_COLLECTION' // 심층 정보 수집 단계 (PRD/TRD 요구사항)
    | 'CONFIRMING'          // 사용자 확인 필요
    | 'ANALYZING'           // 분석 진행 중
    | 'SYNTHESIZING'        // 결과 종합 중
    | 'COMPLETE'            // 완료
    | 'ERROR';              // 오류 발생
  
  progress: number;       // 0-100 진행률
  currentSubStep?: string; // 현재 세부 단계
  
  // === 분석 결과 ===
  analysisResults?: AnalysisResults;
  
  // === 통합 AI 분석 결과 ===
  comprehensiveAnalysisResult?: any; // Legacy field - using trademark-final-analysis now
  competitorAnalysis?: any; // 경쟁업체 분석 결과
  classificationExpertResult?: any;
  rejectionPrediction?: any;
  
  // === 상품 분류 분석 결과 (GCP goods-data-search 기반) ===
  goodsClassification?: GoodsClassificationResult;
  
  // === 🚀 OPTIMIZED: Critical issue handling integrated into askUser node ===
  criticalIssues?: CriticalIssue[]; // Kept for compatibility, handled in askUser
  pendingConfirmations?: string[]; // Integrated into askUser node workflow
  userConfirmations?: UserConfirmation[]; // Processed within askUser node
  
  // === 최종 산출물 ===
  finalReport?: StructuredAnalysisReport;
  
  // === 데이터베이스 연동 ===
  dbSaveStatus?: 'pending' | 'success' | 'error';
  dbRecordId?: string;
  
  // === 워크플로우 제어 ===
  workflowShouldStop?: boolean;
  
  // === 에러 처리 ===
  errors?: Array<{
    step: string;
    error: string;
    timestamp: string;
    recoverable: boolean;
  }>;
  
  // === 메타 정보 ===
  analysisStartTime?: string;
  analysisEndTime?: string;
  totalExecutionTime?: number;
  retryCount?: number;
  fallbackMode?: boolean; // 외부 API 실패 시 폴백 모드
}

/**
 * TrademarkAnalysisState의 부분 업데이트를 위한 타입
 */
export type PartialTrademarkAnalysisState = Partial<TrademarkAnalysisState>;

/**
 * 데이터베이스 정규화된 스키마 타입 정의들
 */
export interface DatabaseSession {
  id: string;
  user_id?: string;
  trademark_name: string;
  trademark_type: string;
  business_description?: string;
  status: DatabaseSessionStatus;
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DatabaseConversation {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DatabaseInformationChecklist {
  id: string;
  session_id: string;
  trademark_name_confirmed: boolean;
  business_description_provided: boolean;
  product_categories_specified: boolean;
  target_market_defined: boolean;
  budget_range_provided: boolean;
  timeline_specified: boolean;
  special_requirements_noted: boolean;
  completeness_score: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFinalResult {
  id: string;
  session_id: string;
  registration_probability: number;
  risk_level: string;
  risk_score: number;
  ai_confidence: number;
  key_findings?: any[];
  strategic_recommendations?: any[];
  legal_risks?: any[];
  next_steps?: any[];
  estimated_cost?: any;
  estimated_timeline?: string;
  report_metadata?: Record<string, any>;
  competitor_analysis?: any; // Added competitor analysis field
  created_at: string;
}

/**
 * 데이터베이스 저장 함수의 매개변수 타입
 */
export interface SaveSessionParams {
  p_session_data: Partial<DatabaseSession>;
  p_conversations?: Partial<DatabaseConversation>[];
  p_information_checklist?: Partial<DatabaseInformationChecklist> | null;
  p_kipris_searches?: any[];
  p_similar_trademarks?: any[];
  p_expert_queries?: any[];
  p_product_classifications?: any[];
  p_workflow_checkpoints?: any[];
  p_final_result?: Partial<DatabaseFinalResult> | null;
  p_pending_confirmations?: any[];
}

/**
 * 상태 업데이트를 위한 부분 타입
 */
// export type PartialTrademarkAnalysisState = Partial<TrademarkAnalysisState>;

/**
 * 노드 실행 결과 타입
 */
export interface NodeExecutionResult {
  success: boolean;
  nextStep?: TrademarkAnalysisState['currentStep'];
  updates: PartialTrademarkAnalysisState;
  error?: string;
  shouldContinue: boolean;
}

/**
 * 워크플로우 설정
 */
export interface WorkflowConfig {
  maxRetries: number;
  timeoutMs: number;
  enableFallback: boolean;
  parallelAnalysis: boolean;
  expertAnalysisEnabled: boolean;
}

/**
 * 상태 검증 도우미 함수들의 반환 타입
 */
export interface StateValidationResult {
  isValid: boolean;
  missingFields: string[];
  readyForNextStep: boolean;
  suggestedAction?: string;
}