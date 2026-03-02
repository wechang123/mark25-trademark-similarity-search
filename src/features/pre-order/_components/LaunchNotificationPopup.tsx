"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Badge } from "@/shared/components/ui/badge"
import { X, Bell, CheckCircle } from "lucide-react"
import { preOrderService } from '../_services'
import type { NotificationSuccessData } from '../_types'

interface LaunchNotificationPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (email: string) => void
  source?: "homepage" | "results_page"
}

export function LaunchNotificationPopup({ isOpen, onClose, onSuccess, source = "homepage" }: LaunchNotificationPopupProps) {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<NotificationSuccessData | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = "이메일을 입력해주세요"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await preOrderService.createPreBooking({
        source: source,
        email: email,
      })

      setSuccessData({
        emailSent: result.email_sent,
        emailError: result.email_error,
        fallbackMode: result.fallback_mode,
        existing: result.existing,
      })

      // 성공 콜백 호출
      onSuccess(email)
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
  }

  const handleInputChange = (value: string) => {
    setEmail(value)
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const handleClose = () => {
    setEmail("")
    setErrors({})
    setSuccessData(null)
    onClose()
  }

  if (!isOpen) return null

  // 성공 화면
  if (successData) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-gray-100 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 hover:bg-neutral-100 rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-info-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {successData.existing ? "이미 신청 완료!" : "출시 알림 신청 완료!"}
            </h3>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg mb-6">
              <div className="text-base">서비스 출시 시 가장 먼저 연락드리겠습니다.<br />신청해 주셔서 감사합니다.</div>
            </div>

            <Button 
              onClick={handleClose} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border border-gray-100 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 hover:bg-neutral-100 rounded-full w-8 h-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="p-8">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-info-100 text-info-800 hover:bg-info-100">
              🔔 2025년 10월 정식 서비스 출시 예정
            </Badge>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              <span className="text-info-600">AI 기반 상표 분석 서비스</span>
              <br />
              출시 알림을 받아보세요
            </h2>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              서비스 출시 알림 신청
            </h3>
            <p className="text-neutral-600 text-sm">
              이메일 주소만 입력하면 출시 즉시 알림을 받으실 수 있습니다
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-neutral-700 font-medium">
                이메일 주소 *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`mt-1 ${errors.email ? "border-red-500" : "border-neutral-300"} focus:border-blue-500 focus:ring-blue-500`}
                placeholder="example@email.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {errors.submit && (
              <div className="bg-error-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <Bell className="mr-2 w-4 h-4" />
                  출시 알림 신청하기
                </>
              )}
            </Button>

            <p className="text-xs text-neutral-500 text-center mt-4">
              개인정보는 안전하게 보호되며, 언제든 수신거부 가능합니다.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}