"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SimplifiedResultsView } from "@/features/trademark-analysis"
import type { TrademarkAnalysisResult } from "@/features/trademark-analysis"

export function ResultsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [results, setResults] = useState<TrademarkAnalysisResult | null>(null)
  const [sessionData, setSessionData] = useState<any>(null) // 🆕 세션 데이터 별도 관리
  const [isLoading, setIsLoading] = useState(true)
  const [redirectAttempts, setRedirectAttempts] = useState(0)

  const trademarkName = searchParams.get("trademark") || ""
  const businessDescription = searchParams.get("businessDescription") || ""
  const searchId = searchParams.get("id") || ""
  const sessionId = searchParams.get("sessionId") || searchParams.get("id") || "" // id를 sessionId로도 사용

  // const { results: hookResults } = useTrademarkAnalysis()

  useEffect(() => {
    console.log("📊 [Results] Page parameters:", {
      trademarkName,
      businessDescription,
      searchId,
      sessionId,
      hasTrademarkName: !!trademarkName,
      hasSearchId: !!searchId,
      hasSessionId: !!sessionId
    })
    
    // 상표명이 없고 searchId와 sessionId도 모두 없으면 홈으로 리다이렉트
    if (!trademarkName && !searchId && !sessionId) {
      console.log("❌ Missing trademark name, search ID, and session ID, redirecting to home")
      router.push("/")
      return
    }
    
    // 상표명만 없지만 searchId나 sessionId가 있으면 API에서 상표명을 가져올 수 있으므로 진행
    if (!trademarkName && (searchId || sessionId)) {
      console.log("⚠️ No trademark name but ID available, attempting to load from API")
    }

    // Hook에서 결과가 있으면 사용
    // if (hookResults) {
    //   console.log("📊 Using results from hook:", hookResults)
    //   setResults(hookResults)
    //   setIsLoading(false)
    // } else 
    if (sessionId) {
      // sessionId가 있으면 분석 세션 결과를 조회
      console.log("🔍 Attempting to load analysis session:", sessionId)
      
      fetch(`/api/dashboard/analysis/${sessionId}`)
        .then(res => res.json())
        .then((sessionData) => {
          console.log("📊 Session API response:", { sessionData })
          
          if (sessionData && sessionData.success && sessionData.data) {
            console.log("✅ Found analysis session results:", sessionData.data)
            
            // 🆕 평가 기반 결과가 있는지 확인
            const hasDetailedScores = sessionData.data.analysis?.hasDetailedScores
            console.log("🔍 Has detailed evaluation scores:", hasDetailedScores)
            
            if (hasDetailedScores) {
              // 새로운 평가 기반 결과 사용
              setSessionData(sessionData.data)
              setIsLoading(false)
              return
            }
            
            // 기존 형식으로 변환 (fallback)
            const formattedResults: TrademarkAnalysisResult = {
              searchId: sessionId,
              trademarkName: sessionData.data.trademark.name,
              industry: sessionData.data.business.description || '',
              overallRisk: sessionData.data.analysis.riskLevel === 'high' ? '위험' : 
                         sessionData.data.analysis.riskLevel === 'medium' ? '주의' : '안전',
              registrationPossibility: sessionData.data.analysis.registrationProbability,
              similarCount: 0,
              industryCollision: '',
              aiConfidence: sessionData.data.analysis.aiConfidence || 85,
              similarTrademarks: [],
              hasImageAnalysis: false,
              aiAnalysis: {
                summary: `'${sessionData.data.trademark.name}' 상표의 분석이 완료되었습니다.`,
                probability: sessionData.data.analysis.registrationProbability,
                confidence: sessionData.data.analysis.aiConfidence || 85,
                risks: sessionData.data.analysis.keyFindings || [],
                recommendations: ['전문가 상담을 통한 정확한 검토 권장']
              }
            }
            
            setResults(formattedResults)
            setIsLoading(false)
            return
          }
          
          console.log("⚠️ Session not found or incomplete, checking search results...")
          setIsLoading(false)
        })
        .catch(error => {
          console.error("❌ Error fetching session results:", error)
          setIsLoading(false)
        })
    } else if (searchId) {
      // searchId가 있으면 해당 결과를 조회 시도
      console.log("🔍 Attempting to load results for searchId:", searchId)
      
      // LangGraph 분석 결과 조회를 위한 API 호출
      fetch(`/api/search/${searchId}`)
        .then(res => res.json())
        .then((searchData) => {
          console.log("📊 API response:", { searchData })
          
          // search API에서 결과가 있는 경우
          if (searchData && searchData.success && searchData.data) {
            console.log("✅ Found completed results from search API:", searchData)
            // 전체 응답 객체를 전달하여 success 속성을 유지
            setResults(searchData)
            setIsLoading(false)
            return
          }
          
          // 기존 형식도 지원
          if (searchData && searchData.status === 'completed' && searchData.results) {
            console.log("✅ Found completed results from search API (legacy format):", searchData.results)
            setResults(searchData.results)
            setIsLoading(false)
            return
          }
          
          setIsLoading(false)
        })
        .catch(error => {
          console.error("❌ Error fetching results:", error)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [trademarkName, businessDescription, searchId, sessionId, router, redirectAttempts])

  const handleConsultation = () => {
    alert("전문가 상담 서비스는 준비 중입니다. 곧 만나보실 수 있습니다!")
  }

  const handleBack = () => {
    // localStorage에서 referrer 확인
    const referrer = localStorage.getItem('referrer')
    
    if (referrer === 'dashboard') {
      // localStorage 정리
      localStorage.removeItem('referrer')
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Use SimplifiedResultsView for all results
  if (sessionData || results) {
    return (
      <SimplifiedResultsView
        stage2Id={sessionId || searchId || ""}
        trademarkName={trademarkName}
        businessDescription={businessDescription}
        onBack={handleBack}
        onConsult={handleConsultation}
        onPDFDownload={() => {
          alert("PDF 다운로드 기능은 곧 추가될 예정입니다.")
        }}
      />
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">결과 준비 중 또는 데이터 없음</h1>
          <p className="text-neutral-600 mb-6">KIPRIS 데이터만 사용 중입니다. 분석이 완료되면 자동으로 표시됩니다.</p>
          <button
            onClick={handleBack}
            className="bg-brand-500 text-white px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">분석 결과 준비 중</h1>
        <p className="text-neutral-600 mb-6">결과를 불러오는 중입니다.</p>
        <button
          onClick={handleBack}
          className="bg-brand-500 text-white px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
