/**
 * 완전한 3단계 플로우 통합 테스트 페이지
 * 
 * Stage 1 → Stage 2 → Stage 3 전체 플로우 테스트
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { ArrowRight, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SimplifiedResultsView } from '@/features/trademark-analysis/_components/simplified-results/SimplifiedResultsView';
import { 
  SimplifiedAnalysisResult, 
  Stage3ActionResult,
  AnalysisCriterion
} from '@/features/trademark-analysis/_types/simplified-types';

type FlowStep = 'setup' | 'stage1' | 'stage2' | 'stage3' | 'complete';
type TestScenario = 0 | 1 | 2; // 높음, 보통, 낮음

interface FlowState {
  currentStep: FlowStep;
  stage1Id?: string;
  stage2Id?: string;
  stage3Id?: string;
  analysisResult?: SimplifiedAnalysisResult;
  actionResult?: Stage3ActionResult;
  error?: string;
  isLoading: boolean;
}

const SCENARIO_NAMES = ['높은 가능성 (85%)', '보통 가능성 (65%)', '낮은 가능성 (25%)'];

export default function CompleteFlowTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(0);
  const [flowState, setFlowState] = useState<FlowState>({
    currentStep: 'setup',
    isLoading: false
  });

  // Step 1: Stage 1 테스트 데이터 생성
  const createStage1TestData = async () => {
    try {
      setFlowState(prev => ({ ...prev, isLoading: true, currentStep: 'stage1', error: undefined }));
      
      const response = await fetch(`/api/analysis/stage1/test-data?scenario=${selectedScenario}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Stage 1 데이터 생성 실패');
      }
      
      console.log('✅ Stage 1 데이터 생성 완료:', result);
      
      setFlowState(prev => ({
        ...prev,
        stage1Id: result.stage1Id,
        isLoading: false
      }));
      
      // 자동으로 Stage 2 실행
      setTimeout(() => executeStage2Analysis(result.stage1Id), 1000);
      
    } catch (error) {
      console.error('❌ Stage 1 오류:', error);
      setFlowState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        isLoading: false
      }));
    }
  };

  // Step 2: Stage 2 분석 실행
  const executeStage2Analysis = async (stage1Id: string) => {
    try {
      setFlowState(prev => ({ ...prev, isLoading: true, currentStep: 'stage2' }));
      
      const response = await fetch('/api/analysis/stage2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage1Id })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Stage 2 분석 실패');
      }
      
      console.log('✅ Stage 2 분석 완료:', result);
      
      setFlowState(prev => ({
        ...prev,
        stage2Id: result.stage2Id,
        analysisResult: result.analysisResult,
        isLoading: false,
        currentStep: 'stage3'
      }));
      
    } catch (error) {
      console.error('❌ Stage 2 오류:', error);
      setFlowState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        isLoading: false
      }));
    }
  };

  // Stage 3 액션 처리
  const handleStage3Action = (result: Stage3ActionResult) => {
    console.log('✅ Stage 3 액션 완료:', result);
    setFlowState(prev => ({
      ...prev,
      actionResult: result,
      currentStep: 'complete'
    }));
  };

  // 플로우 재시작
  const resetFlow = () => {
    setFlowState({
      currentStep: 'setup',
      isLoading: false
    });
  };

  // 진행률 계산
  const getProgress = () => {
    switch (flowState.currentStep) {
      case 'setup': return 0;
      case 'stage1': return 25;
      case 'stage2': return 50;
      case 'stage3': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // 단계별 아이콘
  const getStepIcon = (step: FlowStep) => {
    if (flowState.error && flowState.currentStep === step) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (flowState.isLoading && flowState.currentStep === step) {
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
    if (getProgress() > getStepProgress(step)) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepProgress = (step: FlowStep) => {
    switch (step) {
      case 'setup': return 0;
      case 'stage1': return 25;
      case 'stage2': return 50;
      case 'stage3': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // Stage 3 결과 화면
  if (flowState.currentStep === 'stage3' && flowState.analysisResult && flowState.stage2Id) {
    return (
      <SimplifiedResultsView
        stage2Id={flowState.stage2Id}
        trademarkName={flowState.analysisResult?.trademarkName || ""}
        businessDescription={""}
        onApply={handleStage3Action}
        onConsult={handleStage3Action}
        onBack={() => setFlowState(prev => ({ ...prev, currentStep: 'stage2' }))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            🧪 완전한 3단계 플로우 테스트
          </h1>
          <p className="text-gray-600">
            Stage 1 → Stage 2 → Stage 3 전체 플로우를 테스트합니다
          </p>
        </div>

        {/* 진행률 표시 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>진행 상황</span>
              <Badge variant="outline">{getProgress()}% 완료</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={getProgress()} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {getStepIcon('setup')}
                <span className={flowState.currentStep === 'setup' ? 'font-medium' : 'text-gray-500'}>
                  설정
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStepIcon('stage1')}
                <span className={flowState.currentStep === 'stage1' ? 'font-medium' : 'text-gray-500'}>
                  Stage 1
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStepIcon('stage2')}
                <span className={flowState.currentStep === 'stage2' ? 'font-medium' : 'text-gray-500'}>
                  Stage 2
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStepIcon('stage3')}
                <span className={flowState.currentStep === 'stage3' ? 'font-medium' : 'text-gray-500'}>
                  Stage 3
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 설정 단계 */}
        {flowState.currentStep === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle>테스트 시나리오 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SCENARIO_NAMES.map((name, index) => (
                  <Button
                    key={index}
                    variant={selectedScenario === index ? "default" : "outline"}
                    onClick={() => setSelectedScenario(index as TestScenario)}
                    className="h-auto p-4 flex flex-col items-center"
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-xs opacity-75 mt-1">
                      시나리오 {index}
                    </span>
                  </Button>
                ))}
              </div>
              
              <div className="flex justify-center pt-4">
                <Button onClick={createStage1TestData} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  플로우 시작하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 로딩 중 또는 결과 표시 */}
        {(flowState.currentStep === 'stage1' || flowState.currentStep === 'stage2') && (
          <Card>
            <CardHeader>
              <CardTitle>
                {flowState.currentStep === 'stage1' ? 'Stage 1 데이터 생성 중...' : 'Stage 2 분석 실행 중...'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              {flowState.isLoading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-gray-600">
                    {flowState.currentStep === 'stage1' 
                      ? '테스트 데이터를 생성하고 있습니다...'
                      : 'LangGraph 워크플로우를 실행하고 있습니다...'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-green-600 font-medium">
                    {flowState.currentStep === 'stage1' ? 'Stage 1 완료' : 'Stage 2 완료'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 완료 화면 */}
        {flowState.currentStep === 'complete' && flowState.actionResult && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                🎉 전체 플로우 완료!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">최종 액션 결과</h4>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(flowState.actionResult, null, 2)}
                </pre>
              </div>
              
              <div className="flex justify-center space-x-3">
                <Button onClick={resetFlow} variant="outline">
                  다시 테스트하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 에러 표시 */}
        {flowState.error && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                오류 발생
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-700">{flowState.error}</p>
              <Button onClick={resetFlow} variant="outline">
                처음부터 다시 시작
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 개발자용 상태 정보 */}
        <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-3 rounded-lg max-w-sm">
          <p className="font-bold mb-1">🔍 Flow State</p>
          <p>Step: {flowState.currentStep}</p>
          <p>Scenario: {SCENARIO_NAMES[selectedScenario]}</p>
          {flowState.stage1Id && <p>Stage1 ID: {flowState.stage1Id.slice(0, 8)}...</p>}
          {flowState.stage2Id && <p>Stage2 ID: {flowState.stage2Id.slice(0, 8)}...</p>}
          <p>Loading: {flowState.isLoading ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}