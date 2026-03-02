"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  WorkflowSnapshotClientService,
  type WorkflowSnapshot,
} from "@/features/admin-debug-console/_services/workflow-snapshot-client-service";
import {
  ArrowLeft,
  Copy,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAdminAuth } from "@/features/admin-dashboard/_hooks/useAdminAuth";

const snapshotService = new WorkflowSnapshotClientService();

export default function SnapshotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin, isManager, loading: authLoading } = useAdminAuth();
  const [snapshot, setSnapshot] = useState<WorkflowSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stages" | "api" | "data" | "raw">(
    "stages"
  );
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // 권한 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    } else if (!authLoading && !(isAdmin() || isManager())) {
      router.push("/dashboard");
    }
  }, [authLoading, user, isAdmin, isManager, router]);

  useEffect(() => {
    const loadSnapshot = async () => {
      if (!params.id || typeof params.id !== "string") return;
      if (!user || !(isAdmin() || isManager())) return;

      setLoading(true);
      try {
        const data = await snapshotService.getSnapshot(params.id);
        setSnapshot(data);
      } catch (error) {
        console.error("Failed to load snapshot:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, [params.id, user, isAdmin, isManager]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const downloadAsJSON = () => {
    if (!snapshot) return;

    const blob = new Blob([JSON.stringify(snapshot.snapshot_data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-snapshot-${snapshot.session_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 권한 체크 중 또는 인증 로딩 중
  if (authLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-gray-400">권한 확인 중...</div>
      </div>
    );
  }

  // 권한이 없는 경우
  if (!user || !(isAdmin() || isManager())) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">
          이 페이지에 접근할 권한이 없습니다.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">
          스냅샷을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const data = snapshot.snapshot_data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              돌아가기
            </button>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">
              워크플로우 분석 상세
            </h1>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>
                상표명:{" "}
                <span className="text-gray-900 font-medium">
                  {snapshot.trademark_name}
                </span>
              </span>
              <span>
                분석일시:{" "}
                {snapshot.created_at
                  ? new Date(snapshot.created_at).toLocaleString("ko-KR")
                  : "N/A"}
              </span>
              <span>세션 ID: {snapshot.session_id}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(snapshot.session_id)}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Copy size={16} />
              세션 ID 복사
            </button>
            <button
              onClick={downloadAsJSON}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} />
              JSON 다운로드
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">총 토큰 사용량</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.totalTokens?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">총 실행 시간</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.totalExecutionTime
                ? `${(data.totalExecutionTime / 1000).toFixed(1)}s`
                : "-"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">총 비용</div>
            <div className="text-2xl font-bold text-gray-900">
              ${data.totalCost?.toFixed(4) || "0.0000"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">API 호출 수</div>
            <div className="text-2xl font-bold text-gray-900">
              {data.apiCalls?.length || 0}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("stages")}
            className={`px-4 py-2 ${
              activeTab === "stages"
                ? "border-b-2 border-blue-500 text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            스테이지 진행
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-4 py-2 ${
              activeTab === "api"
                ? "border-b-2 border-blue-500 text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            API 호출 내역
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-2 ${
              activeTab === "data"
                ? "border-b-2 border-blue-500 text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            데이터 처리
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-2 ${
              activeTab === "raw"
                ? "border-b-2 border-blue-500 text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            RAW 데이터
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg p-6 min-h-[500px] border border-gray-200">
          {activeTab === "stages" && (
            <div className="space-y-4">
              {data.stages?.map((stage: any, idx: number) => {
                const stageId = `stage-${idx}`;
                const isExpanded = expandedStages.has(stageId);

                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Stage Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleStageExpansion(stageId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Expand/Collapse Icon */}
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}

                          {/* Status Icon */}
                          {stage.status === "completed" && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {stage.status === "processing" && (
                            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                          )}
                          {stage.status === "failed" && (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          {stage.status === "pending" && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}

                          {/* Stage Name */}
                          <h3 className="text-base font-semibold text-gray-900">
                            {stage.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Execution Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {stage.executionTime && (
                              <span>{stage.executionTime}ms</span>
                            )}
                            {stage.tokensUsed && (
                              <span>{stage.tokensUsed} tokens</span>
                            )}
                            {stage.cost && (
                              <span>${stage.cost.toFixed(4)}</span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium text-white ${
                              stage.status === "completed"
                                ? "bg-green-600"
                                : stage.status === "failed"
                                ? "bg-red-600"
                                : stage.status === "processing"
                                ? "bg-yellow-600"
                                : "bg-gray-500"
                            }`}
                          >
                            {stage.status}
                          </span>

                          {/* Comment Button */}
                          {stage.comments && stage.comments.length > 0 && (
                            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                              <MessageSquare className="w-4 h-4" />
                              <span>{stage.comments.length}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200">
                        {/* Substeps */}
                        {stage.substeps && stage.substeps.length > 0 && (
                          <div className="p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              세부 단계
                            </h4>
                            {stage.substeps.map(
                              (substep: any, subIdx: number) => (
                                <div
                                  key={subIdx}
                                  className="pl-6 border-l-2 border-gray-200"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      {substep.status === "completed" && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      )}
                                      {substep.status === "processing" && (
                                        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                      )}
                                      {substep.status === "failed" && (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                      )}
                                      {substep.status === "pending" && (
                                        <Clock className="w-4 h-4 text-gray-400" />
                                      )}
                                      <span className="text-sm text-gray-700">
                                        {substep.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      {substep.data?.executionTime && (
                                        <span>
                                          {substep.data.executionTime}ms
                                        </span>
                                      )}
                                      {substep.data?.tokensUsed && (
                                        <span>
                                          {substep.data.tokensUsed} tokens
                                        </span>
                                      )}
                                      {substep.data?.cost && (
                                        <span>
                                          ${substep.data.cost.toFixed(4)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Substep Data */}
                                  {substep.data &&
                                    (substep.data.request ||
                                      substep.data.response) && (
                                      <div className="mt-2 space-y-2">
                                        {substep.data.request && (
                                          <details className="text-xs">
                                            <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700">
                                              📤 Request Data
                                            </summary>
                                            <pre className="mt-2 p-3 bg-gray-50 rounded overflow-x-auto max-h-40 text-gray-700">
                                              <code>
                                                {JSON.stringify(
                                                  substep.data.request,
                                                  null,
                                                  2
                                                )}
                                              </code>
                                            </pre>
                                          </details>
                                        )}
                                        {substep.data.response && (
                                          <details className="text-xs">
                                            <summary className="cursor-pointer font-medium text-green-600 hover:text-green-700">
                                              📥 Response Data
                                            </summary>
                                            <pre className="mt-2 p-3 bg-gray-50 rounded overflow-x-auto max-h-40 text-gray-700">
                                              <code>
                                                {JSON.stringify(
                                                  substep.data.response,
                                                  null,
                                                  2
                                                )}
                                              </code>
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    )}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* Comments Section */}
                        {stage.comments && stage.comments.length > 0 && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              코멘트
                            </h4>
                            <div className="space-y-2">
                              {stage.comments.map(
                                (comment: any, cIdx: number) => (
                                  <div
                                    key={cIdx}
                                    className="bg-white p-3 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {comment.author || "Admin"}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {comment.timestamp ||
                                          new Date().toLocaleString("ko-KR")}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {comment.text}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* API Calls */}
                        {stage.apiCalls && stage.apiCalls.length > 0 && (
                          <div className="p-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              API 호출 내역
                            </h4>
                            <div className="space-y-2">
                              {stage.apiCalls.map(
                                (call: any, callIdx: number) => (
                                  <div
                                    key={callIdx}
                                    className="text-xs bg-gray-50 p-2 rounded"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-gray-700">
                                        {call.api_type}
                                      </span>
                                      <div className="flex gap-3 text-gray-500">
                                        {call.execution_time_ms && (
                                          <span>
                                            {call.execution_time_ms}ms
                                          </span>
                                        )}
                                        {call.tokens_used && (
                                          <span>{call.tokens_used} tokens</span>
                                        )}
                                        {call.cost_estimate && (
                                          <span>
                                            ${call.cost_estimate.toFixed(4)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "api" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-700">시간</th>
                    <th className="px-4 py-2 text-left text-gray-700">
                      스테이지
                    </th>
                    <th className="px-4 py-2 text-left text-gray-700">
                      API 유형
                    </th>
                    <th className="px-4 py-2 text-left text-gray-700">
                      실행 시간
                    </th>
                    <th className="px-4 py-2 text-left text-gray-700">토큰</th>
                    <th className="px-4 py-2 text-left text-gray-700">비용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.apiCalls?.map((call: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(call.timestamp).toLocaleTimeString("ko-KR")}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {call.stage}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {call.api_type}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {call.execution_time_ms
                          ? `${call.execution_time_ms}ms`
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {call.tokens_used || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {call.cost_estimate
                          ? `$${call.cost_estimate.toFixed(4)}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              {data.dataProcessingLogs?.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">
                      {log.operation}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString("ko-KR")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    입력: {log.input_size} → 출력: {log.output_size}
                  </div>
                  {log.details && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-700">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "raw" && (
            <pre className="text-xs overflow-auto text-gray-700 bg-gray-50 p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
