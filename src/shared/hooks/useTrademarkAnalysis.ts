"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { TrademarkAnalysisResult } from "@/features/trademark-analysis/_types"
// Legacy analysisManager 제거됨 - 로컬 상태로 대체

interface SearchResponse {
  success: boolean
  searchId?: string
  id?: string // for backward compatibility
  status: string
  error?: string
  details?: string
  message?: string
  estimatedTime?: string
  features?: string[]
}

interface SearchRecord {
  id: string
  trademark: string
  business_description: string
  status: "pending" | "processing" | "completed" | "failed" | "expert_processing" | "expert_analyzing" | "expert_finalizing" | "error"
  progress: number
  results?: TrademarkAnalysisResult
  expertResult?: any // Expert workflow result
  risk_score?: number
  risk_level?: string
  ai_analysis?: any
  created_at: string
  updated_at: string
  completed_at?: string
}

export const useTrademarkAnalysis = () => {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [completedResults, setCompletedResults] = useState<TrademarkAnalysisResult | null>(null)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const completionHandledRef = useRef(false)
  const pollingStartTimeRef = useRef<number>(0)

  // 컴포넌트 언마운트 감지
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
        pollingTimeoutRef.current = null
      }
      console.log("🔄 useTrademarkAnalysis unmounted")
    }
  }, [])

  // 폴링 함수 (개선된 완료 감지)
  const pollSearchStatus = useCallback(
    async (id: string) => {
      if (!mountedRef.current || completionHandledRef.current) return

      try {
        console.log(`📡 Polling search status for ID: ${id} (${Math.round((Date.now() - pollingStartTimeRef.current)/1000)}s elapsed)`)

        const response = await fetch(`/api/expert-search?searchId=${id}&t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Polling failed: ${response.status} - ${errorText}`)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data: SearchRecord = await response.json()
        console.log(`✅ Poll result - Status: ${data.status}, Progress: ${data.progress}%`)

        if (!mountedRef.current || completionHandledRef.current) return

        // 진행률 업데이트
        if (typeof data.progress === "number" && data.progress !== currentProgress) {
          setCurrentProgress(data.progress)
          console.log(`📊 Progress updated to ${data.progress}%`)
        }

        // 완료 상태 확인 (전문가 분석 결과도 포함)
        if (
          data.status === "completed" &&
          data.progress === 100 &&
          (data.results || data.expertResult) &&
          !completionHandledRef.current &&
          mountedRef.current
        ) {
          console.log("🎉 Analysis completed!")
          console.log("📋 Results:", data.results || data.expertResult)

          // 완료 처리 플래그 설정 (중복 방지)
          completionHandledRef.current = true

          setCompletedResults(data.results || data.expertResult)
          setIsAnalyzing(false)
          setHasCompleted(true)
          setCurrentProgress(100)

          // 폴링 즉시 중지
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
            console.log("🛑 Polling stopped - analysis completed")
          }
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current)
            pollingTimeoutRef.current = null
          }

          // 분석 매니저 정리
          // // analysisManager 제거됨 - 로컬 상태로 관리

          console.log("✅ Analysis completion handled successfully")

                                  // 결과 페이지로 이동 (약간의 지연 후)
          setTimeout(() => {
            if (mountedRef.current && (data.results || data.expertResult)) {
              console.log("🔄 Navigating to results page...")
              // 올바른 searchId 사용 (data.id 대신 현재 폴링 중인 id 사용)
              router.push(`/results?id=${id}&trademark=${encodeURIComponent(data.trademark || "")}&businessDescription=${encodeURIComponent(data.business_description || "")}`)
            }
          }, 1000)

          return
        }

        // 실패 상태 확인
        if (data.status === "failed" && !completionHandledRef.current) {
          const errorMessage = data?.ai_analysis?.error || "분석 중 오류가 발생했습니다."
          console.error("❌ Analysis failed:", errorMessage)

          completionHandledRef.current = true
          setError(errorMessage)
          setIsAnalyzing(false)
          setHasCompleted(true)

          // 폴링 중지
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current)
            pollingTimeoutRef.current = null
          }

          // // analysisManager 제거됨 - 로컬 상태로 관리
          return
        }
      } catch (error) {
        console.error("❌ Polling error:", error)
        if (mountedRef.current && !hasCompleted && !completionHandledRef.current) {
          // 404 에러인 경우 분석 페이지로 리다이렉션
          if (error instanceof Error && error.message.includes('404')) {
            console.log("⚠️ Analysis data not found, redirecting to restart analysis")
            completionHandledRef.current = true
            setError("분석 데이터를 찾을 수 없습니다. 분석을 다시 시작해주세요.")
            setIsAnalyzing(false)
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            if (pollingTimeoutRef.current) {
              clearTimeout(pollingTimeoutRef.current)
              pollingTimeoutRef.current = null
            }
            // // analysisManager 제거됨 - 로컬 상태로 관리
            return
          }
          
          setError("분석 상태 확인 중 오류가 발생했습니다.")
          setIsAnalyzing(false)
          completionHandledRef.current = true

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current)
            pollingTimeoutRef.current = null
          }
          // // analysisManager 제거됨 - 로컬 상태로 관리
        }
      }
    },
    [currentProgress, hasCompleted],
  )

  const startAnalysis = useCallback(
    async (
      trademarkName: string,
      businessDescription: string,
      productClassificationCodes: string[],
      similarGroupCodes: string[],
      designatedProducts: string[],
      hasImage: boolean,
    ) => {
      if (!mountedRef.current) return;

      // 로컬 상태로 중복 방지
      if (isAnalyzing || hasCompleted) {
        console.log("⚠️ Analysis already in progress or completed");
        return;
      }

      // 이미 분석 중인 경우 추가 방지
      if (isAnalyzing || hasCompleted) {
        console.log("⚠️ Analysis already in progress or completed");
        // // analysisManager 제거됨 - 로컬 상태로 관리;
        return;
      }

      try {
        console.log("🔄 Initializing analysis states...");

        // 모든 상태 초기화
        setIsAnalyzing(true);
        setError("");
        setSearchId(null);
        setCompletedResults(null);
        setHasCompleted(false);
        setCurrentProgress(0);
        completionHandledRef.current = false;

        // 기존 폴링 정리
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        console.log("🚀 Starting analysis:", { trademarkName, businessDescription, productClassificationCodes, similarGroupCodes, designatedProducts, hasImage });

        // 요청 전 잠시 대기 (중복 요청 방지)
        await new Promise(resolve => setTimeout(resolve, 100));

        const response = await fetch("/api/expert-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            trademark: trademarkName,
            businessDescription: businessDescription,
            userIntent: "registration",
            urgencyLevel: "medium",
            budgetRange: "standard",
            trademarkImage: hasImage ? "placeholder-image-data" : undefined
          }),
        });

        // 더 자세한 에러 처리
        if (!response.ok) {
          let errorMessage = `서버 오류: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              console.error("❌ API Error details:", errorData.details);
            }
          } catch (parseError) {
            const errorText = await response.text();
            console.error("❌ API Error (raw):", errorText);
          }
          throw new Error(errorMessage);
        }

        const result: SearchResponse = await response.json();
        console.log("📋 API Response:", result);

        if (!result.success || (!result.searchId && !result.id)) {
          throw new Error(result.error || "분석 시작에 실패했습니다.");
        }

        // Expert search uses searchId, fallback to id for compatibility
        const searchId = result.searchId || result.id!;

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted during API call, aborting");
          // analysisManager 제거됨 - 로컬 상태로 관리;
          return;
        }

        console.log("✅ Analysis started with ID:", searchId);

        // 기존 분석 결과를 사용하는 경우 처리
        if (result.message && result.status === "completed") {
          console.log("📋 Using existing analysis result");
          setCurrentProgress(100);
          // 즉시 폴링하여 결과 가져오기
          setTimeout(() => pollSearchStatus(searchId), 100);
        } else {
          // 검색 ID 설정 (올바른 ID 저장)
          setSearchId(searchId);
          setCurrentProgress(10);

          // 폴링 시작 시간 기록
          pollingStartTimeRef.current = Date.now();

          // 3분 후 타임아웃 설정 (실제 3분 후에만 실행)
          pollingTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && !completionHandledRef.current) {
              console.error("⏰ Analysis timeout after 3 minutes");
              completionHandledRef.current = true;
              setError("분석 시간이 초과되었습니다. 서버에 문제가 있을 수 있습니다.");
              setIsAnalyzing(false);
              setHasCompleted(true);

              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              // analysisManager 제거됨 - 로컬 상태로 관리;
            }
          }, 180000); // 정확히 3분 = 180,000ms

          // 폴링 시작 시 올바른 ID 사용
          pollingIntervalRef.current = setInterval(() => {
            pollSearchStatus(searchId);
          }, 1000);

          // 즉시 한 번 폴링
          setTimeout(() => pollSearchStatus(searchId), 500);
        }

        console.log(`🔄 Polling started for ID: ${searchId}`);
      } catch (err) {
        console.error("❌ Analysis start failed:", err);
        // analysisManager 제거됨 - 로컬 상태로 관리;
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : "분석 시작에 실패했습니다.";
          setError(errorMessage);
          setIsAnalyzing(false);
        }
        throw err; // 에러를 다시 throw하여 호출자가 처리할 수 있도록
      }
    },
    [pollSearchStatus, isAnalyzing, hasCompleted, router], // dependency에 router 추가
  );

  const reset = useCallback(() => {
    console.log("🔄 Resetting trademark analysis hook...");

    // 폴링 중지
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // 폴링 타임아웃 정리
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // 상태 초기화
    setIsAnalyzing(false);
    setSearchId(null);
    setError("");
    setCompletedResults(null);
    setHasCompleted(false);
    setCurrentProgress(0);
    completionHandledRef.current = false;
    pollingStartTimeRef.current = 0;

    // 분석 매니저 정리
    // analysisManager 제거됨 - 로컬 상태로 관리
  }, []);

  return {
    isAnalyzing: isAnalyzing && !hasCompleted,
    progress: currentProgress,
    currentStep: getProgressMessage(currentProgress),
    results: completedResults,
    error: error,
    searchId: searchId,
    startAnalysis,
    reset,
    hasCompleted,
  };
}

function getProgressMessage(progress: number): string {
  if (progress <= 10) return "분석을 시작합니다...";
  if (progress <= 20) return "비즈니스 컨텍스트를 분석하고 있습니다...";
  if (progress <= 35) return "상품분류 코드를 생성하고 있습니다...";
  if (progress <= 50) return "키프리스 데이터베이스에서 유사 상표를 검색하고 있습니다...";
  if (progress <= 65) return "전문가 워크플로우를 실행하고 있습니다...";
  if (progress <= 80) return "법률 문서를 검색하고 분석하고 있습니다...";
  if (progress <= 95) return "최종 분석 결과를 정리하고 있습니다...";
  if (progress < 100) return "분석을 완료하고 있습니다...";
  return "분석 완료!";
}