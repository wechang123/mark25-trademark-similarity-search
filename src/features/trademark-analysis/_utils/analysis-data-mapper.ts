/**
 * 분석 데이터 변환 유틸리티
 * DB 데이터를 간소화된 결과 화면용으로 변환
 */

import { 
  Stage1Data, 
  Stage2Data, 
  SimplifiedAnalysisResult,
  SimplifiedResultData, 
  AnalysisCriterion 
} from '../_types/simplified-types';

/**
 * 점수를 기반으로 상태 결정
 */
export function getScoreStatus(score: number): AnalysisCriterion['status'] {
  if (score >= 80) return 'excellent';  // 100-80점: 매우 우수
  if (score >= 60) return 'good';       // 79-60점: 양호
  if (score >= 40) return 'warning';    // 59-40점: 주의 필요
  return 'danger';                       // 39점 이하: 위험/매우 위험
}

/**
 * 점수를 기반으로 아이콘 결정
 */
export function getScoreIcon(score: number): AnalysisCriterion['icon'] {
  if (score >= 80) return '✓';
  if (score >= 60) return '✓';
  if (score >= 40) return '⚠';
  return '✗';
}

/**
 * 점수와 설명을 기반으로 AnalysisCriterion 생성
 */
export function createAnalysisCriterion(
  score: number, 
  description: string,
  details?: string
): AnalysisCriterion {
  return {
    score,
    description,
    status: getScoreStatus(score),
    icon: getScoreIcon(score),
    details
  };
}

/**
 * Stage 1, 2 데이터를 SimplifiedResultData로 변환
 * 🔥 FIXED: Return SimplifiedResultData with risks, recommendations, summary
 */
export function fromStage2Data(
  stage1: Stage1Data, 
  stage2: Stage2Data
): SimplifiedResultData {
  // 🔥 Parse overall_assessment to extract risks, recommendations, and summary
  let parsedAssessment: any = {};
  if (stage2.overallAssessment) {
    try {
      parsedAssessment = JSON.parse(stage2.overallAssessment);
    } catch (e) {
      console.warn('Failed to parse overall_assessment:', e);
      parsedAssessment = {};
    }
  }
  
  return {
    // 기본 정보
    trademarkName: stage1.trademarkName,
    trademarkType: stage1.trademarkType,
    trademarkImageUrl: stage1.trademarkImageUrl,
    
    // 핵심 결과
    registrationProbability: stage2.registrationProbability,
    aiConfidence: stage2.aiConfidence,
    
    // 5가지 평가 기준
    analysis: {
      codeCompatibility: createAnalysisCriterion(
        stage2.codeCompatibilityScore,
        stage2.codeCompatibilityReason,
        `선택된 유사군 코드: ${stage2.selectedSimilarCode}`
      ),
      distinctiveness: createAnalysisCriterion(
        stage2.distinctivenessScore,
        stage2.distinctivenessReason,
        '상표의 독창성과 식별 능력을 평가한 결과입니다.'
      ),
      priorSimilarity: createAnalysisCriterion(
        stage2.similarityScore,
        stage2.similarityReason,
        `KIPRIS 검색 결과: ${stage2.kiprisResultsCount}개 발견, 위험도 높은 상표: ${stage2.highRiskCount}개`
      ),
      nonRegistrable: createAnalysisCriterion(
        stage2.nonRegistrableScore || 100,
        stage2.nonRegistrableSummary || '불등록 사유에 해당하지 않습니다.',
        '상표법 제34조 제1항 제1호~제6호 검토 결과'
      ),
      famousness: createAnalysisCriterion(
        stage2.famousnessScore || 100,
        stage2.famousnessSummary || '저명상표와의 충돌이 없습니다.',
        '상표법 제34조 제1항 제9호~제14호 검토 결과'
      )
    },
    
    // 메타데이터
    analysisDate: stage2.createdAt,
    processingTime: stage2.processingTimeMs,
    
    // 🔥 Include AI analysis content from overall_assessment
    risks: parsedAssessment.risks || stage2.legalRisks || [],
    recommendations: parsedAssessment.recommendations || stage2.actionItems || [],
    summary: parsedAssessment.summary || `등록 가능성 ${stage2.registrationProbability}% 분석 완료`,
    
    // EvaluationCriteria component를 위한 상세 데이터 추가
    codeCompatibilityScore: stage2.codeCompatibilityScore,
    codeCompatibilityReason: stage2.codeCompatibilityReason,
    distinctivenessScore: stage2.distinctivenessScore,
    distinctivenessReason: stage2.distinctivenessReason,
    similarityScore: stage2.similarityScore,
    similarityReason: stage2.similarityReason,
    nonRegistrableScore: stage2.nonRegistrableScore || 100,
    nonRegistrableSummary: stage2.nonRegistrableSummary || '불등록 사유에 해당하지 않습니다.',
    famousnessScore: stage2.famousnessScore || 100,
    famousnessSummary: stage2.famousnessSummary || '저명상표와의 충돌이 없습니다.',
    
    // 법적 분석 상세 데이터
    article33Violations: stage2.article33Violations,
    article34_1to6Violations: stage2.article34_1to6Violations,
    article34_9to14Violations: stage2.article34_9to14Violations,
    article34_1_7Violation: stage2.article34_1_7Violation,
    article35_1Violation: stage2.article35_1Violation,
    conflictingTrademarks: stage2.conflictingTrademarks,
    internetSearchResults: stage2.internetSearchResults,
    designatedGoods: stage2.designatedGoods,
    designatedGoodsRecommended: stage2.designatedGoodsRecommended,
    
    // 최종 권고사항 관련 필드 추가
    finalRecommendation: stage2.finalRecommendation,
    detailedAdvice: stage2.detailedAdvice,
    legalRisks: stage2.legalRisks,
    actionItems: stage2.actionItems
  };
}

/**
 * 더미 데이터 생성 (개발/테스트용)
 */
export function createDummyAnalysisResult(
  trademarkName = '테스트상표',
  probability = 78
): SimplifiedAnalysisResult {
  return {
    trademarkName,
    trademarkType: 'text',
    registrationProbability: probability,
    aiConfidence: 92,
    analysis: {
      codeCompatibility: createAnalysisCriterion(
        85,
        '선택된 유사군 코드가 사업 영역과 매우 적절하게 매칭됩니다.',
        'G0602 (소프트웨어 개발 및 컴퓨터 프로그래밍 서비스)'
      ),
      distinctiveness: createAnalysisCriterion(
        72,
        '상표의 독창성이 양호하여 소비자 식별에 적합합니다.',
        '일반적인 단어의 조합이지만 독특한 의미를 가집니다.'
      ),
      priorSimilarity: createAnalysisCriterion(
        65,
        '일부 유사한 상표가 존재하여 주의가 필요합니다.',
        'KIPRIS 검색 결과: 23개 발견, 위험도 높은 상표: 3개'
      ),
      nonRegistrable: createAnalysisCriterion(
        90,
        '불등록 사유에 해당하지 않습니다.',
        '상표법 제34조 제1항 제1호~제6호 모두 통과'
      ),
      famousness: createAnalysisCriterion(
        95,
        '저명상표와의 충돌이 없습니다.',
        '인터넷 검색 결과 동일/유사 저명상표 발견되지 않음'
      )
    },
    analysisDate: new Date().toISOString(),
    processingTime: 4200
  };
}

/**
 * 실제 DB 데이터를 가져와서 변환하는 함수 (서비스에서 사용)
 */
export async function getSimplifiedAnalysisResult(
  stage1Id: string
): Promise<SimplifiedAnalysisResult | null> {
  try {
    // 실제 구현에서는 Supabase에서 데이터를 가져옴
    // 지금은 더미 데이터 반환
    return createDummyAnalysisResult();
  } catch (error) {
    console.error('분석 결과 조회 실패:', error);
    return null;
  }
}

export const analysisDataMapper = {
  fromStage2Data,
  getScoreStatus,
  getScoreIcon,
  createAnalysisCriterion,
  createDummyAnalysisResult,
  getSimplifiedAnalysisResult
};