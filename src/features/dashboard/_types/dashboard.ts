export interface DashboardStats {
  total: number
  completed: number
  inProgress: number
  thisMonth: number
  applications?: number
  registrations?: number
}

export interface AnalysisSession {
  id: string
  trademark_name: string
  trademark_type: 'text' | 'image' | 'combined'
  business_description?: string
  product_classification_codes?: string[]
  similar_group_codes?: string[]
  designated_products?: string[]
  status: string
  progress: number
  created_at: string
  completed_at?: string
  final_results?: {
    id: string
    registration_possibility: number  // Changed from registration_probability
    risk_level: 'low' | 'medium' | 'high' | 'unknown'  // Calculated from registration_possibility
    designated_goods_compatibility_score?: number
    distinctiveness_score?: number
    prior_trademark_similarity_score?: number
    final_recommendation?: string
    // Removed: key_findings, report_id (not in trademark_final_analysis)
  }
}

export interface TrademarkApplication {
  id: string
  status?: string
  created_at: string
  trademark_type?: string
  analysis_session_id?: string
}

export interface DashboardData {
  sessions: AnalysisSession[]
  stats: DashboardStats
  applications: TrademarkApplication[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DashboardResponse {
  success: boolean
  data: DashboardData
  error?: string
}