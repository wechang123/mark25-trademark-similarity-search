'use client'

import { useState, useCallback } from 'react'
import { preOrderService } from '../_services'
import type { PreOrderFormData, NotificationSuccessData, PreOrderHookResult } from '../_types'

export function usePreOrder(): PreOrderHookResult {
  const [formData, setFormData] = useState<PreOrderFormData>({
    name: "",
    email: "",
    phone: "",
    trademarkInterest: "",
    marketingConsent: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<NotificationSuccessData | null>(null)

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData.email])

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }, [errors])

  const submitPreOrder = useCallback(async (
    source: "homepage" | "results_page" = "homepage",
    onSuccess?: (email: string) => void
  ) => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await preOrderService.createPreBooking({
        source: source,
        email: formData.email,
      })

      setSuccessData({
        emailSent: result.email_sent,
        emailError: result.email_error,
        fallbackMode: result.fallback_mode,
        existing: result.existing,
      })

      // 성공 콜백 호출
      onSuccess?.(formData.email)
    } catch (error) {
      console.error("서비스 출시 알림 신청 실패:", error)

      let errorMessage = "요청 처리 중 오류가 발생했습니다. 다시 시도해주세요."

      if (error instanceof Error) {
        if (error.message.includes("이미 등록된") || error.message.includes("이미 해당 이메일")) {
          errorMessage = "이미 해당 이메일로 서비스 출시 알림 신청이 완료되었습니다."
        } else {
          errorMessage = error.message
        }
      }

      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  const handleRetry = useCallback(() => {
    setErrors({})
    setSuccessData(null)
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      trademarkInterest: "",
      marketingConsent: false,
    })
    setErrors({})
    setSuccessData(null)
  }, [])

  return {
    formData,
    errors,
    isSubmitting,
    successData,
    actions: {
      handleInputChange,
      submitPreOrder,
      handleRetry,
      resetForm,
    }
  }
}