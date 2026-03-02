"use client";

import { useState } from "react";
import { Bell, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { usePreBooking } from "@/shared/hooks/use-pre-booking";

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onAnalysisClick?: () => void;
}

export function HeroSection({ onSearch, onAnalysisClick }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    formData,
    isSubmitting,
    errors,
    successData,
    handleInputChange,
    handleSubmit: handlePreBookingSubmit,
    closeSuccess,
    isSuccess,
  } = usePreBooking({ source: "homepage" });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand-200/20 to-purple-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-brand-200/20 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4 py-12 sm:py-20 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
            <span className="block text-gray-900">내 브랜드, 등록 가능할까?</span>
            <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-brand-500 to-blue-600 bg-clip-text text-transparent">
              60초만에 AI가 무료로 분석해드려요
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            상표 등록 전, 유사 상표를 미리 확인하고<br className="hidden sm:block" />
            거절 위험 없이 안전하게 출원하세요
          </p>

          {/* Main CTA Button */}
          {onAnalysisClick && (
            <div className="mb-8 sm:mb-12">
              <Button
                onClick={onAnalysisClick}
                size="lg"
                className="w-full max-w-lg mx-auto bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white px-8 py-5 sm:py-6 text-lg sm:text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #2563EB 100%)',
                  boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="font-extrabold tracking-wide">분석하러 가기</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Button>
            </div>
          )}

          {/* Service Launch Notification */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-100 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
            {isSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  출시 알림 신청 완료!
                </h3>
                <p className="text-neutral-600 mb-4">
                  상표 출원 서비스 출시 시 가장 먼저 연락드리겠습니다.
                </p>
                <Button 
                  onClick={closeSuccess}
                  variant="outline"
                  className="text-brand-600 border-brand-200 hover:bg-brand-50"
                >
                  확인
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-4">
                  <Badge className="px-4 py-2 bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 border-0 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 mr-2" />
                    2025년 10월 정식 출시 예정
                  </Badge>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  상표 출원 서비스 오픈 알림 받기
                </h3>
                
                <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
                  이메일만 입력하고 출시 소식 받아보세요!
                </p>

                <form onSubmit={handlePreBookingSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="flex-1"
                    placeholder="이메일 주소 입력"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    className="bg-brand-500 hover:bg-brand-600 text-white px-4 sm:px-6 w-full sm:w-auto text-sm sm:text-base"
                    disabled={isSubmitting || !formData.email.trim()}
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                        알림 신청
                      </>
                    )}
                  </Button>
                </form>

                {errors.email && (
                  <p className="text-sm text-red-500 mt-2">{errors.email}</p>
                )}
                {errors.submit && (
                  <p className="text-sm text-red-500 mt-2">{errors.submit}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}