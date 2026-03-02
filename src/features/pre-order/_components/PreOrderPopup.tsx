"use client"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { X, Bell, CheckCircle, AlertCircle, RefreshCw, Shield, FileText, Users, Award, Database } from "lucide-react"
import { usePreOrder } from '../_hooks'
import type { NotificationSuccessData } from '../_types'

interface PreOrderPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (email: string, voucherCode?: string) => void
  source?: "homepage" | "results_page"
}

export function PreOrderPopup({ isOpen, onClose, onSuccess, source = "homepage" }: PreOrderPopupProps) {
  const {
    formData,
    errors,
    isSubmitting,
    successData,
    actions: { handleInputChange, submitPreOrder, handleRetry, resetForm }
  } = usePreOrder()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitPreOrder(source, onSuccess)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  // 성공 화면
  if (successData) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-neutral-200 relative">
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

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {successData.existing ? "이미 신청 완료!" : "출시 알림 신청 완료!"}
            </h2>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg mb-6">
              <div className="text-base">서비스 출시 시 가장 먼저 연락드리겠습니다.<br />신청해 주셔서 감사합니다.</div>
            </div>

            {successData.emailSent ? (
              <div className="bg-info-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center text-blue-700 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">
                    {successData.existing ? "알림 정보 재발송 완료" : "확인 이메일 발송 완료"}
                  </span>
                </div>
                <p className="text-sm text-info-600">
                  {successData.existing
                    ? "기존 알림 정보를 이메일로 다시 발송했습니다."
                    : "입력하신 이메일로 알림 신청 확인 메일이 발송되었습니다."}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center text-yellow-700 mb-2">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">
                    {successData.existing
                      ? "기존 신청 확인"
                      : successData.fallbackMode
                        ? "오프라인 모드"
                        : "이메일 발송 실패"}
                  </span>
                </div>
                <p className="text-sm text-yellow-600 mb-2">
                  {successData.existing
                    ? "이미 등록된 이메일입니다."
                    : successData.fallbackMode
                      ? "신청이 완료되었지만 이메일 발송 기능이 준비 중입니다."
                      : "신청은 완료되었지만 확인 이메일 발송에 실패했습니다."}
                </p>
                {successData.emailError && <p className="text-xs text-yellow-500">오류: {successData.emailError}</p>}
              </div>
            )}

            <div className="text-sm text-neutral-600 mb-6">
              <p className="mb-2">
                • 서비스 출시 시 이메일로 알림을 받으실 수 있습니다
              </p>
              <p>• 개인정보는 안전하게 보호되며, 언제든 수신거부 가능합니다</p>
            </div>

            <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              확인
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-xl border border-neutral-200 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="sticky top-4 right-4 z-10 ml-auto mr-4 mt-4 hover:bg-neutral-100 rounded-full w-8 h-8 p-0 bg-white shadow-md"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-8 rounded-t-xl -mt-12 pt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">서비스 출시 알림 신청</h2>
            <p className="text-slate-200 text-lg">전문적인 상표 분석 서비스 출시 소식을 가장 먼저 받아보세요</p>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">출시 예정 서비스 미리보기</h3>
            <div className="grid gap-4">
              <div className="flex items-start space-x-4 p-4 bg-info-50 rounded-lg border border-blue-100">
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">전문가 수준 분석 보고서</h4>
                  <p className="text-sm text-neutral-600">
                    변리사가 직접 검토한 상세 분석 보고서와 법적 조언을 제공합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-success-50 rounded-lg border border-green-100">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">1:1 전문가 상담</h4>
                  <p className="text-sm text-neutral-600">상표 전문 변리사와의 개별 상담을 통한 맞춤형 전략 수립</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">프리미엄 서비스</h4>
                  <p className="text-sm text-neutral-600">더 정확하고 전문적인 상표 분석 서비스를 제공합니다</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">알림 신청하기</h4>
              <p className="text-neutral-600 text-sm">서비스 출시 소식을 이메일로 받아보세요</p>
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium text-neutral-700 mb-2 block">
                이름
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`${errors.name ? "border-red-500" : "border-neutral-300"} focus:border-blue-500 focus:ring-blue-500`}
                placeholder="홍길동"
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-neutral-700 mb-2 block">
                이메일 주소 *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`${errors.email ? "border-red-500" : "border-neutral-300"} focus:border-blue-500 focus:ring-blue-500`}
                placeholder="example@email.com"
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-neutral-700 mb-2 block">
                연락처
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`${errors.phone ? "border-red-500" : "border-neutral-300"} focus:border-blue-500 focus:ring-blue-500`}
                placeholder="010-1234-5678 (선택)"
                disabled={isSubmitting}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="trademarkInterest" className="text-sm font-medium text-neutral-700 mb-2 block">
                관심 있는 상표
              </Label>
              <Textarea
                id="trademarkInterest"
                value={formData.trademarkInterest}
                onChange={(e) => handleInputChange("trademarkInterest", e.target.value)}
                className={`${errors.trademarkInterest ? "border-red-500" : "border-neutral-300"} focus:border-blue-500 focus:ring-blue-500`}
                placeholder="등록을 원하는 상표나 브랜드명을 입력해주세요 (선택)"
                rows={3}
                disabled={isSubmitting}
              />
              {errors.trademarkInterest && <p className="text-red-500 text-sm mt-1">{errors.trademarkInterest}</p>}
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={formData.marketingConsent}
                onCheckedChange={(checked) =>
                  handleInputChange("marketingConsent", checked as boolean)
                }
                className="mt-1"
                disabled={isSubmitting}
              />
              <Label htmlFor="marketing" className="text-sm text-neutral-600 leading-relaxed">
                서비스 관련 정보 수신에 동의합니다. (선택)
                <br />
                <span className="text-xs text-neutral-500">
                  상표 관련 법적 정보, 서비스 업데이트, 특별 혜택 안내를 받아보실 수 있습니다.
                </span>
              </Label>
            </div>

            {errors.submit && (
              <div className="bg-error-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
                {errors.submit.includes("서비스 준비 중") && (
                  <div className="mt-3 p-3 bg-info-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-700 mb-2">
                      <Database className="w-4 h-4 mr-2" />
                      <span className="font-semibold text-sm">데이터베이스 설정 필요</span>
                    </div>
                    <p className="text-xs text-info-600">
                      관리자가 Supabase에서 데이터베이스 테이블을 설정해야 합니다.
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={handleRetry}
                  className="mt-3 bg-error-100 hover:bg-red-200 text-red-700 text-sm h-8"
                  size="sm"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  다시 시도
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-slate-700 hover:bg-slate-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  출시 알림 신청하기
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-neutral-500">
                <a href="#" className="text-slate-600 hover:underline">
                  개인정보처리방침
                </a>
                에 따라 안전하게 처리되며, 언제든 수신거부 가능합니다.
              </p>
            </div>
          </form>
        </div>

        <div className="bg-neutral-50 px-8 py-6 rounded-b-xl border-t border-gray-100">
          <div className="flex items-center justify-center space-x-8 text-sm text-neutral-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span>개인정보 보호</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span>즉시 알림 등록</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span>언제든 수신거부</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}