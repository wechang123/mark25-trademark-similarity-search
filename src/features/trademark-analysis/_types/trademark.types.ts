export type TrademarkType = 'text' | 'image' | 'combined'

export interface TrademarkInfo {
  // 기본 정보
  workflowId?: string
  type: TrademarkType
  name: string
  descriptions?: string[]
  
  // 분류 정보
  classifications?: string[]
  niceClassifications?: string[]
  
  // 이미지 정보 (도형/결합 상표)
  imageUrl?: string
  imageFile?: File
  
  // 사용자 정보
  userId?: string
  userEmail?: string
  userName?: string
  
  // 시간 정보
  requestTime?: string
  completedTime?: string
  
  // 상태 정보
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  
  // 분석 결과
  confidence?: number
  registrationProbability?: number
}

export interface TrademarkDisplayProps {
  data: TrademarkInfo
  variant?: 'full' | 'compact' | 'summary'
  readOnly?: boolean
  className?: string
}