"use client";

import { useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/utils";

export interface SubstepData {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  startTime?: string;
  endTime?: string;
  data?: any;
  apiCall?: {
    request: any;
    response: any;
    tokensUsed?: number;
    executionTimeMs?: number;
    cost?: number;
  };
}

export interface StageData {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  startTime?: string;
  endTime?: string;
  substeps?: SubstepData[];
  request?: any;
  response?: any;
  error?: any;
  metadata?: {
    [key: string]: any;
  };
}

interface StageItemProps {
  stage: StageData;
  stageNumber: number;
  onCommentClick: (stageId: string) => void;
  commentCount?: number;
}

// 데이터 포맷팅 헬퍼 함수
function formatData(data: any, substepId: string): React.ReactElement | null {
  // data가 없으면 null 반환
  if (!data) {
    return null;
  }

  // Request/Response 데이터가 있는 경우 우선 처리
  if (data.request || data.response) {
    return (
      <div className="space-y-3">
        {data.request && (
          <div className="space-y-2">
            <div className="font-semibold text-xs flex items-center gap-2">
              📤 Request
              {data.executionTime && (
                <span className="text-muted-foreground font-normal">
                  ({data.executionTime}ms)
                </span>
              )}
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700">
                View Request Data
              </summary>
              <div className="mt-2 max-h-96 overflow-y-auto">
                <pre className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                  <code className="text-xs break-all whitespace-pre-wrap">
                    {JSON.stringify(data.request, null, 2)}
                  </code>
                </pre>
              </div>
            </details>
          </div>
        )}

        {data.response && (
          <div className="space-y-2">
            <div className="font-semibold text-xs flex items-center gap-2">
              📥 Response
              {data.tokensUsed && (
                <span className="text-muted-foreground font-normal">
                  ({data.tokensUsed} tokens)
                </span>
              )}
              {data.cost && (
                <span className="text-muted-foreground font-normal">
                  (${data.cost.toFixed(4)})
                </span>
              )}
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-green-600 hover:text-green-700">
                View Response Data
              </summary>
              <div className="mt-2 max-h-96 overflow-y-auto">
                <pre className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                  <code className="text-xs break-all whitespace-pre-wrap">
                    {JSON.stringify(data.response, null, 2)}
                  </code>
                </pre>
              </div>
            </details>
          </div>
        )}

        {data.error && (
          <div className="space-y-2">
            <div className="font-semibold text-xs text-red-600">⚠️ Error</div>
            <div className="text-xs p-2 bg-red-50 rounded text-red-700 break-words">
              {data.error}
            </div>
          </div>
        )}
      </div>
    );
  }

  // extract_query 처리 - 쿼리추출 결과 표시
  if (substepId === "extract_query" && data.query) {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-xs">📝 입력 쿼리 (상표설명)</div>
        <div className="text-xs p-3 bg-blue-50 rounded break-words">
          {data.query}
        </div>
      </div>
    );
  }

  // select_products 처리 - 유사군코드, 지정상품10개 선택 결과 표시
  if (substepId === "select_products") {
    return (
      <div className="space-y-3">
        {data.primary_similar_group_code && (
          <div className="space-y-1">
            <div className="font-semibold text-xs">🎯 Primary 유사군 코드</div>
            <div className="text-xs p-2 bg-green-50 rounded font-mono">
              {data.primary_similar_group_code}
              {data.classification_codes &&
                data.classification_codes.length > 0 && (
                  <span className="ml-2 text-gray-600">
                    (
                    {data.classification_codes
                      .map((code: number) => `제${code}류`)
                      .join(", ")}
                    )
                  </span>
                )}
            </div>
          </div>
        )}

        {data.primary_products && data.primary_products.length > 0 && (
          <div className="space-y-1">
            <div className="font-semibold text-xs">
              📦 Primary 지정상품 (10개)
            </div>
            <div className="text-xs p-2 bg-amber-50 rounded">
              <ul className="list-disc list-inside space-y-1">
                {data.primary_products
                  .slice(0, 10)
                  .map((product: string, idx: number) => (
                    <li key={idx}>{product}</li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // KIPRIS API 요청 처리 (kipris_request만 표시, kipris_response는 숨김)
  if (substepId === "kipris_request") {
    return (
      <div className="space-y-2">
        <div className="font-semibold text-xs">📝 요청 데이터</div>
        {data.query && (
          <div className="text-xs p-2 bg-blue-50 rounded font-mono">
            {data.query}
          </div>
        )}
      </div>
    );
  }

  // kipris_response는 표시하지 않음 (데이터 처리 결과에 통합됨)
  if (substepId === "kipris_response") {
    return null;
  }

  // 데이터 처리 결과 - KIPRIS 검색 결과 표시 (실제 분석 컴포넌트와 동일)
  if (substepId === "data_processing" && data.search_results) {
    const results = data.search_results;

    // 상태별 버튼 색상 (SimilarTrademarkCard.tsx와 동일)
    const getStatusButtonColor = (status: string): string => {
      switch (status.toLowerCase()) {
        case "등록":
          return "bg-blue-600 text-white";
        case "출원":
          return "bg-blue-600 text-white";
        case "거절":
          return "bg-orange-600 text-white";
        case "포기":
          return "bg-gray-400 text-white";
        case "소멸":
          return "bg-red-600 text-white";
        case "취하":
          return "bg-yellow-600 text-white";
        default:
          return "bg-gray-500 text-white";
      }
    };

    return (
      <div className="space-y-3 w-full overflow-x-hidden">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>전체 결과: {data.total_results}개</span>
          {data.high_risk_count !== undefined && (
            <span className="text-red-600 font-medium">
              위험: {data.high_risk_count}개
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
          {results.map((trademark: any, index: number) => (
            <div
              key={trademark.serialNumber || index}
              className="bg-white border border-gray-200 rounded overflow-hidden min-w-0"
            >
              {/* 이미지 영역 */}
              <div className="relative aspect-square bg-white p-3 flex items-center justify-center">
                {trademark.imageUrl ||
                trademark.imagePath ||
                trademark.thumbnailPath ? (
                  <img
                    src={
                      trademark.imageUrl ||
                      trademark.imagePath ||
                      trademark.thumbnailPath
                    }
                    alt={trademark.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // 이미지 로드 실패 시 fallback
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                {!(
                  trademark.imageUrl ||
                  trademark.imagePath ||
                  trademark.thumbnailPath
                ) && (
                  <div className="text-center text-gray-400 text-sm">
                    {trademark.title || "상표명 없음"}
                  </div>
                )}
              </div>

              {/* 상태 버튼 + 번호 */}
              <div className="flex items-center gap-2 px-3 pb-1">
                <span
                  className={`${getStatusButtonColor(
                    trademark.applicationStatus || "출원"
                  )} text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap`}
                >
                  {trademark.applicationStatus || "출원"}
                </span>
                <span className="text-xs text-blue-600">
                  [
                  {trademark.applicationNumber ||
                    trademark.registrationNumber ||
                    "번호없음"}
                  ]
                </span>
              </div>

              {/* 상표명 */}
              <div className="px-3 pb-2">
                <h4
                  className="font-bold text-sm line-clamp-1"
                  title={trademark.title}
                >
                  {trademark.title}
                </h4>
              </div>

              {/* 정보 영역 */}
              <div className="px-3 py-2 space-y-0.5 text-xs">
                {/* 상품분류 */}
                {trademark.goodsClassificationCode && (
                  <p className="text-blue-600">
                    <span className="text-gray-600">상품분류:</span>{" "}
                    {trademark.goodsClassificationCode}
                  </p>
                )}

                {/* 출원인 */}
                <p
                  className="text-blue-600 line-clamp-1"
                  title={trademark.applicantName}
                >
                  <span className="text-gray-600">출원인:</span>{" "}
                  {trademark.applicantName || "정보없음"}
                </p>

                {/* 최종권리자 (등록 상태인 경우) */}
                {trademark.applicationStatus === "등록" && (
                  <p
                    className="text-blue-600 line-clamp-1"
                    title={trademark.applicantName}
                  >
                    <span className="text-gray-600">최종권리자:</span>{" "}
                    {trademark.applicantName || "정보없음"}
                  </p>
                )}

                {/* 유사도 점수 (디버그용 추가 정보) */}
                {trademark.similarityScore !== undefined && (
                  <p className="text-gray-600">
                    유사도: {trademark.similarityScore}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // AI 분석 요청/응답 처리 (final_analysis 스테이지)
  if (substepId === "analysis_request" || substepId === "analysis_response") {
    // request/response 데이터 구조 확인
    if (data.request || data.response) {
      // AI 분석 요청인 경우
      if (substepId === "analysis_request" && data.request) {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {data.executionTime && (
                <span>실행시간: {data.executionTime}ms</span>
              )}
              {data.request.model && <span>모델: {data.request.model}</span>}
            </div>
            {data.request.prompt && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700">
                  📤 프롬프트 내용 보기
                </summary>
                <div className="mt-2 max-h-[500px] overflow-y-auto">
                  <div className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                    <pre className="whitespace-pre-wrap text-gray-700 text-xs break-words">
                      {typeof data.request.prompt === "string"
                        ? data.request.prompt
                        : JSON.stringify(data.request.prompt, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        );
      }

      // AI 분석 응답인 경우
      if (substepId === "analysis_response" && data.response) {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {data.tokensUsed && (
                <span>토큰: {data.tokensUsed.toLocaleString()}</span>
              )}
              {data.cost && <span>비용: ${data.cost.toFixed(4)}</span>}
            </div>

            {/* 주요 분석 결과 - 항상 표시 */}
            {data.response.registration_probability !== undefined && (
              <div className="p-3 bg-green-50 rounded space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <div className="text-xs font-medium text-gray-600">
                      등록 가능성
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {data.response.registration_probability}%
                    </div>
                  </div>
                  {data.response.ai_confidence !== undefined && (
                    <div className="text-sm">
                      <div className="text-xs font-medium text-gray-600">
                        AI 신뢰도
                      </div>
                      <div className="text-lg font-bold text-blue-700">
                        {data.response.ai_confidence}%
                      </div>
                    </div>
                  )}
                </div>
                {data.response.risk_level && (
                  <div className="text-sm">
                    <span className="text-xs font-medium text-gray-600">
                      위험 수준:{" "}
                    </span>
                    <span
                      className={`font-bold ${
                        data.response.risk_level === "low"
                          ? "text-green-600"
                          : data.response.risk_level === "medium"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {data.response.risk_level === "low"
                        ? "낮음"
                        : data.response.risk_level === "medium"
                        ? "중간"
                        : "높음"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 상세 분석 내용 */}
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-green-600 hover:text-green-700">
                📥 상세 분석 내용 보기
              </summary>
              <div className="mt-2 space-y-2">
                {data.response.key_findings &&
                  data.response.key_findings.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded">
                      <div className="font-medium mb-2">주요 발견사항:</div>
                      <ul className="list-disc list-inside text-xs space-y-1 text-gray-700">
                        {data.response.key_findings.map(
                          (finding: string, idx: number) => (
                            <li key={idx} className="break-words">
                              {finding}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {data.response.legal_risks &&
                  data.response.legal_risks.length > 0 && (
                    <div className="p-3 bg-red-50 rounded">
                      <div className="font-medium mb-2 text-red-700">
                        법적 위험 요소:
                      </div>
                      <ul className="list-disc list-inside text-xs space-y-1 text-red-600">
                        {data.response.legal_risks.map(
                          (risk: string, idx: number) => (
                            <li key={idx} className="break-words">
                              {risk}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {data.response.strategic_recommendations &&
                  data.response.strategic_recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="font-medium mb-2 text-blue-700">
                        전략적 제안:
                      </div>
                      <ul className="list-disc list-inside text-xs space-y-1 text-blue-600">
                        {data.response.strategic_recommendations.map(
                          (rec: string, idx: number) => (
                            <li key={idx} className="break-words">
                              {rec}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* 전체 JSON (숨김) */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">
                    전체 JSON 데이터
                  </summary>
                  <div className="mt-2 max-h-96 overflow-y-auto">
                    <pre className="p-2 bg-gray-100 rounded max-w-full overflow-hidden">
                      <code className="text-xs break-all whitespace-pre-wrap">
                        {JSON.stringify(data.response, null, 2)}
                      </code>
                    </pre>
                  </div>
                </details>
              </div>
            </details>
          </div>
        );
      }

      {
        data.error && (
          <div className="p-2 bg-red-50 rounded">
            <div className="text-xs text-red-700 break-words">{data.error}</div>
          </div>
        );
      }

      return null;
    }

    // 이전 형식 (호환성 유지)
    return (
      <div className="space-y-2">
        <div className="font-semibold text-xs">
          {substepId === "analysis_request"
            ? "🤖 AI 분석 요청"
            : "✨ AI 분석 응답"}
        </div>
        {data.model && (
          <div className="text-xs">
            <span className="font-medium">모델:</span> {data.model}
          </div>
        )}
        {data.tokensUsed && (
          <div className="text-xs">
            <span className="font-medium">토큰 사용:</span> {data.tokensUsed}
          </div>
        )}
        {data.confidence !== undefined && (
          <div className="text-xs">
            <span className="font-medium">등록가능성:</span> {data.confidence}%
          </div>
        )}
        {data.summary && (
          <div className="text-xs mt-2">
            <div className="font-medium mb-1">분석 요약:</div>
            <div className="p-2 bg-blue-50 rounded break-words">
              {data.summary}
            </div>
          </div>
        )}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">전체 데이터</summary>
          <div className="mt-1 max-h-96 overflow-y-auto">
            <pre className="p-2 bg-gray-100 rounded max-w-full overflow-hidden">
              <code className="text-xs break-all whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </code>
            </pre>
          </div>
        </details>
      </div>
    );
  }

  // 기본 JSON 표시
  return (
    <div className="max-h-96 overflow-y-auto">
      <pre className="text-xs bg-muted p-2 rounded max-w-full overflow-hidden">
        <code className="break-all whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </code>
      </pre>
    </div>
  );
}

// Substep 컴포넌트
function SubstepItem({ substep }: { substep: SubstepData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // kipris_response는 UI에서 완전히 숨김
  if (substep.id === "kipris_response") {
    return null;
  }
  // Check for both apiCall and data fields
  const hasApiCall =
    substep.apiCall && (substep.apiCall.request || substep.apiCall.response);
  const hasData = substep.data && Object.keys(substep.data).length > 0;
  const hasContent = hasApiCall || hasData;

  return (
    <div className="border-l-2 border-muted ml-2 pl-3">
      <div
        className={`flex items-center gap-2 ${
          hasContent
            ? "cursor-pointer hover:bg-accent/5 -mx-2 px-2 py-1 rounded transition-colors"
            : ""
        }`}
        onClick={hasContent ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasContent && (
            <ChevronRight
              className={`h-3 w-3 text-muted-foreground transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          )}
          <span className="text-sm text-muted-foreground">{substep.name}</span>
          {substep.status === "completed" && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
          {substep.status === "processing" && (
            <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
          )}
          {substep.status === "failed" && (
            <AlertCircle className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>
      {isExpanded && hasContent && (
        <div className="mt-2 ml-5">
          {/* extract_query와 select_products는 항상 substep.data 사용 */}
          {substep.id === "extract_query" ||
          substep.id === "select_products" ||
          substep.id === "kipris_request" ||
          substep.id === "kipris_response" ||
          substep.id === "data_processing" ? (
            formatData(substep.data, substep.id)
          ) : hasApiCall ? (
            // Special handling for AI 분석 요청/응답
            substep.id === "analysis_request" ? (
              // AI 분석 요청 - 프롬프트만 표시
              <div className="space-y-2">
                {substep.apiCall!.request?.prompt &&
                typeof substep.apiCall!.request.prompt === "string" ? (
                  <div className="max-h-[500px] overflow-y-auto">
                    <div className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                      <pre className="whitespace-pre-wrap break-words text-gray-700 text-xs">
                        {substep
                          .apiCall!.request.prompt.replace(/\\n/g, "\n")
                          .replace(/\\t/g, "\t")}
                      </pre>
                      {substep.apiCall!.request.model && (
                        <div className="mt-2 text-xs text-gray-500">
                          Model: {substep.apiCall!.request.model}
                        </div>
                      )}
                    </div>
                  </div>
                ) : substep.apiCall!.request ? (
                  <div className="max-h-[500px] overflow-y-auto">
                    <pre className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                      <code className="text-xs break-all whitespace-pre-wrap">
                        {JSON.stringify(substep.apiCall!.request, null, 2)}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded text-xs text-gray-500">
                    데이터 없음
                  </div>
                )}
              </div>
            ) : substep.id === "analysis_response" ? (
              // AI 분석 응답 - 응답만 표시
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {substep.apiCall!.tokensUsed && (
                    <span>
                      토큰: {substep.apiCall!.tokensUsed.toLocaleString()}
                    </span>
                  )}
                  {substep.apiCall!.executionTimeMs && (
                    <span>
                      실행시간:{" "}
                      {(substep.apiCall!.executionTimeMs / 1000).toFixed(2)}초
                    </span>
                  )}
                  {substep.apiCall!.cost && (
                    <span>비용: ${substep.apiCall!.cost.toFixed(4)}</span>
                  )}
                </div>
                {typeof substep.apiCall!.response === "string" ? (
                  <div className="max-h-[500px] overflow-y-auto">
                    <div className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                      <pre className="whitespace-pre-wrap break-words text-gray-700 text-xs">
                        {substep
                          .apiCall!.response.replace(/\\n/g, "\n")
                          .replace(/\\t/g, "\t")}
                      </pre>
                    </div>
                  </div>
                ) : substep.apiCall!.response ? (
                  <div className="max-h-[500px] overflow-y-auto">
                    <pre className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                      <code className="text-xs break-all whitespace-pre-wrap">
                        {JSON.stringify(substep.apiCall!.response, null, 2)}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded text-xs text-gray-500">
                    데이터 없음
                  </div>
                )}
              </div>
            ) : (
              // Default display for other substeps with apiCall data
              <div className="space-y-3">
                {substep.apiCall!.request && (
                  <div className="space-y-2">
                    <div className="font-semibold text-xs flex items-center gap-2">
                      📤 Request
                      {substep.apiCall!.executionTimeMs && (
                        <span className="text-muted-foreground font-normal">
                          ({substep.apiCall!.executionTimeMs}ms)
                        </span>
                      )}
                    </div>
                    <details className="text-xs">
                      {substep.apiCall!.request.prompt &&
                      typeof substep.apiCall!.request.prompt === "string" ? (
                        <div className="mt-2 max-h-[500px] overflow-y-auto">
                          <div className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                            <div className="font-medium mb-2">Prompt:</div>
                            <pre className="whitespace-pre-wrap break-words text-gray-700 text-xs">
                              {substep
                                .apiCall!.request.prompt.replace(/\\n/g, "\n")
                                .replace(/\\t/g, "\t")}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 max-h-[500px] overflow-y-auto">
                          <pre className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                            <code className="text-xs break-all whitespace-pre-wrap">
                              {JSON.stringify(
                                substep.apiCall!.request,
                                null,
                                2
                              )}
                            </code>
                          </pre>
                        </div>
                      )}
                    </details>
                  </div>
                )}

                {substep.apiCall!.response && (
                  <div className="space-y-2">
                    <div className="font-semibold text-xs flex items-center gap-2">
                      📥 Response
                      {substep.apiCall!.tokensUsed && (
                        <span className="text-muted-foreground font-normal">
                          ({substep.apiCall!.tokensUsed} tokens)
                        </span>
                      )}
                      {substep.apiCall!.cost && (
                        <span className="text-muted-foreground font-normal">
                          (${substep.apiCall!.cost.toFixed(4)})
                        </span>
                      )}
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium text-green-600 hover:text-green-700">
                        View Response Data
                      </summary>
                      {typeof substep.apiCall!.response === "string" ? (
                        <div className="mt-2 max-h-[500px] overflow-y-auto">
                          <div className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                            <pre className="whitespace-pre-wrap break-words text-gray-700 text-xs">
                              {substep
                                .apiCall!.response.replace(/\\n/g, "\n")
                                .replace(/\\t/g, "\t")}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 max-h-[500px] overflow-y-auto">
                          <pre className="p-3 bg-slate-50 rounded max-w-full overflow-hidden">
                            <code className="text-xs break-all whitespace-pre-wrap">
                              {JSON.stringify(
                                substep.apiCall!.response,
                                null,
                                2
                              )}
                            </code>
                          </pre>
                        </div>
                      )}
                    </details>
                  </div>
                )}

                {substep.data?.error && (
                  <div className="space-y-2">
                    <div className="font-semibold text-xs text-red-600">
                      ⚠️ Error
                    </div>
                    <div className="text-xs p-2 bg-red-50 rounded text-red-700 break-words">
                      {substep.data.error}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            // Fallback to old format if no apiCall data
            formatData(substep.data, substep.id)
          )}
        </div>
      )}
    </div>
  );
}

export function StageItem({
  stage,
  stageNumber,
  onCommentClick,
  commentCount = 0,
}: StageItemProps) {
  const getStatusIcon = () => {
    switch (stage.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (stage.status) {
      case "completed":
        return "완료";
      case "processing":
        return "진행 중";
      case "failed":
        return "실패";
      default:
        return "대기 중";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all",
        stage.status === "processing" && "border-blue-500 shadow-lg",
        stage.status === "failed" && "border-red-200"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">
                  Stage {stageNumber}: {stage.name}
                </h3>
                <Badge
                  variant={
                    stage.status === "completed"
                      ? "secondary"
                      : stage.status === "processing"
                      ? "default"
                      : stage.status === "failed"
                      ? "destructive"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {getStatusText()}
                </Badge>
              </div>

              {stage.metadata && (
                <div className="text-sm text-muted-foreground space-y-1 mb-2">
                  {stage.metadata.searchCount && (
                    <p>검색 결과: {stage.metadata.searchCount}개</p>
                  )}
                  {stage.metadata.filteredCount && (
                    <p>필터링 후: {stage.metadata.filteredCount}개</p>
                  )}
                  {stage.metadata.confidence && (
                    <p>등록가능성: {stage.metadata.confidence}%</p>
                  )}
                  {stage.metadata.tokensUsed && (
                    <p>
                      토큰 사용: {stage.metadata.tokensUsed.toLocaleString()}
                    </p>
                  )}
                  {stage.metadata.executionTimeMs && (
                    <p>
                      실행 시간:{" "}
                      {(stage.metadata.executionTimeMs / 1000).toFixed(2)}초
                    </p>
                  )}
                  {stage.metadata.cost && (
                    <p>비용: ${stage.metadata.cost.toFixed(4)}</p>
                  )}
                  {stage.metadata.inputCount !== undefined &&
                    stage.metadata.outputCount !== undefined && (
                      <p>
                        데이터 처리: {stage.metadata.inputCount} →{" "}
                        {stage.metadata.outputCount}
                      </p>
                    )}
                </div>
              )}

              {/* Substeps 표시 - 개별 토글 추가 */}
              {stage.substeps && stage.substeps.length > 0 && (
                <div className="mt-3 space-y-2">
                  {stage.substeps.map((substep, index) => (
                    <SubstepItem key={`${substep.id}-${index}`} substep={substep} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onCommentClick(stage.id)}
            >
              <MessageSquare className="h-4 w-4" />
              {commentCount > 0 && (
                <span className="ml-1 text-xs">{commentCount}</span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
