import { mockTrademarkData, mockProgressSteps } from "./mock-data"

export const mockAPI = {
  // 분석 시작
  startAnalysis: async (trademarkName: string, industry: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          searchId: `search_${Date.now()}`,
          status: "processing",
        })
      }, 500)
    })
  },

  // 진행 상황 폴링
  getProgress: async (searchId: string, currentProgress = 0) => {
    return new Promise((resolve) => {
      const nextStep =
        mockProgressSteps.find((step) => step.progress > currentProgress) ||
        mockProgressSteps[mockProgressSteps.length - 1]
      setTimeout(
        () => {
          resolve({
            success: true,
            ...nextStep,
          })
        },
        1000 + Math.random() * 1000,
      ) // 1-2초 랜덤 딜레이
    })
  },

  // 최종 결과
  getResults: async (searchId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockTrademarkData.searchResult,
        })
      }, 1000)
    })
  },

  // PDF 요청
  requestPDF: async (userInfo: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "PDF 보고서가 이메일로 발송되었습니다.",
          reportId: `report_${Date.now()}`,
        })
      }, 1500)
    })
  },
}
