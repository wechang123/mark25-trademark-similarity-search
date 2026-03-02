export interface TrademarkAnalysisResult {
  searchId?: string
  trademarkName: string
  industry: string
  overallRisk: "안전" | "주의" | "위험"
  registrationPossibility: number
  similarCount: number
  industryCollision: string
  aiConfidence: number
  similarTrademarks: SimilarTrademark[]
  imageSimilarityResults?: ImageSimilarityResult[]
  hasImageAnalysis: boolean
  aiAnalysis: {
    summary: string
    probability: number
    confidence: number
    risks: string[]
    recommendations: string[]
  }
  expertAnalysis?: any
  expert_analysis?: any
}

export interface ImageSimilarityResult {
  id: string
  imagePath: string
  thumbnailPath: string
  title: string
  applicantName: string
  applicationDate: string
  registrationDate?: string
  applicationStatus: string
  goodsClassificationCode: string
  similarityScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
}

export interface SimilarTrademark {
  id: string
  name: string
  applicant: string
  similarity: number
  status: string
  applicationDate: string
  classification: string
  riskLevel: "HIGH" | "MEDIUM" | "LOW"
  imageUrl?: string
  drawingType?: string
}

export const mockTrademarkData: { searchResult: TrademarkAnalysisResult } = {
  searchResult: {
    trademarkName: "카페나무",
    industry: "cafe",
    overallRisk: "주의",
    registrationPossibility: 73,
    similarCount: 8,
    industryCollision: "보통",
    aiConfidence: 92,
    hasImageAnalysis: false,

    similarTrademarks: [
      {
        id: "1",
        name: "커피나무",
        applicant: "㈜그린카페",
        similarity: 89,
        status: "등록",
        applicationDate: "2021-03-15",
        classification: "43류",
        riskLevel: "HIGH",
        imageUrl: "https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=커피나무",
        drawingType: "일반상표",
      },
      {
        id: "2",
        name: "나무카페",
        applicant: "나무앤컴퍼니",
        similarity: 76,
        status: "출원",
        applicationDate: "2023-08-22",
        classification: "43류",
        riskLevel: "MEDIUM",
        imageUrl: "https://via.placeholder.com/80x80/FF9800/FFFFFF?text=나무카페",
        drawingType: "일반상표",
      },
      {
        id: "3",
        name: "카페트리",
        applicant: "개인사업자 김○○",
        similarity: 45,
        status: "등록",
        applicationDate: "2020-11-03",
        classification: "43류",
        riskLevel: "LOW",
        imageUrl: "https://via.placeholder.com/80x80/2196F3/FFFFFF?text=카페트리",
        drawingType: "일반상표",
      },
      {
        id: "4",
        name: "트리카페",
        applicant: "㈜카페트리",
        similarity: 52,
        status: "등록",
        applicationDate: "2019-07-12",
        classification: "43류",
        riskLevel: "LOW",
        imageUrl: "https://via.placeholder.com/80x80/9C27B0/FFFFFF?text=트리카페",
        drawingType: "일반상표",
      },
      {
        id: "5",
        name: "우드카페",
        applicant: "우드앤카페 주식회사",
        similarity: 38,
        status: "등록",
        applicationDate: "2022-01-28",
        classification: "43류",
        riskLevel: "LOW",
        imageUrl: "https://via.placeholder.com/80x80/795548/FFFFFF?text=우드카페",
        drawingType: "일반상표",
      },
    ],

    aiAnalysis: {
      summary:
        "입력하신 '카페나무'는 기존 등록상표 '커피나무'와 높은 유사도를 보입니다. 특히 발음과 의미 면에서 혼동 가능성이 있어 등록이 어려울 수 있습니다.",
      probability: 73,
      confidence: 92,
      risks: [
        "기존 등록상표 '커피나무'와 발음 유사도 89%",
        "동일 상품분류(43류) 내 유사상표 다수 존재",
        "카페 관련 업종에서 혼동 가능성 높음",
      ],
      recommendations: [
        "상표명을 '카페나무하우스' 등으로 구체화하여 식별력 강화",
        "영문명 'CAFE TREE' 등 추가 요소 결합 고려",
        "디자인 상표로 출원하여 차별화 도모",
      ],
    },
  },
}

export const mockProgressSteps = [
  { step: 1, message: "키프리스 데이터베이스 검색 중...", progress: 15 },
  { step: 2, message: "유사 상표 수집 완료", progress: 30 },
  { step: 3, message: "AI 발음 유사도 분석 중...", progress: 50 },
  { step: 4, message: "의미 유사도 계산 중...", progress: 70 },
  { step: 5, message: "법적 위험도 평가 중...", progress: 85 },
  { step: 6, message: "상세 보고서 생성 중...", progress: 95 },
  { step: 7, message: "분석 완료!", progress: 100 },
]

export const funFacts = [
  "💡 알고 계셨나요? 한국에는 현재 100만 개 이상의 상표가 등록되어 있습니다",
  "💡 상표 심사는 보통 9-12개월이 소요됩니다",
  "💡 유사한 상표로 인한 거절률은 약 30%입니다",
  "💡 상표권은 10년마다 갱신할 수 있습니다",
  "💡 한 번 등록된 상표는 계속 갱신하면 영구적으로 보호받을 수 있습니다",
]
