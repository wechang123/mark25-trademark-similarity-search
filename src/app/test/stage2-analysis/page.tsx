'use client';

/**
 * Stage 2 분석 테스트 페이지
 * 
 * LangGraph 기반 Stage 2 분석 플로우 테스트
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { SimplifiedResultsView } from '@/features/trademark-analysis/_components/simplified-results';
import { SimplifiedAnalysisResult } from '@/features/trademark-analysis/_types/simplified-types';

interface TestScenario {
  index: number;
  name: string;
  trademarkName: string;
  description: string;
}

interface AnalysisState {
  status: 'idle' | 'creating-stage1' | 'running-stage2' | 'completed' | 'error';
  stage1Id?: string;
  stage2Id?: string;
  error?: string;
  result?: SimplifiedAnalysisResult;
  processingTime?: number;
}

export default function Stage2AnalysisTestPage() {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<number>(0);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle' });
  const [showDetails, setShowDetails] = useState(false);

  // 시나리오 목록 로드
  const loadScenarios = async () => {
    try {
      const response = await fetch('/api/analysis/stage1/test-data');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios);
      }
    } catch (error) {
      console.error('시나리오 로드 실패:', error);
    }
  };

  // 페이지 로드 시 시나리오 로드
  React.useEffect(() => {
    loadScenarios();
  }, []);

  // Stage 2 분석 시작
  const startAnalysis = async () => {
    setAnalysisState({ status: 'creating-stage1' });

    try {
      // 1. Stage 1 테스트 데이터 생성
      console.log('🧪 Creating Stage 1 test data...');
      const stage1Response = await fetch(`/api/analysis/stage1/test-data?scenario=${selectedScenario}`, {
        method: 'POST'
      });

      if (!stage1Response.ok) {
        throw new Error('Stage 1 데이터 생성 실패');
      }

      const stage1Data = await stage1Response.json();
      console.log('✅ Stage 1 data created:', stage1Data);

      setAnalysisState(prev => ({ 
        ...prev, 
        status: 'running-stage2',
        stage1Id: stage1Data.stage1Id 
      }));

      // 2. Stage 2 분석 실행
      console.log('🚀 Starting Stage 2 analysis...');
      const stage2Response = await fetch('/api/analysis/stage2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stage1Id: stage1Data.stage1Id,
          userId: 'test-user',
          trademarkName: stage1Data.testData.trademarkName,
          trademarkType: stage1Data.testData.trademarkType,
          businessDescription: stage1Data.testData.businessDescription,
          analysisDepth: 'comprehensive'
        })
      });

      if (!stage2Response.ok) {
        const errorData = await stage2Response.json();
        throw new Error(errorData.error || 'Stage 2 분석 실패');
      }

      const stage2Data = await stage2Response.json();
      console.log('✅ Stage 2 analysis completed:', stage2Data);

      setAnalysisState({
        status: 'completed',
        stage1Id: stage1Data.stage1Id,
        stage2Id: stage2Data.stage2Id,
        result: stage2Data.analysisResult,
        processingTime: stage2Data.processingTimeMs
      });

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setAnalysisState({
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  };

  // 분석 초기화
  const resetAnalysis = () => {
    setAnalysisState({ status: 'idle' });
    setShowDetails(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Stage 2 분석 테스트</h1>
              <p className="text-sm text-muted-foreground">
                LangGraph 기반 종합 상표 분석 플로우 테스트
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Phase 3
              </Badge>
              <Badge variant="secondary" className="text-xs">
                LangGraph v3.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-6xl">
        {analysisState.status === 'idle' && (
          <div className="space-y-6">
            {/* 시나리오 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>테스트 시나리오 선택</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scenarios.map((scenario, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        index === selectedScenario 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedScenario(index)}
                    >
                      <h3 className="font-medium">{scenario.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{scenario.trademarkName}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {scenario.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    size="lg"
                    onClick={startAnalysis}
                    disabled={scenarios.length === 0}
                  >
                    🚀 Stage 2 분석 시작
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 분석 진행 중 */}
        {(analysisState.status === 'creating-stage1' || analysisState.status === 'running-stage2') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⚡</span>
                <span>분석 진행 중</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    analysisState.status === 'creating-stage1' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                  }`} />
                  <span className="text-sm">Stage 1 테스트 데이터 생성</span>
                  {analysisState.stage1Id && (
                    <Badge variant="outline" className="text-xs">
                      {analysisState.stage1Id.slice(0, 8)}...
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    analysisState.status === 'running-stage2' ? 'bg-blue-500 animate-pulse' : 
                    analysisState.stage2Id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm">LangGraph 워크플로우 실행</span>
                  {analysisState.stage2Id && (
                    <Badge variant="outline" className="text-xs">
                      {analysisState.stage2Id.slice(0, 8)}...
                    </Badge>
                  )}
                </div>
              </div>

              <Progress value={analysisState.status === 'creating-stage1' ? 30 : 70} />
              
              <p className="text-sm text-gray-600 text-center">
                {analysisState.status === 'creating-stage1' 
                  ? '테스트 데이터를 생성하고 있습니다...' 
                  : 'KIPRIS 검색 및 AI 분석을 실행하고 있습니다... (최대 3분 소요)'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* 분석 완료 */}
        {analysisState.status === 'completed' && analysisState.result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>분석 완료</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? '세부사항 숨김' : '세부사항 표시'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetAnalysis}>
                      다시 테스트
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Stage 1 ID:</span>
                    <div className="font-mono">{analysisState.stage1Id?.slice(0, 12)}...</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Stage 2 ID:</span>
                    <div className="font-mono">{analysisState.stage2Id?.slice(0, 12)}...</div>
                  </div>
                  <div>
                    <span className="text-gray-500">처리 시간:</span>
                    <div>{Math.round((analysisState.processingTime || 0) / 1000)}초</div>
                  </div>
                  <div>
                    <span className="text-gray-500">등록 가능성:</span>
                    <div className="font-bold">{analysisState.result.registrationProbability}%</div>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">분석 세부 결과</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>유사군 코드 적합성:</strong> {analysisState.result.analysis.codeCompatibility.score}점
                        <br />
                        <span className="text-xs text-gray-600">
                          {analysisState.result.analysis.codeCompatibility.description}
                        </span>
                      </div>
                      <div>
                        <strong>상표 식별력:</strong> {analysisState.result.analysis.distinctiveness.score}점
                        <br />
                        <span className="text-xs text-gray-600">
                          {analysisState.result.analysis.distinctiveness.description}
                        </span>
                      </div>
                      <div>
                        <strong>선행상표 유사도:</strong> {analysisState.result.analysis.priorSimilarity.score}점
                        <br />
                        <span className="text-xs text-gray-600">
                          {analysisState.result.analysis.priorSimilarity.description}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 결과 화면 미리보기 */}
            <SimplifiedResultsView
              stage2Id={analysisState.stage2Id || 'test-stage2'}
              trademarkName={analysisState.result?.trademarkName || ''}
              businessDescription={''}
              onApply={() => alert('출원하기 테스트')}
              onConsult={() => alert('전문가 상담 테스트')}
              onBack={() => resetAnalysis()}
              onPDFDownload={() => alert('PDF 다운로드 테스트')}
            />
          </div>
        )}

        {/* 오류 상태 */}
        {analysisState.status === 'error' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <span>❌</span>
                <span>분석 실패</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-red-600 mb-4">
                {analysisState.error}
              </div>
              <Button onClick={resetAnalysis}>
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}