"use client";

import { Check, FileText, Shield, Rocket, Star } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

interface PricingCardProps {
  title: string;
  icon: React.ReactNode;
  price: string;
  description: string;
  features: string[];
  isRecommended?: boolean;
  buttonText?: string;
  onSelect: () => void;
}

function PricingCard({ 
  title, 
  icon, 
  price, 
  description, 
  features, 
  isRecommended = false,
  buttonText = "시작하기",
  onSelect 
}: PricingCardProps) {
  return (
    <Card className={`relative h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      isRecommended ? 'border-2 border-brand-500 shadow-xl' : 'border border-neutral-200'
    }`}>
      {isRecommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-1.5 text-sm font-semibold">
            <Star className="w-3 h-3 mr-1" />
            추천
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 md:pb-8 pt-6 md:pt-8 px-4 md:px-6">
        <div className={`w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center ${
          isRecommended ? 'bg-gradient-to-br from-brand-100 to-blue-100' : 'bg-neutral-100'
        }`}>
          <div className="scale-90 md:scale-100">
            {icon}
          </div>
        </div>
        <h3 className={`text-lg md:text-xl font-bold mb-2 md:mb-2 leading-tight ${
          title === "안전 출원" ? "text-blue-600" : 
          "text-green-600"
        }`}>
          {title}
        </h3>
        <p className="text-sm md:text-sm text-neutral-600 leading-relaxed">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
        {/* Price */}
        <div className="text-center py-4 md:py-4 border-y border-neutral-100">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {price}
            <span className="text-base md:text-lg font-normal text-neutral-600">/건</span>
          </div>
          <p className="text-sm md:text-xs text-neutral-500 mt-1">(VAT 포함)</p>
        </div>

        {/* Features */}
        <div className="space-y-3 md:space-y-3">
          <p className="text-sm md:text-sm font-semibold text-gray-700 mb-3">이런 분들께 추천!</p>
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-brand-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm md:text-sm text-neutral-700 leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onSelect}
          className={`w-full text-base md:text-base py-3 md:py-3 px-6 md:px-6 h-auto ${
            isRecommended 
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg' 
              : 'bg-white text-brand-600 border-2 border-brand-200 hover:bg-brand-50'
          }`}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PricingSectionProps {
  onPlanSelect: (plan: string) => void;
}

export function PricingSection({ onPlanSelect }: PricingSectionProps) {
  const pricingPlans = [
    {
      title: "안전 출원",
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      price: "60,000원",
      description: "등록가능성 면밀 확인하고 상표등록 신청 여부 결정하는 서비스",
      features: [
        "AI 분석 출원의 모든 기능",
        "변리사가 직접 작성한 전문 조사 보고서 제공",
        "상표등록 가능성 확인 후 전략적 상표 출원",
        "프리미엄 네이밍 가이드북 제공",
        "전문조사 보고서 생활 보기"
      ],
      isRecommended: false,
    },
    {
      title: "신속 안전 출원",
      icon: <Rocket className="w-8 h-8 text-green-600" />,
      price: "200,000원",
      description: "조사출원 패키지에 우선심사 서비스까지 포함한 프리미엄 서비스",
      features: [
        "안전 출원의 모든 기능",
        "상표권 참에 경고장 샘플 양식 제공",
        "심사기간 15개월 이상 → 3개월로 단축",
        "조사부터 출원까지 원스톱 패키지 서비스",
        "이미 우선심사가 포함되어 있어요!"
      ],
      isRecommended: true,
    }
  ];

  return (
    <section id="pricing-section" className="py-20 px-4 bg-gradient-to-br from-neutral-50 to-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 border-0">
            서비스 가격
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            합리적인 가격으로 상표를 보호하세요
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            AI 분석부터 전문가 검토까지, 필요에 맞는 서비스를 선택하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-10 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              {...plan}
              onSelect={() => onPlanSelect(plan.title)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-600">
            모든 서비스는 특허청 관납료가 <span className="font-semibold">별도</span>입니다
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            특허청 관납료: 1개류 46,000원 (온라인 출원 기준)
          </p>
        </div>
      </div>
    </section>
  );
}