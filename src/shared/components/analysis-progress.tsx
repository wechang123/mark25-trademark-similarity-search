"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/shared/components/ui/button"
import { X, ArrowLeft } from "lucide-react"
import { funFacts } from "@/shared/utils/mock-data"

interface AnalysisProgressProps {
  progress: number
  currentStep: string
  onCancel: () => void
  trademarkName: string
}

export function AnalysisProgress({ progress, currentStep, onCancel, trademarkName }: AnalysisProgressProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(180) // 3분

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % funFacts.length)
    }, 4000)

    return () => clearInterval(factInterval)
  }, [])

  useEffect(() => {
    if (progress < 100 && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [progress, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getPhase = () => {
    if (progress <= 30) return { phase: 1, title: "상표 데이터 수집" }
    if (progress <= 80) return { phase: 2, title: "AI 유사도 분석" }
    return { phase: 3, title: "보고서 생성" }
  }

  const currentPhase = getPhase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
          <div className="text-center">
            <div className="text-lg font-semibold text-neutral-700">분석 진행 중</div>
            <div className="text-sm text-neutral-500">&quot;{trademarkName}&quot; 분석</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center">
          {/* Phase Indicator */}
          <div className="flex justify-center items-center mb-8 sm:mb-12 px-4 sm:px-0">
            {[1, 2, 3].map((phase) => (
              <div key={phase} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold ${
                    phase <= currentPhase.phase ? "bg-brand-500 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {phase}
                </div>
                {phase < 3 && (
                  <div className={`w-8 sm:w-12 md:w-16 h-1 mx-2 sm:mx-3 md:mx-4 ${phase < currentPhase.phase ? "bg-brand-500" : "bg-neutral-200"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-base sm:text-lg text-neutral-600 mb-6 sm:mb-8 px-4">
            {currentPhase.title} ({currentPhase.phase}/3)
          </div>

          {/* Progress Circle */}
          <div className="relative mb-8 sm:mb-12">
            <svg className="w-36 h-36 sm:w-48 sm:h-48 mx-auto transform -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" stroke="#E5E7EB" strokeWidth="8" fill="none" />
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#007AFF"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-brand-500 mb-1">{progress}%</div>
                <div className="text-xs sm:text-sm text-neutral-500">완료</div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="mb-6 sm:mb-8 px-4">
            <p className="text-lg sm:text-xl text-neutral-700 mb-3 sm:mb-4">{currentStep}</p>
            {timeRemaining > 0 && progress < 100 && (
              <p className="text-xs sm:text-sm text-neutral-500">예상 남은 시간: {formatTime(timeRemaining)}</p>
            )}
          </div>

          {/* Fun Facts */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto mb-8 sm:mb-12 mx-4 sm:mx-auto">
            <div className="text-sm sm:text-base text-neutral-600 leading-relaxed transition-all duration-500">
              {funFacts[currentFactIndex]}
            </div>
          </div>

          {/* Cancel Button */}
          <Button variant="outline" onClick={onCancel} className="border-neutral-300 text-neutral-600 hover:bg-neutral-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            분석 취소
          </Button>
        </div>
      </div>
    </div>
  )
}
