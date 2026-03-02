'use client';

/**
 * 간소화된 결과 화면 테스트 페이지
 */

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { SimplifiedResultsView, StageProgress } from '@/features/trademark-analysis/_components/simplified-results';
import { createDummyAnalysisResult } from '@/features/trademark-analysis/_utils/analysis-data-mapper';

const TEST_SCENARIOS = [
  {
    name: '높은 가능성 (85%)',
    data: createDummyAnalysisResult('우수상표', 85)
  },
  {
    name: '보통 가능성 (65%)', 
    data: createDummyAnalysisResult('일반상표', 65)
  },
  {
    name: '낮은 가능성 (35%)',
    data: createDummyAnalysisResult('위험상표', 35)
  }
];

export default function SimplifiedResultsTestPage() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [showProgress, setShowProgress] = useState(true);

  const handleApply = () => {
    alert('출원하기 클릭됨');
  };

  const handleConsult = () => {
    alert('전문가 상담 클릭됨');
  };

  const handleBack = () => {
    alert('뒤로가기 클릭됨');
  };

  const handlePDFDownload = () => {
    alert('PDF 다운로드 클릭됨');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 테스트 컨트롤 */}
      <div className="bg-white border-b p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">간소화된 결과 화면 테스트</h1>
            
            <div className="flex items-center space-x-4">
              {/* 시나리오 선택 */}
              <div className="flex space-x-2">
                {TEST_SCENARIOS.map((scenario, index) => (
                  <Button
                    key={index}
                    variant={index === currentScenario ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentScenario(index)}
                  >
                    {scenario.name}
                  </Button>
                ))}
              </div>

              {/* 진행률 표시 토글 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProgress(!showProgress)}
              >
                {showProgress ? '진행률 숨김' : '진행률 표시'}
              </Button>
            </div>
          </div>

          {/* 진행률 표시 */}
          {showProgress && (
            <div className="mt-4 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">단계 진행 상황</CardTitle>
                </CardHeader>
                <CardContent>
                  <StageProgress
                    currentStage={3}
                    completedStages={[1, 2]}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 결과 화면 */}
      <SimplifiedResultsView
        stage2Id={`test-${currentScenario}`}
        trademarkName={TEST_SCENARIOS[currentScenario].data.trademarkName}
        businessDescription={""}
        onApply={handleApply}
        onConsult={handleConsult}
        onBack={handleBack}
        onPDFDownload={handlePDFDownload}
      />

      {/* 디버그 정보 */}
      <div className="fixed bottom-4 right-4">
        <Card className="w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">디버그 정보</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>현재 시나리오: {TEST_SCENARIOS[currentScenario].name}</div>
            <div>등록 가능성: {TEST_SCENARIOS[currentScenario].data.registrationProbability}%</div>
            <div>AI 신뢰도: {TEST_SCENARIOS[currentScenario].data.aiConfidence}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}