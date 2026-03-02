"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { CheckCircle, Mail, AlertTriangle, Headphones, Search, MessageCircle, Share2, Home } from "lucide-react"

interface SuccessPageProps {
  email: string
  onNewAnalysis: () => void
  onConsultation: () => void
  onHome: () => void
}

export function SuccessPage({ email, onNewAnalysis, onConsultation, onHome }: SuccessPageProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const shareMessage = "IP Dr로 상표 분석 받아보세요! AI 기반 정확한 분석으로 상표 등록 성공률을 높여보세요."

  const handleShare = (platform: string) => {
    const url = window.location.origin
    const encodedMessage = encodeURIComponent(shareMessage)

    switch (platform) {
      case "kakao":
        // KakaoTalk sharing would require Kakao SDK
        alert("카카오톡 공유 기능은 준비 중입니다.")
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedMessage}`)
        break
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}&url=${url}`)
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="Mark25"
              width={48}
              height={48}
              className="w-12 h-12 aspect-square object-contain"
            />
          </div>
          <Button variant="ghost" onClick={onHome}>
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">보고서 요청이 완료되었습니다!</h1>
            <p className="text-xl text-neutral-600 mb-8">
              <strong>{email}</strong>로 상세 분석 보고서를 발송했습니다.
            </p>
          </div>

          {/* Next Steps */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-green-200 bg-success-50">
              <CardContent className="p-6 text-center">
                <Mail className="w-12 h-12 text-success-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">받은편지함 확인</h3>
                <p className="text-neutral-600 text-sm">5분 내로 이메일을 확인해 주세요</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">스팸함도 확인</h3>
                <p className="text-neutral-600 text-sm">간혹 스팸함으로 분류될 수 있습니다</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-info-50">
              <CardContent className="p-6 text-center">
                <Headphones className="w-12 h-12 text-info-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">문제 시 연락</h3>
                <p className="text-neutral-600 text-sm">고객센터로 언제든 연락주세요</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onConsultation}
                className="bg-brand-500 hover:bg-brand-600 h-14 px-8 text-lg font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                전문가 상담 신청하기
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onNewAnalysis}
                className="border-brand-500 text-brand-500 hover:bg-info-50 h-14 px-8 text-lg font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                다른 상표도 분석하기
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">친구에게 추천하기</h3>
              </div>
              <p className="text-neutral-600 mb-6">IP Dr의 정확한 상표 분석 서비스를 주변에 알려주세요!</p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleShare("kakao")}
                  className="bg-yellow-400 border-yellow-400 text-yellow-900 hover:bg-yellow-500"
                >
                  카카오톡
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare("facebook")}
                  className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                >
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare("twitter")}
                  className="bg-sky-500 border-sky-500 text-white hover:bg-sky-600"
                >
                  Twitter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
