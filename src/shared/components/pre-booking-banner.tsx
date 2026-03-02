"use client";

import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { usePreBooking } from "@/shared/hooks/use-pre-booking";

interface PreBookingBannerProps {
  className?: string;
}

export function PreBookingBanner({ className = "" }: PreBookingBannerProps) {
  const {
    formData,
    isSubmitting,
    errors,
    successData,
    handleInputChange,
    handleSubmit,
    closeSuccess,
    isSuccess,
  } = usePreBooking({ source: "homepage" });

  if (isSuccess) {
    return (
      <section className={`py-8 px-4 bg-gradient-to-r from-orange-50 to-yellow-50 ${className}`}>
        <div className="container mx-auto max-w-4xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                출시 알림 신청 완료!
              </h3>
              
              <p className="text-neutral-600 mb-6 leading-relaxed">
                상표 출원 서비스 출시 시 가장 먼저 연락드리겠습니다.
                <br />
                신청해 주셔서 감사합니다.
              </p>
              
              <Button 
                onClick={closeSuccess}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6"
              >
                확인
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-8 px-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100 ${className}`}>
      <div className="container mx-auto max-w-4xl">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center">
              {/* Launch Badge */}
              <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-0 text-sm font-semibold">
                🚀 2025년 10월 정식 출시
              </Badge>
              
              {/* Main Heading */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                상표 출원 서비스 출시 알림
              </h2>
              
              {/* Subtitle */}
              <p className="text-base sm:text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
                정식 서비스 출시 시 가장 먼저 알려드리겠습니다
              </p>

              {/* Pre-booking Form */}
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="text-left">
                    <Label htmlFor="banner-email" className="text-sm font-medium text-neutral-700">
                      이메일 주소
                    </Label>
                    <Input
                      id="banner-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`mt-2 h-12 text-base ${
                        errors.email ? "border-red-500 focus:border-red-500" : "border-neutral-300 focus:border-brand-500"
                      } rounded-xl`}
                      placeholder="example@email.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-2 text-left">{errors.email}</p>
                    )}
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700 text-center">{errors.submit}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={isSubmitting || !formData.email.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 w-5 h-5" />
                        출시 알림 신청하기
                      </>
                    )}
                  </Button>

                  {/* Privacy Notice */}
                  <p className="text-xs sm:text-sm text-neutral-500 text-center leading-relaxed">
                    개인정보는 안전하게 보호되며, 언제든 수신거부 가능합니다.
                  </p>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}