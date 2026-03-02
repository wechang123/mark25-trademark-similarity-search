export interface AIAnalysisResult {
  summary: string
  probability: number
  confidence: number
  risks: string[]
  recommendations: string[]
}

export interface TrademarkSearch {
  id: string
  trademark: string
  industry: string
  description?: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  results?: any
  risk_score?: number
  risk_level?: "LOW" | "MEDIUM" | "HIGH"
  ai_analysis?: AIAnalysisResult
  expert_analysis?: ExpertAnalysisResult
  expert_analysis_completed_at?: string
  similar_trademarks?: any
  recommendations?: string[]
  risk_factors?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
}

// 전문 분석 결과 타입 정의
export interface ExpertAnalysisResult {
  legalBasisAnalysis: {
    relevantArticles: string[]
    applicableStandards: string[]
    legalRiskFactors: string[]
    legalConfidence: number
  }
  rejectionRiskAnalysis: {
    primaryRiskFactors: string[]
    similarCasePatterns: string[]
    rejectionProbability: number
    criticalIssues: string[]
  }
  precedentAnalysis: {
    relevantCases: Array<{
      caseId: string
      summary: string
      outcome: string
      relevance: number
    }>
    judicialTrends: string[]
    strategicInsights: string[]
  }
  registrationStrategy: {
    recommendedApproach: string[]
    alternativeStrategies: string[]
    riskMitigationMethods: string[]
    timelineConsiderations: string[]
  }
  responseRecommendations: {
    immediateActions: string[]
    longTermStrategy: string[]
    contingencyPlans: string[]
    expertAdvice: string[]
  }
  overallAssessment: {
    expertConfidence: number
    registrationLikelihood: number
    strategicRecommendation: 'PROCEED' | 'PROCEED_WITH_CAUTION' | 'MODIFY_APPROACH' | 'ALTERNATIVE_STRATEGY'
    summaryInsights: string[]
  }
}

export interface AnalysisWaitlist {
  id: string
  trademark_search_id: string
  name: string
  email: string
  phone: string
  trademark_name: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  created_at: string
}

export interface ServicePreBooking {
  id: string
  source: "homepage" | "results_page"
  name: string
  email: string
  phone: string
  trademark_interest?: string
  voucher_code: string
  voucher_value: number
  status: "active" | "used" | "expired" | "cancelled"
  created_at: string
}
