import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/infrastructure/database/server";
import {
  workflowEventBus,
  type WorkflowEventPayload,
} from "@/infrastructure/events/workflow-event-bus";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createServerSupabaseClient();

  // 관리자 권한 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🆕 새로운 권한 확인 방식: user.app_metadata에서 role 직접 접근
  const userRole = user.app_metadata?.role as string;

  if (!userRole || (userRole !== "admin" && userRole !== "manager")) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const { sessionId } = await params;

  // 세션 ID 유효성 검증
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  // SSE 헤더 설정 (버퍼링 완전 비활성화)
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Nginx 버퍼링 비활성화
    "X-Content-Type-Options": "nosniff",
    "Transfer-Encoding": "chunked",
  });

  const encoder = new TextEncoder();

  // 에러를 SSE 형식으로 전송하는 헬퍼 함수
  const sendSSEError = (
    controller: ReadableStreamDefaultController,
    error: string,
    details?: any
  ) => {
    try {
      const errorPayload = {
        type: "error",
        sessionId,
        message: error,
        details,
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`)
      );
      console.error(`❌ [SSE] Error sent to client:`, errorPayload);
    } catch (e) {
      console.error(`❌ [SSE] Failed to send error to client:`, e);
    }
  };

  // 스트림 생성
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 초기 연결 메시지
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "connected",
              sessionId,
              timestamp: new Date().toISOString(),
              serverInfo: {
                nodeVersion: process.version,
                env: process.env.NODE_ENV,
              },
            })}\n\n`
          )
        );

        console.log(`🔌 [SSE] Client connected for session ${sessionId}`);

        // EventBus 버퍼 확인 (Next.js에서는 프로세스간 공유되지 않을 수 있음)
        const bufferedEvents = workflowEventBus.getBufferedEvents(sessionId);
        console.log(
          `📦 [SSE] EventBus buffer check for ${sessionId}: ${bufferedEvents.length} events found`
        );

        // 버퍼된 이벤트가 있으면 전송
        if (bufferedEvents.length > 0) {
          console.log(
            `📤 [SSE] Sending ${bufferedEvents.length} buffered events from EventBus`
          );
          for (let i = 0; i < bufferedEvents.length; i++) {
            const event = bufferedEvents[i];
            try {
              console.log(
                `📨 [SSE] Buffered event ${i + 1}/${bufferedEvents.length}:`,
                {
                  type: event.type,
                  data:
                    event.type === "workflow_event"
                      ? {
                          stage: event.data?.stage,
                          substep: event.data?.substep,
                          status: event.data?.status,
                        }
                      : "other event type",
                }
              );
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            } catch (error) {
              console.error(
                `❌ [SSE] Failed to send buffered event ${i + 1}:`,
                error
              );
            }
          }
        }

        // EventEmitter 구독 - 해당 세션의 이벤트만 수신 (버퍼 재생 비활성화 - 이미 위에서 전송함)
        console.log(
          `🎯 [SSE] Setting up EventEmitter subscription for session ${sessionId}`
        );

        let unsubscribe: (() => void) | null = null;

        try {
          unsubscribe = workflowEventBus.subscribeToSession(
            sessionId,
            (payload: WorkflowEventPayload) => {
              try {
                console.log(
                  `📡 [SSE] EventEmitter fired for session ${sessionId}:`,
                  {
                    type: payload.type,
                    sessionMatch: payload.sessionId === sessionId,
                    dataKeys: Object.keys(payload.data || {}),
                  }
                );

                // 이벤트를 SSE 형식으로 변환하여 전송
                const sseMessage = `data: ${JSON.stringify(payload)}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));

                console.log(
                  `📨 [SSE] Successfully sent ${payload.type} event to client for session ${sessionId}`
                );

                // 최종 완료 상태 체크 - 더 확실한 조건 추가
                if (
                  payload.type === "workflow_event" &&
                  payload.data?.stage === "final_analysis" &&
                  payload.data?.substep === "prepare_report" &&
                  payload.data?.status === "completed"
                ) {
                  // 완료 메시지 전송 (연결은 유지)
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "completed",
                        sessionId,
                        message: "Analysis completed successfully",
                        timestamp: new Date().toISOString(),
                      })}\n\n`
                    )
                  );

                  console.log(
                    `✅ [SSE] Analysis completed for session ${sessionId}, completed event sent`
                  );
                  // 연결을 종료하지 않고 유지
                }

                // session_update에서도 완료 체크 (백업)
                if (
                  payload.type === "session_update" &&
                  payload.data?.status === "completed" &&
                  payload.data?.progress === 100
                ) {
                  // 완료 메시지 전송 (중복 방지를 위해 플래그 사용 필요)
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "completed",
                        sessionId,
                        message:
                          "Analysis completed successfully (from session_update)",
                        timestamp: new Date().toISOString(),
                      })}\n\n`
                    )
                  );

                  console.log(
                    `✅ [SSE] Session marked as completed for ${sessionId}`
                  );
                }
              } catch (error) {
                console.error(
                  `❌ [SSE] Error sending event for session ${sessionId}:`,
                  error
                );
                sendSSEError(controller, "Failed to send event", {
                  error: String(error),
                });
              }
            },
            false // 버퍼 재생 비활성화 (이미 위에서 수동으로 전송)
          );
        } catch (subscriptionError) {
          console.error(
            `❌ [SSE] Failed to subscribe to EventBus:`,
            subscriptionError
          );
          sendSSEError(controller, "Failed to subscribe to event stream", {
            error: String(subscriptionError),
          });
        }

        // 초기 데이터 로드 (기존 이벤트가 있을 경우)
        // 워크플로우가 이벤트를 기록할 시간을 주기 위해 약간의 지연 추가
        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
          // 현재 세션 상태 가져오기
          const { data: session, error: sessionError } = await supabase
            .schema("trademark_analysis")
            .from("analysis_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

          if (sessionError) {
            console.warn(`⚠️ [SSE] Failed to load session data:`, sessionError);
            sendSSEError(controller, "Failed to load session data", {
              error: sessionError.message,
            });
          } else if (session) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "session_update",
                  sessionId,
                  data: session,
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            );
          }

          // 기존 workflow_events 가져오기 (최근 50개)
          const { data: existingEvents, error: eventsError } = await supabase
            .schema("trademark_analysis")
            .from("workflow_events")
            .select("*")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true })
            .limit(50);

          if (eventsError) {
            console.warn(
              `⚠️ [SSE] Failed to load workflow events:`,
              eventsError
            );
            sendSSEError(controller, "Failed to load workflow events", {
              error: eventsError.message,
            });
          } else if (existingEvents && existingEvents.length > 0) {
            console.log(
              `📚 [SSE] Sending ${existingEvents.length} existing workflow events for session ${sessionId}`
            );

            for (const event of existingEvents) {
              try {
                const eventPayload = {
                  type: "workflow_event",
                  sessionId,
                  data: {
                    stage: event.stage,
                    substep: event.substep,
                    status: event.status,
                    started_at: event.started_at,
                    completed_at: event.completed_at,
                    event_data: event.event_data,
                    error_message: event.error_message,
                  },
                  timestamp: event.created_at,
                };

                console.log(
                  `📤 [SSE] Sending existing event: ${event.stage}/${event.substep} - ${event.status}`
                );

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(eventPayload)}\n\n`)
                );
              } catch (error) {
                console.error(`❌ [SSE] Failed to send existing event:`, error);
              }
            }
          } else {
            console.log(
              `⚠️ [SSE] No existing workflow events found for session ${sessionId}`
            );
          }

          // 기존 API 호출 로그 가져오기 (최근 20개)
          const { data: existingApiCalls, error: apiCallsError } =
            await supabase
              .schema("trademark_analysis")
              .from("api_call_logs")
              .select("*")
              .eq("session_id", sessionId)
              .order("request_timestamp", { ascending: true })
              .limit(20);

          if (apiCallsError) {
            console.warn(
              `⚠️ [SSE] Failed to load API call logs:`,
              apiCallsError
            );
          } else if (existingApiCalls && existingApiCalls.length > 0) {
            for (const call of existingApiCalls) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "api_call",
                      sessionId,
                      data: {
                        stage: call.stage,
                        api_type: call.api_type,
                        execution_time_ms: call.execution_time_ms,
                        tokens_used: call.tokens_used,
                        cost_estimate: call.cost_estimate,
                        error_message: call.error_message,
                        request_data: call.request_data,
                        response_data: call.response_data,
                      },
                      timestamp: call.request_timestamp,
                    })}\n\n`
                  )
                );
              } catch (error) {
                console.error(`❌ [SSE] Failed to send API call log:`, error);
              }
            }
          }

          // 기존 데이터 처리 로그 가져오기 (최근 20개)
          const { data: existingDataLogs, error: dataLogsError } =
            await supabase
              .schema("trademark_analysis")
              .from("data_processing_logs")
              .select("*")
              .eq("session_id", sessionId)
              .order("timestamp", { ascending: true })
              .limit(20);

          if (dataLogsError) {
            console.warn(
              `⚠️ [SSE] Failed to load data processing logs:`,
              dataLogsError
            );
          } else if (existingDataLogs && existingDataLogs.length > 0) {
            for (const log of existingDataLogs) {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "data_processing",
                      sessionId,
                      data: {
                        stage: log.stage,
                        process_type: log.process_type,
                        input_count: log.input_count,
                        output_count: log.output_count,
                        processing_details: log.processing_details,
                      },
                      timestamp: log.timestamp,
                    })}\n\n`
                  )
                );
              } catch (error) {
                console.error(
                  `❌ [SSE] Failed to send data processing log:`,
                  error
                );
              }
            }
          }

          console.log(`📚 [SSE] Sent initial data for session ${sessionId}`);
        } catch (error) {
          console.error(
            `❌ [SSE] Error loading initial data for session ${sessionId}:`,
            error
          );
          sendSSEError(controller, "Failed to load initial data", {
            error: String(error),
          });
        }

        // Heartbeat 메시지 (15초마다)
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "heartbeat",
                  sessionId,
                  timestamp: new Date().toISOString(),
                  serverTime: Date.now(),
                })}\n\n`
              )
            );
            console.log(`💓 [SSE] Heartbeat sent for session ${sessionId}`);
          } catch (error) {
            // 연결이 끊어진 경우
            console.log(
              `💔 [SSE] Failed to send heartbeat, clearing interval for session ${sessionId}`
            );
            clearInterval(heartbeat);
          }
        }, 15000);

        // 30분 후 자동 종료
        const timeout = setTimeout(() => {
          clearInterval(heartbeat);
          if (unsubscribe) unsubscribe();

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "timeout",
                sessionId,
                message: "Stream timeout after 30 minutes",
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          try {
            controller.close();
          } catch (e) {
            console.log(`⚠️ [SSE] Controller already closed`);
          }

          console.log(
            `⏱️ [SSE] Timeout, closing connection for session ${sessionId}`
          );
        }, 30 * 60 * 1000);

        // 클라이언트 연결 종료 감지
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();
          workflowEventBus.cleanupSession(sessionId);
          console.log(`👋 [SSE] Client disconnected for session ${sessionId}`);
        });
      } catch (criticalError) {
        console.error(`💥 [SSE] Critical error in SSE stream:`, criticalError);
        sendSSEError(controller, "Critical server error", {
          error: String(criticalError),
        });

        // 심각한 오류 시 스트림 종료
        setTimeout(() => {
          try {
            controller.close();
          } catch (e) {
            console.log(`⚠️ [SSE] Controller already closed`);
          }
        }, 1000);
      }
    },

    cancel() {
      console.log(`🛑 [SSE] Stream cancelled for session ${sessionId}`);
      workflowEventBus.cleanupSession(sessionId);
    },
  });

  return new Response(stream, { headers });
}
