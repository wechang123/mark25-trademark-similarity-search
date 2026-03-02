/**
 * 3단계 플로우 간소화된 결과 화면 전용 타입 정의
 */

// Legacy type for backward compatibility
export interface TrademarkAnalysisResult {
  searchId: string;
  trademarkName: string;
  industry: string;
  overallRisk: string;
  registrationPossibility: number;
  similarCount: number;
  industryCollision: string;
  aiConfidence: number;
  similarTrademarks: any[];
  hasImageAnalysis: boolean;
  aiAnalysis?: {
    summary: string;
    probability: number;
    confidence: number;
    risks: string[];
    recommendations: string[];
  };
}

// Stage별 데이터 타입
export interface Stage1Data {
  id: string;
  trademarkType: 'text' | 'image' | 'combined';
  trademarkName: string;
  trademarkImageUrl?: string;
  businessDescription: string;
  productServices: string[];
  targetMarket?: string;
  businessModel?: string;
  similarGroupCodes: string[]; // 🎯 유사군 코드 배열 추가
  selectedSimilarCode?: string; // 🎯 선택된 유사군 코드 추가
  userId?: string; // 🔧 사용자 ID 추가
  createdAt: string;
}

// Article violation types for legal analysis
export interface ArticleViolation {
  clauseNumber: number;
  clauseText: string;
  description: string;
  violated: boolean;
  reason: string;
}

export interface FamousnessViolation extends ArticleViolation {
  searchResults?: string;
  conflictingBrand?: string;
}

export interface ConflictingTrademark {
  name: string;
  applicationNumber: string;
  similarityType: string;
  riskLevel: '높음' | '중간' | '낮음';
  similarGroupCodes?: string[];
}

export interface InternetSearchResults {
  google?: string;
  naver?: string;
  summary?: string;
}

export interface Stage2Data {
  id: string;
  stage1Id: string;
  registrationProbability: number;
  aiConfidence: number;
  
  // All 5 evaluation scores
  codeCompatibilityScore: number;
  distinctivenessScore: number;
  similarityScore: number;
  nonRegistrableScore: number;
  famousnessScore: number;
  
  // Reasons and summaries
  codeCompatibilityReason: string;
  distinctivenessReason: string;
  similarityReason: string;
  nonRegistrableSummary: string;
  famousnessSummary: string;
  
  // Detailed legal analysis (JSONB fields)
  article33Violations: ArticleViolation[];
  article34_1to6Violations: ArticleViolation[];
  article34_9to14Violations: FamousnessViolation[];
  article34_1_7Violation: boolean;
  article35_1Violation: boolean;
  conflictingTrademarks: ConflictingTrademark[];
  internetSearchResults: InternetSearchResults;
  legalRisks: string[];
  actionItems: string[];
  detailedAdvice: string;
  
  // Designated goods
  designatedGoods: string[];
  designatedGoodsSummary: string;
  designatedGoodsRecommended: string[];
  
  // Other metadata
  selectedSimilarCode: string;
  kiprisResultsCount: number;
  highRiskCount: number;
  processingTimeMs?: number;
  createdAt: string;
  finalRecommendation: string;
  overallAssessment?: string;
  legalViolations?: string[]; // for backward compatibility
}

export interface Stage3Data {
  id: string;
  stage2Id: string;
  finalProbability: number;
  codeCompatibilityReason: string;
  distinctivenessReason: string;
  similarityReason: string;
  userAction?: 'apply' | 'consult' | 'retry' | 'save';
  actionTakenAt?: string;
  resultViewed: boolean;
  createdAt: string;
}

// 간소화된 결과 화면용 인터페이스
export interface SimplifiedAnalysisResult {
  // 기본 정보
  trademarkName: string;
  trademarkType: 'text' | 'image' | 'combined';
  trademarkImageUrl?: string;
  
  // 핵심 결과
  registrationProbability: number;
  aiConfidence: number;
  
  // 5가지 평가 기준
  analysis: {
    codeCompatibility: AnalysisCriterion;
    distinctiveness: AnalysisCriterion;
    priorSimilarity: AnalysisCriterion;
    nonRegistrable: AnalysisCriterion;
    famousness: AnalysisCriterion;
  };
  
  // 메타데이터
  analysisDate: string;
  processingTime?: number;
}

// 개별 평가 기준
export interface AnalysisCriterion {
  score: number; // 0-100
  description: string;
  status: 'excellent' | 'good' | 'warning' | 'danger'; // UI 상태
  icon: '✓' | '⚠' | '✗' | '?';
  details?: string; // 추가 설명
}

// 유사 상표 데이터 타입 (KIPRIS 검색 결과)
export interface SimilarTrademark {
  id: string;
  trademarkName: string;
  imageUrl: string | null;
  applicationNumber: string | null;
  registrationNumber: string | null;
  applicantName: string;
  status: string;
  applicationDate: string | null;
  registrationDate: string | null;
  similarityScore: number;
  similarGroupCodes: string[] | null;
  goodsClassificationCode?: string | null;
}

// SimplifiedResultData는 SimplifiedAnalysisResult와 동일 (별칭)
export type SimplifiedResultData = SimplifiedAnalysisResult & {
  // AI 분석 결과 추가 필드
  risks?: string[];
  recommendations?: string[];
  summary?: string;

  // EvaluationCriteria component를 위한 개별 점수/이유 필드
  codeCompatibilityScore?: number;
  codeCompatibilityReason?: string;
  distinctivenessScore?: number;
  distinctivenessReason?: string;
  similarityScore?: number;
  similarityReason?: string;
  nonRegistrableScore?: number;
  nonRegistrableSummary?: string;
  famousnessScore?: number;
  famousnessSummary?: string;

  // Detailed analysis data for EvaluationCriteria component
  article33Violations?: ArticleViolation[];
  article34_1to6Violations?: ArticleViolation[];
  article34_9to14Violations?: FamousnessViolation[];
  article34_1_7Violation?: boolean;
  article35_1Violation?: boolean;
  conflictingTrademarks?: ConflictingTrademark[];
  internetSearchResults?: InternetSearchResults;
  designatedGoods?: string[];
  designatedGoodsRecommended?: string[];

  // 최종 권고사항 관련 필드 추가
  finalRecommendation?: string;
  detailedAdvice?: string;
  legalRisks?: string[];
  actionItems?: string[];

  // 유사 상표 목록 추가
  similarTrademarks?: SimilarTrademark[];
};

// 컴포넌트 Props
export interface SimplifiedResultsViewProps {
  data: SimplifiedAnalysisResult;
  stage2Id: string; // Stage 3 API 호출용
  onApply?: (result: Stage3ActionResult) => void;
  onConsult?: (result: Stage3ActionResult) => void;
  onBack?: () => void;
  onPDFDownload?: () => void;
}

export interface AnalysisCriterionProps {
  title: string;
  criterion: AnalysisCriterion;
  className?: string;
}

// 진행률 표시용
export interface StageProgressProps {
  currentStage: 1 | 2 | 3;
  completedStages: number[];
  className?: string;
}

// 액션 버튼 그룹
export interface SimplifiedActionButtonsProps {
  probability: number;
  onApply: () => void;
  onConsult: () => void;
  disabled?: boolean;
  className?: string;
}

// Stage 3 액션 관련 타입
export interface ApplicantInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface ConsultationPreferences {
  preferredDate?: string;
  preferredTime?: string;
  contactMethod: 'phone' | 'email' | 'video';
  urgency: 'low' | 'medium' | 'high';
  additionalQuestions?: string;
}

export interface Stage3ActionResult {
  applicationId?: string;
  consultationBookingId?: string;
  status?: string;
  message?: string;
  submittedAt?: string;
  bookedAt?: string;
  estimatedProcessingTime?: string;
  estimatedResponse?: string;
}

// 분석 결과 변환 유틸리티 함수 타입
export type AnalysisDataMapper = {
  fromStage2Data: (stage1: Stage1Data, stage2: Stage2Data) => SimplifiedAnalysisResult;
  getScoreStatus: (score: number) => AnalysisCriterion['status'];
  getScoreIcon: (score: number) => AnalysisCriterion['icon'];
};