/**
 * 간소화된 상표 분석 결과 화면
 * 핵심 정보만 표시: 등록 가능성 % + 3가지 평가 기준
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Download,
  Clock,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  Rocket,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils";

import { AnalysisCriterion } from "./AnalysisCriterion";
import { SimplifiedActionButtons } from "./SimplifiedActionButtons";
import { ApplicationModal } from "../actions/ApplicationModal";
import { ConsultationModal } from "../actions/ConsultationModal";
import { SimilarTrademarkCard } from "./SimilarTrademarkCard";
// PDF report service removed - simplified flow
import {
  SimplifiedResultData,
  ApplicantInfo,
  ConsultationPreferences,
  Stage3ActionResult,
} from "../../_types/simplified-types";

interface SimplifiedResultsViewProps {
  stage2Id: string;
  trademarkName?: string;
  businessDescription?: string;
  onApply?: (result: Stage3ActionResult) => void;
  onConsult?: (result: Stage3ActionResult) => void;
  onBack?: () => void;
  onPDFDownload?: () => void;
}

export function SimplifiedResultsView({
  stage2Id,
  trademarkName: propTrademarkName,
  businessDescription: propBusinessDescription,
  onApply,
  onConsult,
  onBack,
  onPDFDownload,
}: SimplifiedResultsViewProps) {
  // 데이터 상태 관리
  const [data, setData] = useState<SimplifiedResultData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태 관리
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);

  // 스크롤 기반 네비게이션 상태
  const [activeSection, setActiveSection] = useState("overall-result");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // 토글 상태 관리 (각 평가 기준별)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 추천 액션, 위험 요인 토글 상태
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["action", "risks"])
  );

  // Intersection Observer로 현재 보이는 섹션 감지
  useEffect(() => {
    if (!data) return; // 데이터가 로드되지 않았으면 실행하지 않음

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id) {
              setActiveSection(id);
            }
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      }
    );

    // 모든 섹션 관찰
    const sections = ["overall-result", "next-actions", "similar-trademarks"];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
        sectionRefs.current[id] = element;
      }
    });

    return () => {
      sections.forEach((id) => {
        const element = sectionRefs.current[id];
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [data]); // data가 로드된 후에 실행

  // Stage 2 데이터 조회
  useEffect(() => {
    const fetchStage2Data = async () => {
      try {
        setIsLoadingData(true);
        setError(null);

        const response = await fetch(
          `/api/analysis/trademark-analysis/${stage2Id}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "분석 결과를 불러올 수 없습니다");
        }

        if (result.success && result.analysisResult) {
          setData(result.analysisResult);
        } else {
          throw new Error("분석 결과 데이터가 올바르지 않습니다");
        }
      } catch (error) {
        console.error("Stage 2 데이터 조회 오류:", error);
        setError(
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다"
        );
      } finally {
        setIsLoadingData(false);
      }
    };

    if (stage2Id) {
      fetchStage2Data();
    }
  }, [stage2Id]);

  // 데이터 로딩 중
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            분석 결과 로딩 중
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            분석 결과를 불러올 수 없습니다
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/trademark-selection")}
            >
              새로운 분석 시작
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    trademarkName,
    trademarkType,
    trademarkImageUrl,
    registrationProbability,
    aiConfidence,
    analysis,
    analysisDate,
    processingTime,
  } = data;

  // Stage 3 API 호출 함수
  const callStage3Api = async (
    action: "apply" | "consult",
    actionData?: any
  ): Promise<Stage3ActionResult | null> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/analysis/trademark-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage2Id,
          action,
          actionData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "API 호출 실패");
      }

      if (result.success && result.actionResult) {
        return result.actionResult;
      }

      throw new Error("서버 응답이 올바르지 않습니다");
    } catch (error) {
      console.error(`Stage 3 ${action} API 오류:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 출원 신청 처리
  const handleApplicationSubmit = async (applicantInfo: ApplicantInfo) => {
    try {
      const result = await callStage3Api("apply", { applicantInfo });
      if (result) {
        setIsApplicationModalOpen(false);
        onApply?.(result);
      }
    } catch (error) {
      alert("출원 신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 상담 예약 처리
  const handleConsultationSubmit = async (
    preferences: ConsultationPreferences
  ) => {
    try {
      const result = await callStage3Api("consult", {
        consultationPreferences: preferences,
      });
      if (result) {
        setIsConsultationModalOpen(false);
        onConsult?.(result);
      }
    } catch (error) {
      alert("상담 예약 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // PDF 다운로드 처리
  const handlePDFDownload = async () => {
    try {
      setIsPDFGenerating(true);

      // Call parent PDF download handler if provided
      if (onPDFDownload) {
        onPDFDownload();
      } else {
        alert("PDF 다운로드 기능은 곧 추가될 예정입니다.");
      }
    } catch (error) {
      console.error("PDF 다운로드 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsPDFGenerating(false);
    }
  };

  // 액션 버튼 핸들러
  const handleApplyClick = () => {
    setIsApplicationModalOpen(true);
  };

  const handleConsultClick = () => {
    setIsConsultationModalOpen(true);
  };

  // 토글 함수
  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // 섹션 토글 함수 (추천 액션, 위험 요인, 권장 사항)
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  홈으로
                </Button>
              )}
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  상표 분석 신청
                </h1>
                <p className="text-sm text-gray-600">
                  AI 기반 상표 등록 가능성 분석
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onPDFDownload || handlePDFDownload}
              disabled={isPDFGenerating}
            >
              {isPDFGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                  생성 중...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  PDF 다운로드
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps - TrademarkSelectionFlow와 동일한 UI */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center max-w-lg mx-auto">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold bg-green-600 border-green-600 text-white">
                ✓
              </div>
              <span className="text-xs mt-2 text-gray-600 font-medium">
                상표 입력
              </span>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-1 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-200" />
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-green-600 to-gray-200" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold bg-blue-600 border-blue-600 text-white">
                2
              </div>
              <span className="text-xs mt-2 text-gray-600 font-medium">
                결과 확인
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠와 사이드바 */}
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        <div className="flex gap-6">
          {/* 메인 콘텐츠 영역 */}
          <main className="flex-1 space-y-8">
            {/* 종합 결과 섹션 */}
            <section id="overall-result" className="scroll-mt-24">
              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex gap-8">
                    {/* 왼쪽: 상표 이미지와 이름 */}
                    <div className="flex flex-col items-center space-y-3">
                      {trademarkImageUrl ? (
                        <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                          <img
                            src={trademarkImageUrl}
                            alt={trademarkName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-900">
                          {trademarkName}
                        </h2>
                        <Badge variant="outline" className="mt-1">
                          {trademarkType === "text"
                            ? "문자상표"
                            : trademarkType === "image"
                            ? "도형상표"
                            : "복합상표"}
                        </Badge>
                      </div>
                    </div>

                    {/* 오른쪽: 등록 가능성 및 추천 액션 */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900">
                          등록 가능성: {registrationProbability}%
                        </h3>
                        <Progress
                          value={registrationProbability}
                          className="h-4 mt-3"
                        />
                      </div>

                      {/* 최종 권고사항 */}
                      {(data as any).finalRecommendation && (
                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {(data as any).finalRecommendation}
                          </h4>
                          {(data as any).detailedAdvice && (
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {(data as any).detailedAdvice}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 권장 조치사항 */}
                      {((data as any).actionItems || data.recommendations) &&
                        ((data as any).actionItems?.length > 0 ||
                          (data.recommendations &&
                            data.recommendations.length > 0)) && (
                          <div className="border border-gray-400 rounded-lg overflow-hidden shadow-sm">
                            <button
                              onClick={() => toggleSection("action")}
                              className="w-full p-4 flex items-start space-x-2 hover:bg-gray-50 transition-colors bg-white"
                            >
                              {expandedSections.has("action") ? (
                                <ChevronDown className="w-5 h-5 text-gray-600 mt-0.5" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600 mt-0.5" />
                              )}
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-lg text-gray-900">
                                  권장 조치사항
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-white">
                                {
                                  (
                                    (data as any).actionItems ||
                                    data.recommendations
                                  ).length
                                }
                                개
                              </Badge>
                            </button>
                            {expandedSections.has("action") && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <ul className="space-y-3 mt-2">
                                  {(
                                    (data as any).actionItems ||
                                    data.recommendations
                                  ).map((item: string, index: number) => (
                                    <li
                                      key={index}
                                      className="text-sm text-gray-700 flex items-start"
                                    >
                                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3 mt-0.5">
                                        <span className="text-xs font-bold text-gray-700">
                                          {index + 1}
                                        </span>
                                      </span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                      {/* 법적 리스크 및 주의사항 */}
                      {((data as any).legalRisks || data.risks) &&
                        ((data as any).legalRisks?.length > 0 ||
                          (data.risks && data.risks.length > 0)) && (
                          <div className="border border-gray-400 rounded-lg overflow-hidden shadow-sm">
                            <button
                              onClick={() => toggleSection("risks")}
                              className="w-full p-4 flex items-start space-x-2 hover:bg-gray-50 transition-colors bg-white"
                            >
                              {expandedSections.has("risks") ? (
                                <ChevronDown className="w-5 h-5 text-gray-600 mt-0.5" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600 mt-0.5" />
                              )}
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-lg text-gray-900">
                                  법적 리스크 및 주의사항
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-white">
                                {
                                  ((data as any).legalRisks || data.risks)
                                    .length
                                }
                                개
                              </Badge>
                            </button>
                            {expandedSections.has("risks") && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <ul className="space-y-3 mt-2">
                                  {((data as any).legalRisks || data.risks).map(
                                    (risk: string, index: number) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-700 flex items-start"
                                      >
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3 mt-0.5">
                                          <span className="text-xs font-bold text-gray-700">
                                            {index + 1}
                                          </span>
                                        </span>
                                        <span>{risk}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 다음 액션 */}
            <section id="next-actions" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>다음 액션</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimplifiedActionButtons
                    probability={registrationProbability}
                    onApply={handleApplyClick}
                    onConsult={handleConsultClick}
                    disabled={isLoading}
                  />
                </CardContent>
              </Card>
            </section>

            {/* 유사 상표 목록 */}
            {data.similarTrademarks && data.similarTrademarks.length > 0 && (
              <section id="similar-trademarks" className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>유사 상표 목록</CardTitle>
                      <Badge variant="outline">
                        총 {data.similarTrademarks.length}개
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {data.similarTrademarks.map((trademark) => (
                        <SimilarTrademarkCard
                          key={trademark.id}
                          trademark={trademark}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </main>

          {/* 사이드바 네비게이션 - 오른쪽 */}
          <aside className="w-64 hidden lg:block">
            <div className="sticky top-24">
              <Card className="border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">목차</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    <a
                      href="#overall-result"
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                        activeSection === "overall-result"
                          ? "border-blue-600 bg-blue-50 text-blue-600 font-medium"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      종합 결과
                    </a>
                    <a
                      href="#next-actions"
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                        activeSection === "next-actions"
                          ? "border-blue-600 bg-blue-50 text-blue-600 font-medium"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      다음 액션
                    </a>
                    {data.similarTrademarks &&
                      data.similarTrademarks.length > 0 && (
                        <a
                          href="#similar-trademarks"
                          className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                            activeSection === "similar-trademarks"
                              ? "border-blue-600 bg-blue-50 text-blue-600 font-medium"
                              : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          유사 상표 목록
                        </a>
                      )}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* 출원 신청 모달 */}
      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onSubmit={handleApplicationSubmit}
        trademarkName={trademarkName}
        registrationProbability={registrationProbability}
        isLoading={isLoading}
      />

      {/* 전문가 상담 모달 */}
      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        onSubmit={handleConsultationSubmit}
        trademarkName={trademarkName}
        registrationProbability={registrationProbability}
        isLoading={isLoading}
      />
    </div>
  );
}
