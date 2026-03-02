import { DashboardResponse } from '../_types/dashboard'

export class DashboardService {
  static async getDashboardData(page = 1, limit = 10): Promise<DashboardResponse> {
    try {
      const response = await fetch(`/api/dashboard?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      return await response.json()
    } catch (error) {
      console.error('Dashboard service error:', error)
      throw error
    }
  }

  static async refreshDashboard(): Promise<DashboardResponse> {
    return this.getDashboardData(1, 10)
  }

  static formatRiskLevel(riskLevel: string): { label: string; color: string; bgColor: string } {
    switch (riskLevel) {
      case 'low':
        return { label: '낮음', color: 'text-green-600', bgColor: 'bg-green-50' }
      case 'medium':
        return { label: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
      case 'high':
        return { label: '높음', color: 'text-red-600', bgColor: 'bg-red-50' }
      default:
        return { label: '분석중', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
  }

  static formatTrademarkType(type: string): string {
    switch (type) {
      case 'text':
        return '문자'
      case 'image':
        return '이미지'
      case 'combined':
        return '복합'
      default:
        return '기타'
    }
  }

  static formatApplicationStatus(status?: string): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'draft':
        return { label: '작성중', color: 'text-blue-600', bgColor: 'bg-blue-50' }
      case 'submitted':
        return { label: '제출완료', color: 'text-green-600', bgColor: 'bg-green-50' }
      case 'pending':
        return { label: '검토중', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
      case 'approved':
        return { label: '승인', color: 'text-green-600', bgColor: 'bg-green-50' }
      case 'rejected':
        return { label: '거절', color: 'text-red-600', bgColor: 'bg-red-50' }
      default:
        return { label: '준비중', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
  }

  static calculateSuccessRate(probability: number): { percentage: string; color: string; bgColor: string } {
    if (probability >= 80) {
      return { percentage: `${probability}%`, color: 'text-green-600', bgColor: 'bg-green-50' }
    } else if (probability >= 60) {
      return { percentage: `${probability}%`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else {
      return { percentage: `${probability}%`, color: 'text-red-600', bgColor: 'bg-red-50' }
    }
  }

  static formatProductClassification(codes?: string[]): string {
    if (!codes || codes.length === 0) {
      return '분류 미지정'
    }
    
    // 첫 번째 코드만 표시 (예: "42류")
    const firstCode = codes[0]
    if (firstCode.includes('류')) {
      return firstCode
    } else {
      return `${firstCode}류`
    }
  }

  static formatDesignatedProducts(products?: string[]): string {
    if (!products || products.length === 0) {
      return '지정상품 미설정'
    }
    
    // 첫 번째 상품만 표시하고 나머지는 "외 N개"로 표시
    if (products.length === 1) {
      return products[0]
    } else {
      return `${products[0]} 외 ${products.length - 1}개`
    }
  }
}