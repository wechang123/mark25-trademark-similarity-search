export interface PreBookingData {
  source: "homepage" | "results_page"
  email: string
}

export interface PreBookingResponse {
  success: boolean
  existing?: boolean  // 기존 예약 여부
  booking: {
    id: string
    created_at: string
  }
  email_sent: boolean
  email_error?: string
  fallback_mode?: boolean
}

export interface PreOrderFormData {
  name: string
  email: string
  phone: string
  trademarkInterest: string
  marketingConsent: boolean
}

export interface NotificationSuccessData {
  emailSent: boolean
  emailError?: string
  fallbackMode?: boolean
  existing?: boolean
}

export interface PreOrderHookResult {
  formData: PreOrderFormData
  errors: Record<string, string>
  isSubmitting: boolean
  successData: NotificationSuccessData | null
  actions: {
    handleInputChange: (field: string, value: string | boolean) => void
    submitPreOrder: (source?: "homepage" | "results_page", onSuccess?: (email: string) => void) => Promise<void>
    handleRetry: () => void
    resetForm: () => void
  }
}