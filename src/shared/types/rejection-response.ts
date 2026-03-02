// 거절 대응 관련 타입 정의

export interface RejectionNotice {
  id: string
  trademarkName: string
  applicationNumber: string
  rejectionDate: string
  rejectionReasons: RejectionReason[]
  deadline: string
  documentType: "text" | "file"
  content?: string
  fileUrl?: string
}

export interface RejectionReason {
  id: string
  code: string
  category: "SIMILARITY" | "DISTINCTIVENESS" | "PROHIBITION" | "FORMAL" | "OTHER"
  title: string
  description: string
  citedTrademarks?: CitedTrademark[]
  severity: "HIGH" | "MEDIUM" | "LOW"
}

export interface CitedTrademark {
  id: string
  name: string
  registrationNumber: string
  applicant: string
  similarity: number
  classification: string
}

export interface AIResponseStrategy {
  id: string
  rejectionReasonId: string
  strategy: string
  legalBasis: string[]
  argumentPoints: string[]
  evidenceRequests: string[]
  successRate: number
  estimatedTime: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
}

export interface ResponseDocument {
  id: string
  type: "의견서" | "보정서" | "분할출원"
  sections: ResponseSection[]
  generatedContent: string
  editableContent: string
  status: "DRAFT" | "REVIEW" | "FINAL"
}

export interface ResponseSection {
  id: string
  title: string
  content: string
  isEditable: boolean
  suggestions: string[]
}

export interface RejectionAnalysisResult {
  rejectionNotice: RejectionNotice
  aiAnalysis: {
    summary: string
    mainIssues: string[]
    overallDifficulty: "EASY" | "MEDIUM" | "HARD"
    recommendedAction: "RESPONSE" | "APPEAL" | "AMENDMENT" | "ABANDON"
    successProbability: number
  }
  responseStrategies: AIResponseStrategy[]
  estimatedCost: {
    selfResponse: number
    professionalResponse: number
    appealProcess: number
  }
  timeline: {
    responseDeadline: string
    recommendedSubmissionDate: string
    estimatedProcessingTime: string
  }
} 