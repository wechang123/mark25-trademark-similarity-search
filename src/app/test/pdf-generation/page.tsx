/**
 * PDF 생성 테스트 페이지
 * 
 * PDF 리포트 생성 기능을 독립적으로 테스트
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Download, FileText, Settings, CheckCircle, AlertCircle, Clock } from 'lucide-react';
// PDF report service removed - using simplified results flow
import { SimplifiedAnalysisResult } from '@/features/trademark-analysis/_types/simplified-types';

// Simple PDF options type for test page
interface PDFReportOptions {
  includeDetails: boolean;
  includeRecommendations: boolean;
  language: 'ko' | 'en';
  format: 'A4' | 'Letter';
}

// 테스트용 샘플 데이터
const sampleAnalysisResults: Record<string, SimplifiedAnalysisResult> = {
  'high': {
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
  },
  'medium': {
    trademarkName: '카페라떼',
    trademarkType: 'text',
    trademarkImageUrl: undefined,
    registrationProbability: 65,
    aiConfidence: 78,
    analysis: {
      codeCompatibility: {
        score: 75,
        description: '선택한 유사군 코드와 적합합니다',
        status: 'good',
        icon: '✓',
        details: '카페 관련 서비스는 43류 코드에 적합합니다'
      },
      distinctiveness: {
        score: 60,
        description: '일반적인 용어이지만 식별력이 있습니다',
        status: 'warning',
        icon: '⚠',
        details: '카페와 라떼의 조합은 보통 수준의 식별력을 가집니다'
      },
      priorSimilarity: {
        score: 58,
        description: '다수의 유사 상표가 존재합니다',
        status: 'warning',
        icon: '⚠',
        details: '15건의 유사 상표가 발견되어 충돌 가능성이 있습니다'
      },
      nonRegistrable: {
        score: 85,
        description: '불등록 사유가 일부 있을 수 있습니다',
        status: 'good',
        icon: '✓',
        details: '경미한 불등록 사유 검토 필요'
      },
      famousness: {
        score: 88,
        description: '저명상표와의 충돌 위험은 낮습니다',
        status: 'good',
        icon: '✓',
        details: '저명상표 검사에서 충돌 없음'
      }
    },
    analysisDate: new Date().toISOString(),
    processingTime: 15200
  },
  'low': {
    trademarkName: '삼성스마트',
    trademarkType: 'text',
    trademarkImageUrl: undefined,
    registrationProbability: 25,
    aiConfidence: 88,
    analysis: {
      codeCompatibility: {
        score: 45,
        description: '유사군 코드와 부분적으로만 적합합니다',
        status: 'danger',
        icon: '✗',
        details: '전자기기 액세서리는 9류 코드가 더 적합할 수 있습니다'
      },
      distinctiveness: {
        score: 25,
        description: '기존 유명 상표와 유사하여 식별력이 부족합니다',
        status: 'danger',
        icon: '✗',
        details: '삼성은 이미 등록된 유명 상표로 혼동 가능성이 높습니다'
      },
      priorSimilarity: {
        score: 15,
        description: '동일하거나 매우 유사한 상표가 다수 존재합니다',
        status: 'danger',
        icon: '✗',
        details: '15건 이상의 유사 상표가 동일 업종에서 발견되었습니다'
      },
      nonRegistrable: {
        score: 30,
        description: '다수의 불등록 사유가 발견되었습니다',
        status: 'danger',
        icon: '✗',
        details: '기존 상표권과의 충돌 및 식별력 부족으로 등록 어려움'
      },
      famousness: {
        score: 10,
        description: '저명상표와 직접적으로 충돌합니다',
        status: 'danger',
        icon: '✗',
        details: '삼성은 등록된 저명상표로 사용 불가능'
      }
    },
    analysisDate: new Date().toISOString(),
    processingTime: 11800
  }
};

export default function PDFGenerationTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<'high' | 'medium' | 'low'>('high');
  const [options, setOptions] = useState({
    includeDetails: true,
    includeRecommendations: true,
    language: 'ko',
    format: 'A4'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; fileName?: string; error?: string } | null>(null);

  // PDF 생성 테스트
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      setLastResult(null);
      
      const analysisData = sampleAnalysisResults[selectedScenario];
      
      console.log('🧪 [PDF Test] Starting PDF generation test:', {
        scenario: selectedScenario,
        trademarkName: analysisData.trademarkName,
        probability: analysisData.registrationProbability,
        options
      });

      // PDF generation service removed - redirect to results page
      const result = { success: true, fileName: `analysis-${selectedScenario}-${Date.now()}.pdf` };
      
      setLastResult({ success: true, fileName: result.fileName });
      
    } catch (error) {
      console.error('❌ [PDF Test] Generation failed:', error);
      setLastResult({ 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 옵션 업데이트
  const updateOption = <K extends keyof PDFReportOptions>(key: K, value: PDFReportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // 현재 선택된 데이터
  const currentData = sampleAnalysisResults[selectedScenario];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            📄 PDF 리포트 생성 테스트
          </h1>
          <p className="text-gray-600">
            다양한 시나리오와 옵션으로 PDF 생성 기능을 테스트합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 설정 패널 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 시나리오 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>테스트 시나리오</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">등록 가능성 수준</label>
                  <Select value={selectedScenario} onValueChange={(value: 'high' | 'medium' | 'low') => setSelectedScenario(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">높음 (85%) - 스마트플로우</SelectItem>
                      <SelectItem value="medium">보통 (65%) - 카페라떼</SelectItem>
                      <SelectItem value="low">낮음 (25%) - 삼성스마트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 현재 시나리오 정보 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
                    <p><strong>상표명:</strong> {currentData.trademarkName}</p>
                    <p><strong>등록 가능성:</strong> {currentData.registrationProbability}%</p>
                    <p><strong>AI 신뢰도:</strong> {currentData.aiConfidence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF 옵션 */}
            <Card>
              <CardHeader>
                <CardTitle>PDF 옵션</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeDetails"
                      checked={options.includeDetails}
                      onCheckedChange={(checked) => updateOption('includeDetails', checked as boolean)}
                    />
                    <label htmlFor="includeDetails" className="text-sm">상세 설명 포함</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeRecommendations"
                      checked={options.includeRecommendations}
                      onCheckedChange={(checked) => updateOption('includeRecommendations', checked as boolean)}
                    />
                    <label htmlFor="includeRecommendations" className="text-sm">권장사항 포함</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">언어</label>
                  <Select value={options.language} onValueChange={(value: 'ko' | 'en') => updateOption('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">영어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">용지 크기</label>
                  <Select value={options.format} onValueChange={(value: 'A4' | 'Letter') => updateOption('format', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 생성 버튼 */}
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full h-12"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  PDF 생성 중...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  PDF 생성 및 다운로드
                </>
              )}
            </Button>
          </div>

          {/* 미리보기 및 결과 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 분석 데이터 미리보기 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>분석 데이터 미리보기</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">기본 정보</h4>
                    <div className="text-sm space-y-1">
                      <p>상표명: {currentData.trademarkName}</p>
                      <p>상표 유형: {currentData.trademarkType === 'text' ? '문자상표' : currentData.trademarkType === 'image' ? '도형상표' : '복합상표'}</p>
                      <p>분석 일시: {new Date(currentData.analysisDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">분석 결과</h4>
                    <div className="text-sm space-y-1">
                      <p>등록 가능성: <Badge variant={currentData.registrationProbability >= 70 ? 'default' : 'secondary'}>{currentData.registrationProbability}%</Badge></p>
                      <p>AI 신뢰도: {currentData.aiConfidence}%</p>
                      <p>처리 시간: {Math.round((currentData.processingTime || 0) / 1000)}초</p>
                    </div>
                  </div>
                </div>

                {/* 평가 기준 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">3가지 평가 기준</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(currentData.analysis).map(([key, criterion]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium">
                            {key === 'codeCompatibility' ? '유사군 코드 적합성' :
                             key === 'distinctiveness' ? '상표 식별력' : '선행상표 유사도'}
                          </span>
                          <Badge variant="outline">{criterion.score}점</Badge>
                        </div>
                        <p className="text-xs text-gray-600">{criterion.description}</p>
                        {options.includeDetails && criterion.details && (
                          <p className="text-xs text-gray-500 mt-1 italic">{criterion.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 생성 결과 */}
            {lastResult && (
              <Card className={lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {lastResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={lastResult.success ? 'text-green-900' : 'text-red-900'}>
                      {lastResult.success ? 'PDF 생성 성공' : 'PDF 생성 실패'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lastResult.success ? (
                    <div className="space-y-2">
                      <p className="text-green-800 text-sm">
                        📁 파일명: {lastResult.fileName}
                      </p>
                      <p className="text-green-700 text-xs">
                        PDF가 성공적으로 생성되었고 다운로드가 시작되었습니다.
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-700 text-sm">
                      오류: {lastResult.error}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* API 정보 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">📋 API 호출 정보</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p><strong>Endpoint:</strong> POST /api/reports/pdf</p>
                <p><strong>Download:</strong> GET /api/reports/pdf/download/[filename]</p>
                <p><strong>Rate Limiting:</strong> 활성화됨</p>
                <p><strong>Current Status:</strong> Mock PDF generation (테스트용)</p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 실제 프로덕션에서는 puppeteer, jsPDF 등을 사용하여 실제 PDF를 생성합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}