import { useState, useEffect, useCallback, useRef } from "react";
import {
  WorkflowStage,
  APICallLog,
  DataProcessingLog,
  WorkflowCheckpoint,
  FinalResult,
  WorkflowSubstep,
} from "../_types/workflow.types";
import { WorkflowSnapshotService } from "../_services/workflow-snapshot-service";

interface DebugWorkflowState {
  sessionId: string | null;
  isAnalyzing: boolean;
  stages: WorkflowStage[];
  apiCalls: APICallLog[];
  dataProcessingLogs: DataProcessingLog[];
  checkpoints: WorkflowCheckpoint[];
  kiprisSearches: any[];
  finalResult: FinalResult | null;
  currentProgress: number;
  error: string | null;
  businessDescription?: string;
  trademarkName?: string;
}

const snapshotService = new WorkflowSnapshotService();

export function useDebugWorkflow() {
  const [state, setState] = useState<DebugWorkflowState>({
    sessionId: null,
    isAnalyzing: false,
    stages: [],
    apiCalls: [],
    dataProcessingLogs: [],
    checkpoints: [],
    kiprisSearches: [],
    finalResult: null,
    currentProgress: 0,
    error: null,
  });

  // EventSource reference를 ref로 관리
  const eventSourceRef = useRef<EventSource | null>(null);

  // 재시도 관련 상태 관리
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryDelays = [1000, 3000, 5000]; // 점진적으로 증가하는 재시도 지연

  // 스냅샷 저장 중복 방지를 위한 플래그
  const isSnapshotSavingRef = useRef(false);

  // SSE 연결 정리 함수
  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // SSE 연결 생성 함수 (재시도 로직 포함)
  const createSSEConnection = useCallback(
    (sessionId: string, isRetry: boolean = false) => {
      const sseUrl = `/api/admin/workflow/stream/${sessionId}`;

      if (isRetry && retryCountRef.current >= maxRetries) {
        console.error(
          `❌ [useDebugWorkflow] Max retries (${maxRetries}) reached. Stopping reconnection attempts.`
        );
        setState((prev) => ({
          ...prev,
          error: `연결 재시도 ${maxRetries}회 실패. 페이지를 새로고침 하거나 나중에 다시 시도해주세요.`,
          isAnalyzing: false,
        }));
        retryCountRef.current = 0;
        return;
      }

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // 연결 성공 시 재시도 카운터 리셋
      eventSource.onopen = () => {
        retryCountRef.current = 0; // 성공 시 재시도 카운터 리셋

        // 연결 성공 시 에러 상태 클리어
        setState((prev) => ({
          ...prev,
          error: null,
        }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              break;

            case "session_update":
              setState((prev) => ({
                ...prev,
                currentProgress: data.data.progress || 0,
              }));
              break;

            case "workflow_event":
              setState((prev) => {
                // 이미 처리된 이벤트인지 확인 (중복 방지)
                const currentStage = prev.stages.find(
                  (s) => s.id === data.data.stage
                );
                const currentSubstep = currentStage?.substeps?.find(
                  (sub) => sub.id === data.data.substep
                );

                // 이미 completed 상태인 substep이 다시 processing/pending으로 변경되는 것 방지
                if (
                  currentSubstep?.status === "completed" &&
                  (data.data.status === "processing" ||
                    data.data.status === "pending")
                ) {
                  return prev; // 상태 변경하지 않음
                }

                // 이미 processing 중인 substep에 동일한 processing 이벤트가 오면 무시
                if (
                  currentSubstep?.status === "processing" &&
                  data.data.status === "processing" &&
                  !data.data.event_data
                ) {
                  // event_data가 없는 중복 이벤트만 무시
                  return prev;
                }

                const stages = updateStagesFromWorkflowEvent(
                  prev.stages,
                  data.data
                );
                return {
                  ...prev,
                  stages,
                };
              });
              break;

            case "api_call":
              setState((prev) => {
                const newApiCalls = [...prev.apiCalls, data.data];
                // API 호출 데이터를 stages에도 통합
                const updatedStages = integrateApiCallToStages(
                  prev.stages,
                  data.data
                );
                return {
                  ...prev,
                  apiCalls: newApiCalls,
                  stages: updatedStages,
                };
              });
              break;

            case "data_processing":
              setState((prev) => ({
                ...prev,
                dataProcessingLogs: [...prev.dataProcessingLogs, data.data],
              }));
              break;

            case "checkpoint":
              setState((prev) => ({
                ...prev,
                checkpoints: [...prev.checkpoints, data.data],
                currentProgress: data.data.progress || prev.currentProgress,
              }));
              break;

            case "kipris_search":
              setState((prev) => ({
                ...prev,
                kiprisSearches: [...prev.kiprisSearches, data.data],
              }));
              break;

            case "final_result":
              setState((prev) => ({
                ...prev,
                finalResult: data.data,
                currentProgress: 100,
              }));
              break;

            case "completed":
              setState((prev) => {
                // Save snapshot when analysis completes - with duplicate prevention
                if (prev.sessionId && !isSnapshotSavingRef.current) {
                  // Set flag to prevent duplicate saves
                  isSnapshotSavingRef.current = true;

                  snapshotService
                    .saveSnapshot({
                      sessionId: prev.sessionId,
                      stages: prev.stages,
                      apiCalls: prev.apiCalls,
                      dataProcessingLogs: prev.dataProcessingLogs,
                      checkpoints: prev.checkpoints,
                      kiprisSearches: prev.kiprisSearches,
                      finalResult: prev.finalResult || null, // finalResult가 없으면 null
                      businessDescription: prev.businessDescription,
                      trademarkName: prev.trademarkName,
                    })
                    .then((snapshot) => {
                      if (!snapshot) {
                        console.error(
                          "❌ [useDebugWorkflow] Failed to save snapshot"
                        );
                      }
                    })
                    .finally(() => {
                      // Reset flag after save completes (whether success or failure)
                      // Add delay to prevent immediate re-saves
                      setTimeout(() => {
                        isSnapshotSavingRef.current = false;
                      }, 2000);
                    });
                }

                return {
                  ...prev,
                  isAnalyzing: false,
                };
              });
              break;

            case "error":
              setState((prev) => ({
                ...prev,
                error: data.message,
                isAnalyzing: false,
              }));
              break;

            case "ping":
            case "heartbeat":
              // Keep-alive 메시지 무시
              break;

            case "timeout":
              eventSource.close();
              setState((prev) => ({
                ...prev,
                isAnalyzing: false,
              }));
              break;
          }
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = (event) => {
        // SSE onerror는 Event 객체를 받음 (에러 세부 정보는 없음)
        const errorInfo = {
          readyState: eventSource.readyState,
          readyStateText:
            eventSource.readyState === 0
              ? "CONNECTING"
              : eventSource.readyState === 1
              ? "OPEN"
              : eventSource.readyState === 2
              ? "CLOSED"
              : "UNKNOWN",
          sessionId,
          url: sseUrl,
          eventType: event.type,
          retryCount: retryCountRef.current,
          timestamp: new Date().toISOString(),
        };

        console.error("❌ [useDebugWorkflow] SSE Error occurred:", errorInfo);

        // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
          // 재시도 로직
          if (retryCountRef.current < maxRetries) {
            const retryDelay = retryDelays[retryCountRef.current] || 5000;
            retryCountRef.current++;

            setState((prev) => ({
              ...prev,
              error: `연결이 끊어졌습니다. ${
                retryDelay / 1000
              }초 후 재연결 시도... (${retryCountRef.current}/${maxRetries})`,
            }));

            // 기존 연결 정리
            if (eventSourceRef.current === eventSource) {
              eventSourceRef.current = null;
            }

            // 재시도 예약
            retryTimeoutRef.current = setTimeout(() => {
              if (state.isAnalyzing) {
                // 분석 중인 경우에만 재시도
                createSSEConnection(sessionId, true);
              }
            }, retryDelay);
          } else {
            // 최대 재시도 횟수 초과
            setState((prev) => ({
              ...prev,
              error: `SSE 연결 실패. 최대 재시도 횟수(${maxRetries})를 초과했습니다. 페이지를 새로고침 해주세요.`,
              isAnalyzing: false,
            }));

            // EventSource 정리
            if (eventSourceRef.current === eventSource) {
              eventSourceRef.current = null;
            }
          }
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          // 브라우저가 자동으로 재연결 시도 중
          // 일시적인 연결 오류일 수 있으므로 에러 상태는 설정하지 않음
          setState((prev) => ({
            ...prev,
            error: "서버와 재연결 중...",
          }));
        }
      };
    },
    [state.isAnalyzing]
  );

  // 분석 시작 함수
  const startAnalysis = useCallback(
    async (sessionId: string) => {
      // 이전 연결 및 재시도 정리
      cleanupSSE();
      retryCountRef.current = 0;
      isSnapshotSavingRef.current = false; // Reset snapshot flag for new analysis

      // Fetch session data to get trademark_name and business_description
      let trademarkName = "상표명 없음";
      let businessDescription = "";

      try {
        const response = await fetch(
          `/api/admin/workflow/session/${sessionId}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            trademarkName = result.data.trademark_name || "상표명 없음";
            businessDescription = result.data.business_description || "";
          }
        }
      } catch (error) {
        console.error("Failed to fetch session data:", error);
      }

      // 상태 초기화 - 새로운 상세 스테이지 구조
      setState({
        sessionId,
        isAnalyzing: true,
        businessDescription, // Store business description
        trademarkName, // Store trademark name
        stages: [
          {
            id: "goods_classification",
            name: "유사군 코드 추출",
            status: "pending",
            substeps: [
              { id: "extract_query", name: "쿼리추출", status: "pending" },
              {
                id: "select_products",
                name: "유사군코드, 지정상품10개 추출",
                status: "pending",
              },
            ],
          },
          {
            id: "kipris_search",
            name: "KIPRIS 검색",
            status: "pending",
            substeps: [
              {
                id: "kipris_request",
                name: "KIPRIS API 요청",
                status: "pending",
              },
              {
                id: "data_processing",
                name: "유사상표 분석 50개 추출",
                status: "pending",
              },
            ],
          },
          {
            id: "final_analysis",
            name: "종합 분석",
            status: "pending",
            substeps: [
              {
                id: "analysis_request",
                name: "AI 분석 요청",
                status: "pending",
              },
              {
                id: "analysis_response",
                name: "AI 분석 응답",
                status: "pending",
              },
            ],
          },
        ],
        apiCalls: [],
        dataProcessingLogs: [],
        checkpoints: [],
        kiprisSearches: [],
        finalResult: null,
        currentProgress: 0,
        error: null,
      });

      // SSE 연결 생성 (즉시 실행하여 이벤트 누락 방지)
      createSSEConnection(sessionId, false);
    },
    [cleanupSSE, createSSEConnection]
  );

  // 분석 중지
  const stopAnalysis = useCallback(() => {
    cleanupSSE();
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
    }));
  }, [cleanupSSE]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, [cleanupSSE]);

  return {
    state,
    startAnalysis,
    stopAnalysis,
  };
}

// Helper 함수: API 호출 데이터를 stages에 통합
function integrateApiCallToStages(
  stages: WorkflowStage[],
  apiCall: {
    stage: string;
    api_type: string;
    execution_time_ms?: number;
    tokens_used?: number;
    cost_estimate?: number;
    error_message?: string;
    request_data?: any;
    response_data?: any;
  }
): WorkflowStage[] {
  // stage와 api_type을 기반으로 substep 매핑
  const substepMapping: Record<string, Record<string, string>> = {
    goods_classifier: {
      gemini: "extract_query",
      rag: "rag_search",
    },
    goods_classification: {
      gemini: "select_products",
      rag: "rag_search",
    },
    kipris_search: {
      kipris: "kipris_request",
    },
    final_analysis: {
      gemini: "analysis_request",
    },
    comprehensive_analysis: {
      gemini: "analysis_request",
    },
  };

  return stages.map((stage) => {
    // Stage ID 매칭 (goods_classification, kipris_search, final_analysis)
    const stageId = stage.id;
    const apiStage = apiCall.stage;

    // Stage 이름 정규화
    let matchedStage = false;
    if (
      (stageId === "goods_classification" &&
        (apiStage === "goods_classifier" ||
          apiStage === "goods_classification")) ||
      (stageId === "kipris_search" &&
        (apiStage === "kipris_search" || apiStage === "trademark_search")) ||
      (stageId === "final_analysis" &&
        (apiStage === "final_analysis" ||
          apiStage === "comprehensive_analysis"))
    ) {
      matchedStage = true;
    }

    if (!matchedStage) return stage;

    const updatedStage = { ...stage };

    // Substep에 API 호출 데이터 추가
    if (updatedStage.substeps) {
      updatedStage.substeps = updatedStage.substeps.map((substep) => {
        let shouldUpdate = false;

        // Substep ID와 API 유형 매칭
        if (stageId === "goods_classification") {
          if (
            (substep.id === "extract_query" && apiCall.api_type === "gemini") ||
            (substep.id === "rag_search" && apiCall.api_type === "rag") ||
            (substep.id === "select_products" && apiCall.api_type === "gemini")
          ) {
            shouldUpdate = true;
          }
        } else if (stageId === "kipris_search") {
          // KIPRIS는 한 번의 API 호출로 완료되므로 response에만 데이터 저장
          if (
            substep.id === "kipris_response" &&
            apiCall.api_type === "kipris"
          ) {
            shouldUpdate = true;
          }
        } else if (stageId === "final_analysis") {
          // analysis_request에 request 데이터 저장
          if (
            substep.id === "analysis_request" &&
            apiCall.api_type === "gemini"
          ) {
            shouldUpdate = true;
          }
          // analysis_response에 전체 데이터 저장
          if (
            substep.id === "analysis_response" &&
            apiCall.api_type === "gemini"
          ) {
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          return {
            ...substep,
            status: "completed" as const,
            endTime: new Date().toISOString(),
            apiCall: {
              request: apiCall.request_data,
              response: apiCall.response_data,
              tokensUsed: apiCall.tokens_used,
              executionTimeMs: apiCall.execution_time_ms,
              cost: apiCall.cost_estimate,
            },
            data: apiCall.error_message
              ? { error: apiCall.error_message }
              : substep.data,
          };
        }

        // KIPRIS API response가 완료되면 request도 자동 완료 처리
        if (
          stageId === "kipris_search" &&
          substep.id === "kipris_request" &&
          apiCall.api_type === "kipris" &&
          apiCall.response_data
        ) {
          return {
            ...substep,
            status: "completed" as const,
            endTime: new Date().toISOString(),
          };
        }

        // analysis_request는 이미 위에서 데이터와 함께 처리됨

        return substep;
      });
    }

    // Metadata 업데이트
    updatedStage.metadata = {
      ...updatedStage.metadata,
      tokensUsed: apiCall.tokens_used,
      executionTimeMs: apiCall.execution_time_ms,
      cost: apiCall.cost_estimate,
    };

    return updatedStage;
  });
}

// workflow_events로부터 스테이지 상태 업데이트
function updateStagesFromWorkflowEvent(
  stages: WorkflowStage[],
  event: {
    stage: string;
    substep: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    event_data?: any;
    error_message?: string;
  }
): WorkflowStage[] {
  // 현재 스테이지 상태 확인
  const currentStage = stages.find((s) => s.id === event.stage);
  if (!currentStage) {
    console.error("❌ Stage not found:", event.stage);
    return stages;
  }

  return stages.map((stage, stageIdx) => {
    if (stage.id === event.stage) {
      // 메인 스테이지 상태 업데이트
      const updatedStage = { ...stage };

      // substep 업데이트
      if (stage.substeps) {
        let substepUpdated = false;
        let completedSubstepIndex = -1;

        updatedStage.substeps = stage.substeps.map((substep, substepIdx) => {
          if (substep.id === event.substep) {
            // 이미 completed 상태인 substep은 다시 변경하지 않음 (단, event_data가 있으면 병합)
            if (substep.status === "completed" && event.status !== "failed") {
              // event_data가 있으면 데이터만 병합
              if (
                event.event_data &&
                Object.keys(event.event_data).length > 0
              ) {
                return {
                  ...substep,
                  data: {
                    ...substep.data,
                    ...event.event_data,
                  },
                };
              }
              return substep;
            }

            // 동일한 상태로의 중복 업데이트 방지
            if (substep.status === event.status && !event.event_data) {
              return substep;
            }

            substepUpdated = true;

            // event_data를 기존 data와 병합하여 더 풍부한 정보 제공
            const mergedData = {
              ...substep.data,
              ...event.event_data,
            };

            // substep이 completed되면 index 저장
            if (event.status === "completed") {
              completedSubstepIndex = substepIdx;
            }

            return {
              ...substep,
              status: event.status as
                | "pending"
                | "processing"
                | "completed"
                | "failed",
              startTime:
                event.status === "processing"
                  ? event.started_at || new Date().toISOString()
                  : substep.startTime,
              endTime:
                event.status === "completed"
                  ? event.completed_at || new Date().toISOString()
                  : substep.endTime,
              data:
                Object.keys(mergedData).length > 0 ? mergedData : substep.data,
            };
          }
          return substep;
        });

        if (!substepUpdated) {
          console.warn(
            `⚠️ [updateStagesFromWorkflowEvent] Substep not found: ${event.substep} in stage ${event.stage}`
          );
        }

        // Don't auto-advance substeps - let the workflow events control the flow
        // This prevents conflicts between auto-advance and incoming events

        // 모든 substep 상태를 확인하여 메인 스테이지 상태 결정
        const substepStatuses = updatedStage.substeps.map((s) => s.status);

        if (substepStatuses.some((s) => s === "failed")) {
          updatedStage.status = "failed";
          updatedStage.error = event.error_message;
        } else if (substepStatuses.every((s) => s === "completed")) {
          updatedStage.status = "completed";
          updatedStage.endTime = event.completed_at || new Date().toISOString();
        } else if (substepStatuses.some((s) => s === "processing")) {
          updatedStage.status = "processing";
          if (!updatedStage.startTime) {
            updatedStage.startTime =
              event.started_at || new Date().toISOString();
          }
        }
      }

      // event_data를 메타데이터로 저장
      if (event.event_data) {
        updatedStage.metadata = {
          ...updatedStage.metadata,
          ...event.event_data,
          lastUpdated: new Date().toISOString(),
        };
      }

      return updatedStage;
    }

    // 다른 스테이지들 처리 - 이전 스테이지가 완료되면 다음 스테이지 준비
    const currentStageIndex = stages.findIndex((s) => s.id === event.stage);
    const thisStageIndex = stages.findIndex((s) => s.id === stage.id);

    // 현재 이벤트의 스테이지가 완료되고, 이 stage가 다음 stage인 경우
    if (
      thisStageIndex === currentStageIndex + 1 &&
      event.status === "completed"
    ) {
      const prevStage = stages[currentStageIndex];

      // 이전 스테이지가 완료되었고 현재 스테이지가 pending이면
      if (stage.status === "pending") {
        // 실제 활성화는 다음 workflow event가 올 때 처리됨
      }
    }

    return stage;
  });
}
