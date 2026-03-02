/**
 * Stage 3 사용자 액션 테스트 페이지
 * 
 * 완성된 간소화 결과 화면에서 출원하기/전문가 상담 기능을 테스트
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { SimplifiedResultsView } from '@/features/trademark-analysis/_components/simplified-results/SimplifiedResultsView';
import { SimplifiedAnalysisResult, Stage3ActionResult } from '@/features/trademark-analysis/_types/simplified-types';

// 테스트용 분석 결과 데이터
const mockAnalysisResult: SimplifiedAnalysisResult = {
  trademarkName: '스마트플로우',
  trademarkType: 'text',
  trademarkImageUrl: undefined,
  registrationProbability: 85,
  aiConfidence: 92,
  analysis: {
    codeCompatibility: {
      score: 90,
      description: '선택한 유사군 코드와 매우 적합합니다',
      status: 'excellent',
      icon: '✓',
      details: 'AI 워크플로우 자동화는 42류 코드에 완전히 부합합니다'
    },
    distinctiveness: {
      score: 88,
      description: '독창적이고 식별력이 우수합니다',
      status: 'excellent',
      icon: '✓',
      details: '기술적 특성을 잘 표현하며 독특한 조합입니다'
    },
    priorSimilarity: {
      score: 78,
      description: '일부 유사 상표가 있으나 충돌 위험은 낮습니다',
      status: 'good',
      icon: '✓',
      details: '2건의 유사 상표가 발견되었으나 업무 분야가 상이합니다'
    },
    nonRegistrable: {
      score: 95,
      description: '불등록 사유가 없습니다',
      status: 'excellent',
      icon: '✓',
      details: '법적 불등록 사유에 해당하지 않습니다'
    },
    famousness: {
      score: 92,
      description: '저명상표와 충돌하지 않습니다',
      status: 'excellent',
      icon: '✓',
      details: '저명상표 데이터베이스에서 충돌 없음'
    }
  },
  analysisDate: new Date().toISOString(),
  processingTime: 12500
};

const MOCK_STAGE2_ID = 'stage2_test_85_percent_probability_id';

export default function Stage3ActionsTestPage() {
  const [actionResults, setActionResults] = useState<Stage3ActionResult[]>([]);
  const [currentView, setCurrentView] = useState<'results' | 'summary'>('results');

  // 출원 신청 완료 처리
  const handleApplicationResult = (result: Stage3ActionResult) => {
    console.log('✅ 출원 신청 완료:', result);
    setActionResults(prev => [...prev, { ...result, actionType: '출원 신청' }]);
    setCurrentView('summary');
  };

  // 전문가 상담 완료 처리
  const handleConsultationResult = (result: Stage3ActionResult) => {
    console.log('📞 전문가 상담 예약 완료:', result);
    setActionResults(prev => [...prev, { ...result, actionType: '전문가 상담' }]);
    setCurrentView('summary');
  };

  // 결과 보기로 돌아가기
  const handleBackToResults = () => {
    setCurrentView('results');
  };

  // 결과 요약 화면
  const renderSummary = () => {
    const latestResult = actionResults[actionResults.length - 1];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              🎉 처리 완료!
            </h1>
            <p className="text-gray-600">
              요청하신 작업이 성공적으로 처리되었습니다
            </p>
          </div>

          {/* 결과 카드 */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-green-900">
                    {(latestResult as any)?.actionType} 완료
                  </CardTitle>
                  <p className="text-sm text-green-700 mt-1">
                    상표명: {mockAnalysisResult.trademarkName}
                  </p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  성공
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 결과 정보 표시 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestResult?.applicationId && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">출원 ID</p>
                    <p className="text-xs text-gray-600">{latestResult.applicationId}</p>
                  </div>
                )}
                {latestResult?.consultationBookingId && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">예약 ID</p>
                    <p className="text-xs text-gray-600">{latestResult.consultationBookingId}</p>
                  </div>
                )}
                {latestResult?.status && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">상태</p>
                    <p className="text-xs text-gray-600">{latestResult.status}</p>
                  </div>
                )}
                {(latestResult?.estimatedProcessingTime || latestResult?.estimatedResponse) && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">예상 소요 시간</p>
                    <p className="text-xs text-gray-600">
                      {latestResult.estimatedProcessingTime || latestResult.estimatedResponse}
                    </p>
                  </div>
                )}
              </div>

              {latestResult?.message && (
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800">{latestResult.message}</p>
                </div>
              )}

              <div className="flex justify-center space-x-3 pt-4">
                <Button variant="outline" onClick={handleBackToResults}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  결과 화면으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 액션 히스토리 */}
          {actionResults.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">액션 기록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {actionResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{(result as any).actionType}</span>
                      <Badge variant="secondary" className="text-xs">
                        {result.submittedAt || result.bookedAt || '완료'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  if (currentView === 'summary') {
    return renderSummary();
  }

  return (
    <div className="min-h-screen">
      <SimplifiedResultsView
        stage2Id={MOCK_STAGE2_ID}
        trademarkName={mockAnalysisResult.trademarkName}
        businessDescription={''}
        onApply={handleApplicationResult}
        onConsult={handleConsultationResult}
        onBack={() => window.history.back()}
        onPDFDownload={() => alert('PDF 다운로드 기능은 아직 구현되지 않았습니다')}
      />
      
      {/* 개발자용 정보 패널 */}
      <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-3 rounded-lg max-w-sm">
        <p className="font-bold mb-1">🧪 Stage 3 Actions Test</p>
        <p>Mock Stage2 ID: {MOCK_STAGE2_ID}</p>
        <p>등록 가능성: {mockAnalysisResult.registrationProbability}%</p>
        <p>액션 수행 횟수: {actionResults.length}</p>
      </div>
    </div>
  );
}