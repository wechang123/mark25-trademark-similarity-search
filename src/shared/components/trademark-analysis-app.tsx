"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Instagram,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AuthButton } from "@/features/authentication";
import { AuthRequiredModal } from "@/shared/components/ui/auth-required-modal";
import { useAuth } from "@/features/authentication/_hooks";

import { TrademarkType } from "@/features/trademark-analysis/_types/trademark.types";
import { HeroSection } from "@/shared/components/hero-section";
import { RegistrationAnalysisSection } from "@/shared/components/registration-analysis-section";
import { PricingSection } from "@/shared/components/pricing-section";


import {
  trackAnalysisStart,
  trackButtonClick,
  trackFormSubmit,
} from "@/shared/utils/analytics";

export function TrademarkAnalysisApp() {
  const router = useRouter();
  const { state: authState } = useAuth();

  // Check admin/manager role directly from authState to avoid dual auth hooks
  const isAdminOrManager = authState.user?.role === 'admin' || authState.user?.role === 'manager';

  // Debug logging
  useEffect(() => {
    console.log('[Admin Check] User:', authState.user);
    console.log('[Admin Check] User role:', authState.user?.role);
    console.log('[Admin Check] isAdminOrManager:', isAdminOrManager);
  }, [authState.user, isAdminOrManager]);

  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showTrademarkPopup, setShowTrademarkPopup] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setShowMobileMenu(false);
  };

  const handleTrademarkApplicationClick = () => {
    setShowTrademarkPopup(true);
    setShowMobileMenu(false);
  };

  const handleContactClick = () => {
    setShowContactPopup(true);
    setShowMobileMenu(false);
  };

  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('tmdals128551@gmail.com');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
      const textArea = document.createElement('textarea');
      textArea.value = 'tmdals128551@gmail.com';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };



  const handleHeroSearch = (query: string) => {
    if (!authState.user) {
      setShowAuthRequiredModal(true);
      return;
    }
    router.push('/trademark-selection');
  };

  const handleQuickSearch = (data: { type: TrademarkType; name: string }) => {
    if (!authState.user) {
      setShowAuthRequiredModal(true);
      return;
    }

    trackAnalysisStart(data.name);
    trackFormSubmit("quick_search_form");

    const params = new URLSearchParams({
      trademark: data.name,
      businessDescription: "",
      productClassificationCodes: JSON.stringify([]),
      designatedProducts: JSON.stringify([]),
      hasImage: "false",
      trademarkType: data.type
    });

    router.push(`/analysis?${params.toString()}`);
  };




  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Header */}
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Mark25"
                width={48}
                height={48}
                className="w-12 h-12 object-contain cursor-pointer"
                onClick={() => router.push('/')}
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900">Mark25</div>
                <div className="text-xs text-neutral-500">AI 상표 분석</div>
              </div>
              <Badge className="hidden md:inline-flex ml-2 bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 border-0">
                Beta
              </Badge>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('registration-analysis-section')}
                className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
              >
                등록 가능성 분석
              </button>
              <button
                onClick={() => scrollToSection('pricing-section')}
                className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
              >
                서비스 가격
              </button>
              <button
                onClick={handleTrademarkApplicationClick}
                className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
              >
                상표 출원하기
              </button>
              <button
                onClick={handleContactClick}
                className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
              >
                문의하기
              </button>
              {authState.user && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                >
                  내 대시보드
                </button>
              )}
              {isAdminOrManager && (
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                >
                  관리자 대시보드
                </button>
              )}
              <AuthButton />
            </nav>
            
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              <AuthButton />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="메뉴 열기/닫기"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t border-neutral-100 pt-4">
              <nav className="space-y-3">
                <button
                  onClick={() => scrollToSection('registration-analysis-section')}
                  className="block text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2 text-left w-full"
                >
                  등록 가능성 분석
                </button>
                <button
                  onClick={() => scrollToSection('pricing-section')}
                  className="block text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2 text-left w-full"
                >
                  서비스 가격
                </button>
                <button
                  onClick={handleTrademarkApplicationClick}
                  className="block text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2 text-left w-full"
                >
                  상표 출원하기
                </button>
                <button
                  onClick={handleContactClick}
                  className="block text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2 text-left w-full"
                >
                  문의하기
                </button>
                {authState.user && (
                  <button
                    onClick={() => {
                      router.push('/dashboard')
                      setShowMobileMenu(false)
                    }}
                    className="block text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2 text-left w-full"
                  >
                    내 대시보드
                  </button>
                )}
                {isAdminOrManager && (
                  <button
                    onClick={() => {
                      router.push('/admin/dashboard')
                      setShowMobileMenu(false)
                    }}
                    className="block text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2 text-left w-full"
                  >
                    관리자 대시보드
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection 
        onSearch={handleHeroSearch} 
        onAnalysisClick={() => {
          if (!authState.user) {
            setShowAuthRequiredModal(true);
            return;
          }
          router.push('/trademark-selection');
        }} 
      />

      {/* Registration Analysis Section */}
      <RegistrationAnalysisSection onAnalysisClick={() => {
        if (!authState.user) {
          setShowAuthRequiredModal(true);
          return;
        }
        router.push('/trademark-selection');
      }} />

      {/* Pricing Section */}
      <PricingSection onPlanSelect={(plan) => {
        console.log(`Selected plan: ${plan}`);
        // TODO: Handle plan selection
        alert(`${plan} 플랜이 선택되었습니다. 서비스는 곧 출시 예정입니다!`);
      }} />

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/favicon/favicon.ico"
                  alt="Mark25"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain brightness-0 invert"
                />
                <span className="text-xl font-bold">Mark25</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                누구나 쉽게 자신의 브랜드를
                <br />보호받을 수 있는 세상을 지향합니다.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="https://www.instagram.com/ipdr_official/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <button onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (!authState.user) {
                      setShowAuthRequiredModal(true);
                      return;
                    }
                    router.push('/trademark-selection');
                  }} className="hover:text-white transition-colors">
                    상표 분석
                  </button>
                </li>
                <li>
                  <button onClick={handleTrademarkApplicationClick} className="hover:text-white transition-colors">
                    상표 출원 (준비중)
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">고객 지원</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <button onClick={handleContactClick} className="hover:text-white transition-colors">
                    문의하기
                  </button>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    자주 묻는 질문
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">연락처</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  tmdals128551@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  010-2406-2537
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  경기도 용인시 수지구 152
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-white/70 mb-4 md:mb-0">
              © 2025 Mark25. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-white/70">
              <a href="#" className="hover:text-white transition-colors">
                개인정보처리방침
              </a>
              <a href="#" className="hover:text-white transition-colors">
                이용약관
              </a>
              <a href="#" className="hover:text-white transition-colors">
                쿠키 정책
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}

      {/* Trademark Application Development Popup */}
      {showTrademarkPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🚧</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                상표 출원 서비스 개발 중
              </h3>
              
              <p className="text-neutral-600 mb-6 leading-relaxed">
                현재 상표 출원 서비스를 개발 중입니다.
                <br />
                2025년 10월 정식 출시 예정이니
                <br />
                출시 알림을 신청해 주세요!
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowTrademarkPopup(false);
                    scrollToSection('notification-section');
                  }}
                  className="w-full bg-brand-500 hover:bg-brand-600"
                >
                  출시 알림 신청하기
                </Button>
                
                <Button
                  onClick={() => setShowTrademarkPopup(false)}
                  variant="outline"
                  className="w-full"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Popup */}
      {showContactPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-info-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                문의하기
              </h3>
              
              <p className="text-neutral-600 mb-6 leading-relaxed">
                궁금한 점이 있으시면 언제든지 연락주세요!
              </p>
              
              <div className="space-y-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm text-neutral-600">이메일</p>
                        <p className="font-medium text-gray-900">tmdals128551@gmail.com</p>
                      </div>
                      <Button
                        onClick={copyEmailToClipboard}
                        variant="outline"
                        size="sm"
                      >
                        {copySuccess ? '복사됨!' : '복사'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-left">
                      <p className="text-sm text-neutral-600">전화번호</p>
                      <p className="font-medium text-gray-900">010-2406-2537</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=tmdals128551@gmail.com&su=상표 분석 서비스 문의&body=안녕하세요! 상표 분석 서비스에 대해 문의드립니다.', '_blank')}
                  className="w-full bg-brand-500 hover:bg-brand-600"
                >
                  Gmail로 메일 보내기
                </Button>
                
                <Button
                  onClick={() => setShowContactPopup(false)}
                  variant="outline"
                  className="w-full"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthRequiredModal}
        onClose={() => setShowAuthRequiredModal(false)}
        title="상표 분석을 시작하려면 로그인이 필요해요!"
        description="카카오 계정으로 30초 만에 간편하게 회원가입/로그인하고 AI 상표 분석을 시작해보세요."
      />
    </div>
  );
}