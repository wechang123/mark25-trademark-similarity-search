"use client";

import { useState } from "react";
import { Play, ArrowRight, CheckCircle, Shield, Zap } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

interface RegistrationAnalysisSectionProps {
  onAnalysisClick: () => void;
}

export function RegistrationAnalysisSection({ onAnalysisClick }: RegistrationAnalysisSectionProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section id="registration-analysis-section" className="py-12 md:py-20 px-4 bg-white overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 border-0">
            등록 가능성 분석
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            AI가 분석하는 상표 등록 가능성
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            특허청 데이터베이스 기반 AI 분석으로<br />
            거절 위험을 사전에 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Video Section */}
          <div className="relative">
            <div className="relative aspect-video bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl overflow-hidden shadow-2xl">
              {!isVideoPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                         onClick={() => setIsVideoPlaying(true)}>
                      <Play className="w-10 h-10 text-brand-600 ml-1" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900">서비스 소개 영상</p>
                    <p className="text-sm text-neutral-600 mt-1">1분 30초</p>
                  </div>
                </div>
              ) : (
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="상표 등록 가능성 분석 서비스 소개"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                />
              )}
            </div>

            {/* Video Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 px-2">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-brand-600" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">30초 분석</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-brand-600" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">99.9% 정확도</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-brand-600" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">무료 분석</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-2 lg:px-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              이런 분들께 필요해요
            </h3>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">브랜드를 새로 만드시는 분</p>
                  <p className="text-sm text-neutral-600 mt-1">상표 등록 전 유사 상표 존재 여부를 확인하세요</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">상표 출원을 준비하시는 분</p>
                  <p className="text-sm text-neutral-600 mt-1">거절 위험을 사전에 파악하고 대응 전략을 수립하세요</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">빠른 분석이 필요하신 분</p>
                  <p className="text-sm text-neutral-600 mt-1">60초 만에 AI가 전문가 수준의 분석을 제공합니다</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">분석 프로세스</h4>
                <Badge className="bg-brand-500 text-white">AI 자동화</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-sm text-gray-700">상표명 입력 및 설명 입력</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-sm text-gray-700">AI가 유사 상표 검색 및 분석</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-sm text-gray-700">등록 가능성 리포트 제공</p>
                </div>
              </div>
            </div>

            <Button
              onClick={onAnalysisClick}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <span className="hidden sm:inline">내 상표 등록 가능성 분석하러 가기</span>
              <span className="sm:hidden">상표 분석하기</span>
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}