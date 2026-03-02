/**
 * 상표 평가 분석 관련 타입 정의
 * 3가지 핵심 평가 기준: 유사군 코드 적합성, 상표의 식별력, 선행상표 유사도
 */

import { Database } from '@/infrastructure/database/types'

export type TrademarkEvaluationAnalysis = Database['public']['Tables']['trademark_evaluation_analysis']['Row']
export type TrademarkEvaluationAnalysisInsert = Database['public']['Tables']['trademark_evaluation_analysis']['Insert']
export type TrademarkEvaluationAnalysisUpdate = Database['public']['Tables']['trademark_evaluation_analysis']['Update']

// 평가 점수 범위 (0-100점)
export type EvaluationScore = number & { readonly __brand: 'EvaluationScore' }

// 등록 성공 가능성 (%로 표시)
export type RegistrationProbability = number & { readonly __brand: 'RegistrationProbability' }

// 3가지 핵심 평가 기준
export interface CoreEvaluationCriteria {
  /** 유사군 코드 적합성 (33.3% 가중치) */
  codeCompatibility: EvaluationScore
  /** 상표의 식별력 (33.3% 가중치) */
  distinctiveness: EvaluationScore
  /** 선행상표 유사도 (33.4% 가중치) */
  similarity: EvaluationScore
}

// 각 기준별 상세 분석
export interface DetailedEvaluationAnalysis {
  /** 유사군 코드 적합성 분석 */
  codeCompatibilityAnalysis: string
  /** 상표의 식별력 분석 */
  distinctivenessAnalysis: string
  /** 선행상표 유사도 분석 */
  similarityAnalysis: string
}

// 완전한 평가 결과
export interface ComprehensiveEvaluationResult extends CoreEvaluationCriteria, DetailedEvaluationAnalysis {
  /** 등록 성공 가능성 (메인 결과) */
  registrationSuccessProbability: RegistrationProbability
  /** 분석 신뢰도 */
  analysisConfidence: EvaluationScore
  /** 분석 버전 */
  analysisVersion: string
  /** 처리 시간 (밀리초) */
  processingTimeMs?: number
}

// 평가 기준별 등급
export type EvaluationGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'

// 점수를 등급으로 변환하는 유틸리티 타입
export interface ScoreToGradeMapping {
  score: EvaluationScore
  grade: EvaluationGrade
  description: string
}

// 각 평가 기준에 대한 등급 기준
export const EVALUATION_GRADE_CRITERIA = {
  EXCELLENT: { min: 90, max: 100, color: 'green' },
  GOOD: { min: 70, max: 89, color: 'blue' },
  FAIR: { min: 50, max: 69, color: 'yellow' },
  POOR: { min: 30, max: 49, color: 'orange' },
  CRITICAL: { min: 0, max: 29, color: 'red' }
} as const

// 유사군 코드 적합성 등급별 설명
export const CODE_COMPATIBILITY_DESCRIPTIONS = {
  EXCELLENT: '선택된 유사군 코드와 상표/상품이 완벽하게 일치합니다.',
  GOOD: '대부분의 상품이 해당 유사군 코드에 적합합니다.',
  FAIR: '일부 상품만 해당 유사군에 포함됩니다.',
  POOR: '유사군 코드 선택이 부적절합니다.',
  CRITICAL: '완전히 다른 분야의 유사군 코드입니다.'
} as const

// 상표의 식별력 등급별 설명
export const DISTINCTIVENESS_DESCRIPTIONS = {
  EXCELLENT: '강한 식별력을 가진 독창적인 상표입니다.',
  GOOD: '보통 수준의 식별력을 가진 상표입니다.',
  FAIR: '약한 식별력을 가진 상표입니다.',
  POOR: '식별력이 매우 약한 상표입니다.',
  CRITICAL: '식별력이 없는 기술적/일반명칭 표장입니다.'
} as const

// 선행상표 유사도 등급별 설명
export const SIMILARITY_DESCRIPTIONS = {
  EXCELLENT: '유사상표가 없거나 매우 낮은 유사도입니다.',
  GOOD: '일부 유사상표가 있으나 낮은 충돌 위험입니다.',
  FAIR: '중간 수준의 유사상표가 존재합니다.',
  POOR: '높은 유사도 상표가 다수 존재합니다.',
  CRITICAL: '매우 유사한 상표가 다수 존재하여 등록이 어렵습니다.'
} as const

// 점수를 등급으로 변환하는 함수
export function scoreToGrade(score: number): EvaluationGrade {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 70) return 'GOOD'
  if (score >= 50) return 'FAIR'
  if (score >= 30) return 'POOR'
  return 'CRITICAL'
}

// 등록 성공 가능성에 따른 권고사항
export const REGISTRATION_RECOMMENDATIONS = {
  HIGH: {
    range: [80, 100],
    message: '등록 가능성이 높습니다. 적극적으로 출원을 진행하시기 바랍니다.',
    color: 'green'
  },
  MEDIUM_HIGH: {
    range: [60, 79],
    message: '등록 가능성이 있습니다. 몇 가지 개선 사항을 고려하여 출원하시기 바랍니다.',
    color: 'blue'
  },
  MEDIUM: {
    range: [40, 59],
    message: '등록에 주의가 필요합니다. 상표 수정이나 추가 검토를 권장합니다.',
    color: 'yellow'
  },
  LOW: {
    range: [20, 39],
    message: '등록이 어려울 수 있습니다. 상표명 변경을 고려하시기 바랍니다.',
    color: 'orange'
  },
  VERY_LOW: {
    range: [0, 19],
    message: '현재 상표로는 등록이 매우 어렵습니다. 전면적인 재검토가 필요합니다.',
    color: 'red'
  }
} as const