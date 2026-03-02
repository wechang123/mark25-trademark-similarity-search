// Google Analytics 유틸리티 함수들

declare global {
  interface Window {
    gtag: (command: string, action: string, parameters?: any) => void
  }
}

// Google Analytics 측정 ID
export const GA_MEASUREMENT_ID = "G-3GRXNHV27T"

// 페이지뷰 추적
export const trackPageView = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// 이벤트 추적
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// 상표 분석 시작 이벤트
export const trackAnalysisStart = (trademarkName?: string) => {
  trackEvent("analysis_start", "trademark_analysis", trademarkName)
}

// 상표 분석 완료 이벤트
export const trackAnalysisComplete = (trademarkName?: string, result?: string) => {
  trackEvent("analysis_complete", "trademark_analysis", `${trademarkName}_${result}`)
}

// 사전 예약 이벤트
export const trackPreBooking = (email: string) => {
  trackEvent("pre_booking", "engagement", email)
}

// 버튼 클릭 이벤트
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent("button_click", "engagement", `${buttonName}_${location}`)
}

// 폼 제출 이벤트
export const trackFormSubmit = (formName: string) => {
  trackEvent("form_submit", "engagement", formName)
}
