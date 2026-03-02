'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, Zap, BarChart3, Target, Layers, TrendingUp } from 'lucide-react';

// Enhanced interface for new API response structure
interface GoodsClassifierAnalysis {
  primary_classification: {
    classCode: string;
    className: string;
    description: string;
    confidence: number;
  };
  alternative_classifications: Array<{
    classCode: string;
    className: string;
    description: string;
    confidence: number;
    reason: string;
  }>;
  similar_group_codes: Array<{
    code: string;
    description: string;
    products: string[];
    relevance: number;
  }>;
  related_products: Array<{
    productName: string;
    classCode: string;
    similarGroupCode: string;
    similarityScore: number;
  }>;
  recommendations: {
    strategy: string;
    multiClassFiling: boolean;
    riskAssessment: string;
    suggestedProducts: string[];
  };
  analysis_metadata: {
    dataSource: string;
    searchQueries: number;
    totalResults: number;
    confidence: number;
    executionTime: number;
  };
}

interface PerformanceAnalysis {
  execution_time_ms: number;
  execution_time_breakdown: {
    goods_classifier_node: number;
    api_overhead: number;
  };
  data_quality_metrics: {
    total_products_found: number;
    unique_similar_groups: number;
    primary_confidence: number;
    average_similarity_score: number;
    has_alternative_classification: boolean;
  };
  rag_engine_metrics: {
    data_source: string;
    search_queries_executed: number;
    total_rag_results: number;
    rag_confidence: number;
  };
}

interface EnhancedTestResponse {
  status: string;
  executionTime: number;
  data?: {
    summary: string;
    primary_recommendation: any;
    secondary_recommendation: any;
    professional_advice: string;
  };
  goods_classifier_analysis?: GoodsClassifierAnalysis;
  performance_analysis?: PerformanceAnalysis;
  message?: string;
  error?: string;
  metadata?: {
    timestamp: string;
    session_id: string;
    node_version: string;
    rag_engine_version: string;
    total_conversation_messages: number;
    has_errors: boolean;
    workflow_status: string;
  };
  scoring_system?: {
    primary_confidence: number;
    primary_relevance: number;
    secondary_confidence: number;
    similarity_scores: number[];
    data_source: string;
  };
}

export default function EnhancedRAGEngineTestPage() {
  const [businessDescription, setBusinessDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [result, setResult] = useState<EnhancedTestResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const handleHealthCheck = async () => {
    setHealthChecking(true);
    setHealthStatus(null);

    try {
      const response = await fetch('/api/admin/test-rag', {
        method: 'GET'
      });

      const data = await response.json();
      setHealthStatus({
        status: data.status === 'available' ? 'healthy' : 'error',
        executionTime: 0,
        error: data.status === 'available' ? undefined : data.error,
        config: data.config
      });
    } catch (error) {
      setHealthStatus({
        status: 'error',
        executionTime: 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setHealthChecking(false);
    }
  };

  const handleAnalyze = async () => {
    if (!businessDescription.trim()) {
      alert('사업 설명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessDescription: businessDescription.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          status: 'success',
          executionTime: data.executionTime,
          data: {
            summary: data.summary,
            primary_recommendation: data.primary_recommendation,
            secondary_recommendation: data.secondary_recommendation,
            professional_advice: data.professional_advice
          },
          goods_classifier_analysis: data.goods_classifier_analysis,
          performance_analysis: data.performance_analysis,
          metadata: data.metadata,
          scoring_system: data.scoring_system
        });
      } else {
        setResult({
          status: 'error',
          executionTime: data.executionTime || 0,
          error: data.error
        });
      }
    } catch (error) {
      setResult({
        status: 'error',
        executionTime: 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "온라인에서 수제 비누를 만들어서 판매하는 사업을 하고 있습니다. 비누 외에도 입욕제나 바디 스크럽 같은 목욕용품도 함께 판매할 예정입니다.",
    "모바일 앱을 통해 헬스케어 상담 서비스를 제공하고 있습니다. AI를 활용한 건강 분석과 개인 맞춤형 운동 프로그램을 제공합니다.",
    "친환경 포장재를 제조하는 회사입니다. 종이와 바이오플라스틱을 이용한 포장용품을 생산하여 식품업계에 공급하고 있습니다.",
    "온라인 교육 플랫폼을 운영하며 프로그래밍과 디자인 강의를 제공합니다. 라이브 코딩 세션과 1:1 멘토링 서비스도 함께 운영합니다."
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🚀 Enhanced RAG Engine + Goods Classifier</h1>
        <p className="text-gray-600">
          완전한 성능 분석과 심화 결과를 포함한 상품 분류 테스트 시스템
        </p>
      </div>

      {/* Health Check Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            시스템 상태 확인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleHealthCheck}
              disabled={healthChecking}
              variant="outline"
            >
              {healthChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  검사 중...
                </>
              ) : (
                '헬스 체크'
              )}
            </Button>

            {healthStatus && (
              <div className="flex items-center gap-2">
                {healthStatus.status === 'healthy' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">정상 작동</span>
                    <Badge variant="secondary">Ready</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 font-medium">
                      {healthStatus.error || '오류 발생'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Test Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>📝 사업 설명 입력</CardTitle>
            <CardDescription>
              상표 출원을 위한 사업 설명을 입력하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="예: 온라인에서 수제 비누를 만들어서 판매하는 사업을 하고 있습니다..."
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              rows={6}
              className="resize-none"
            />

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">예시 사업 설명:</p>
              <div className="grid gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setBusinessDescription(example)}
                    className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !businessDescription.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  완전 분석 중...
                </>
              ) : (
                '🎯 Enhanced 분석 시작'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">Goods Classifier + RAG Engine 분석 중...</p>
                  <p className="text-sm text-gray-500 mt-2">완전한 성능 분석과 품질 지표를 생성하고 있습니다</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && result.status === 'error' && (
            <Card>
              <CardContent className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-700">오류 발생</span>
                </div>
                <p className="text-red-600 text-sm">{result.error}</p>
              </CardContent>
            </Card>
          )}

          {result && result.status === 'success' && (
            <>
              {/* Performance Overview Dashboard */}
              {result.performance_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      📊 성능 대시보드
                    </CardTitle>
                    <CardDescription>
                      실행시간 분해, 데이터 품질, RAG 엔진 메트릭
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.performance_analysis.execution_time_ms}ms
                        </div>
                        <p className="text-xs text-blue-700 font-medium">총 실행시간</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {result.performance_analysis.data_quality_metrics.total_products_found}
                        </div>
                        <p className="text-xs text-green-700 font-medium">추천 상품</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {(result.performance_analysis.data_quality_metrics.primary_confidence * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-purple-700 font-medium">주요분류 신뢰도</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {result.performance_analysis.data_quality_metrics.unique_similar_groups}
                        </div>
                        <p className="text-xs text-orange-700 font-medium">유사군 코드</p>
                      </div>
                    </div>

                    {/* Execution Time Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">⏱️ 실행시간 분해</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Goods Classifier</span>
                            <span className="font-mono text-sm font-semibold text-blue-600">
                              {result.performance_analysis.execution_time_breakdown.goods_classifier_node}ms
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">API Overhead</span>
                            <span className="font-mono text-sm text-gray-600">
                              {result.performance_analysis.execution_time_breakdown.api_overhead}ms
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">🎯 품질 지표</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">평균 유사도</span>
                            <span className="font-semibold text-green-600">
                              {(result.performance_analysis.data_quality_metrics.average_similarity_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">대안 분류</span>
                            <Badge variant={result.performance_analysis.data_quality_metrics.has_alternative_classification ? "default" : "secondary"}>
                              {result.performance_analysis.data_quality_metrics.has_alternative_classification ? "있음" : "없음"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RAG Engine Original Results */}
              {result.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      🔍 RAG Engine 원본 응답
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <div>
                      <h3 className="font-semibold mb-2">📋 요약</h3>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {result.data.summary}
                      </p>
                    </div>

                    {/* Primary Recommendation */}
                    <div>
                      <h3 className="font-semibold mb-2">🎯 주요 추천</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <div className="flex gap-2">
                          <Badge variant="default">
                            {result.data.primary_recommendation.analysis.class_code}류
                          </Badge>
                          <Badge variant="outline">
                            {result.data.primary_recommendation.analysis.similar_group_code}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700">
                          <strong>분류:</strong> {result.data.primary_recommendation.analysis.business_type}
                        </p>
                        <p className="text-sm text-blue-700">
                          <strong>이유:</strong> {result.data.primary_recommendation.analysis.reason}
                        </p>
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-2">추천 지정상품 (상위 10개):</p>
                          <div className="grid grid-cols-2 gap-1">
                            {result.data.primary_recommendation.recommended_products.map((product: string, idx: number) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                                {product}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Recommendation */}
                    {result.data.secondary_recommendation && (
                      <div>
                        <h3 className="font-semibold mb-2">🔄 차선책 추천</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {result.data.secondary_recommendation.analysis.class_code}류
                            </Badge>
                            <Badge variant="outline">
                              {result.data.secondary_recommendation.analysis.similar_group_code}
                            </Badge>
                          </div>
                          <p className="text-sm text-yellow-700">
                            <strong>분류:</strong> {result.data.secondary_recommendation.analysis.business_type}
                          </p>
                          <p className="text-sm text-yellow-700">
                            <strong>이유:</strong> {result.data.secondary_recommendation.analysis.reason}
                          </p>
                          <div>
                            <p className="text-sm font-medium text-yellow-800 mb-2">추천 지정상품:</p>
                            <div className="grid grid-cols-2 gap-1">
                              {result.data.secondary_recommendation.recommended_products.map((product: string, idx: number) => (
                                <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                                  {product}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Professional Advice */}
                    <div>
                      <h3 className="font-semibold mb-2">💡 전문가 조언</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 leading-relaxed">
                          {result.data.professional_advice}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Goods Classifier Analysis */}
              {result.goods_classifier_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-500" />
                      🔬 Goods Classifier 심화 분석
                    </CardTitle>
                    <CardDescription>
                      내부 분류 엔진의 상세 결과와 유사도 점수
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Analysis Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">데이터 소스</p>
                        <p className="text-sm font-semibold">{result.goods_classifier_analysis.analysis_metadata.dataSource}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">검색 쿼리</p>
                        <p className="text-sm font-semibold">{result.goods_classifier_analysis.analysis_metadata.searchQueries}개</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">총 결과</p>
                        <p className="text-sm font-semibold">{result.goods_classifier_analysis.analysis_metadata.totalResults}개</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">처리시간</p>
                        <p className="text-sm font-semibold">{result.goods_classifier_analysis.analysis_metadata.executionTime}ms</p>
                      </div>
                    </div>

                    {/* Similar Group Codes Detail */}
                    {result.goods_classifier_analysis.similar_group_codes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">🏷️ 유사군 코드 상세 분석</h4>
                        <div className="space-y-3">
                          {result.goods_classifier_analysis.similar_group_codes.map((sg, idx) => (
                            <div key={idx} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="font-mono text-sm">{sg.code}</Badge>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">연관성</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${sg.relevance * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-blue-600">
                                    {(sg.relevance * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{sg.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {sg.products.slice(0, 8).map((product, pidx) => (
                                  <span key={pidx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {product}
                                  </span>
                                ))}
                                {sg.products.length > 8 && (
                                  <span className="text-xs text-gray-500">+{sg.products.length - 8}개 더</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Products with Similarity Scores */}
                    {result.goods_classifier_analysis.related_products.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">🛍️ 관련 상품 (유사도 점수 포함)</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                          {result.goods_classifier_analysis.related_products.slice(0, 20).map((product, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded bg-white hover:bg-gray-50">
                              <span className="text-sm font-medium truncate flex-1">{product.productName}</span>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-xs">
                                  {product.classCode}류
                                </Badge>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {product.similarGroupCode}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full"
                                      style={{ width: `${product.similarityScore * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-green-600 w-10">
                                    {(product.similarityScore * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strategy Recommendations */}
                    <div>
                      <h4 className="font-semibold mb-3">📋 출원 전략 분석</h4>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-indigo-800 mb-1">추천 전략</p>
                            <p className="text-sm text-indigo-700">{result.goods_classifier_analysis.recommendations.strategy}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-indigo-800 mb-1">위험도 평가</p>
                            <Badge variant="secondary" className="text-indigo-700">
                              {result.goods_classifier_analysis.recommendations.riskAssessment}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-indigo-800 mb-1">다중 분류 출원</p>
                            <Badge variant={result.goods_classifier_analysis.recommendations.multiClassFiling ? "default" : "secondary"}>
                              {result.goods_classifier_analysis.recommendations.multiClassFiling ? "권장" : "불필요"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-indigo-800 mb-1">추천 상품 수</p>
                            <span className="text-sm font-semibold text-indigo-700">
                              {result.goods_classifier_analysis.recommendations.suggestedProducts.length}개
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Scoring System */}
              {result.scoring_system && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      📈 고급 점수 시스템
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-purple-700 mb-3">주요 추천 지표</p>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">신뢰도</span>
                              <span className="text-xs font-semibold">{(result.scoring_system.primary_confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${result.scoring_system.primary_confidence * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">연관성</span>
                              <span className="text-xs font-semibold">{(result.scoring_system.primary_relevance * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${result.scoring_system.primary_relevance * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {result.scoring_system.secondary_confidence > 0 && (
                        <div>
                          <p className="text-sm font-medium text-purple-700 mb-3">차선책 지표</p>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">신뢰도</span>
                              <span className="text-xs font-semibold">{(result.scoring_system.secondary_confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-yellow-200 rounded-full h-2">
                              <div
                                className="bg-yellow-600 h-2 rounded-full"
                                style={{ width: `${result.scoring_system.secondary_confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-purple-700 mb-3">상위 10개 상품 유사도 분포</p>
                      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {result.scoring_system.similarity_scores.map((score, idx) => (
                          <div key={idx} className="text-center">
                            <div className="w-full bg-purple-200 rounded-full h-2 mb-1">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-purple-600 font-mono">
                              {(score * 100).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-600 text-center">
                        평균: {(result.scoring_system.similarity_scores.reduce((a, b) => a + b, 0) / result.scoring_system.similarity_scores.length * 100).toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Metadata */}
              {result.metadata && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">🛠️ 시스템 메타데이터</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-600 mb-1">세션 ID</p>
                        <p className="font-mono text-gray-800 break-all">{result.metadata.session_id.slice(0, 16)}...</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">노드 버전</p>
                        <Badge variant="outline" className="text-xs">{result.metadata.node_version}</Badge>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">워크플로우 상태</p>
                        <Badge variant={result.metadata.workflow_status === 'completed' ? 'default' : 'secondary'}>
                          {result.metadata.workflow_status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">대화 메시지</p>
                        <p className="font-semibold">{result.metadata.total_conversation_messages}개</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!loading && !result && (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <div className="space-y-2">
                  <p className="text-lg">사업 설명을 입력하고 완전한 분석을 시작하세요</p>
                  <p className="text-sm">성능 지표, 품질 분석, 심화 결과를 모두 확인할 수 있습니다</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}