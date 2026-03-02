'use client';

import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2, Upload, Image as ImageIcon, Search, ExternalLink, FileText, Sparkles } from 'lucide-react';

interface SimilarTrademarkResult {
  rank: number;
  trademark_number: string;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  similarity_level: 'excellent' | 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  similarity_label: string;
  kipris_image_url?: string;
  bibliographic?: {
    title?: string;
    applicantName?: string;
    applicationNumber?: string;
    registrationNumber?: string;
    applicationDate?: string;
    registrationDate?: string;
    applicationStatus?: string;
    goodsClassificationCode?: string;
    similarityCodes?: string[];
  };
}

interface SearchResponse {
  success: boolean;
  results: SimilarTrademarkResult[];
  total: number;
  search_time_ms: number;
  method?: string;
  error?: string;
  filtered_by_classification?: boolean;
  extracted_codes?: string[];
}

interface RegistrabilityAnalysis {
  possibility_score: number;
  risk_level: 'high' | 'medium' | 'low';
  conclusion: string;
  reasoning: string[];
  conflicting_trademarks_count?: number;
  registered_similar_count?: number;
}

export default function SimilarImageSearchPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [businessDescription, setBusinessDescription] = useState('');
  const [extractedCodes, setExtractedCodes] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchStep, setSearchStep] = useState({ current: 0, total: 5, name: '' });
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [registrabilityAnalysis, setRegistrabilityAnalysis] = useState<RegistrabilityAnalysis | null>(null);
  const [analyzingRegistrability, setAnalyzingRegistrability] = useState(false);
  const analysisAttempted = React.useRef(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!selectedImage) {
      alert('이미지를 선택해주세요.');
      return;
    }

    setSearching(true);
    setResults(null);
    setExtractedCodes([]);
    setRegistrabilityAnalysis(null);

    try {
      // 단계 1: 검색 시작
      setSearchStep({ current: 1, total: 4, name: '검색 준비 중...' });

      const formData = new FormData();
      formData.append('image', selectedImage);

      // 사업설명이 있으면 추가 (백엔드에서 자동으로 유사군 코드 추출)
      if (businessDescription.trim()) {
        formData.append('businessDescription', businessDescription.trim());
        // 단계 2: 유사군 코드 추출 중
        setSearchStep({ current: 2, total: 4, name: '사업 설명 분석 및 유사군 코드 추출 중...' });
      }

      // 단계 3: 이미지 분석 및 벡터 검색
      setTimeout(() => {
        setSearchStep({ current: 3, total: 4, name: '이미지 분석 및 전체 상표와 비교 중...' });
      }, 1000);

      const response = await fetch('/api/admin/similar-image-search/search', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // 백엔드에서 추출된 유사군 코드 설정
        if (data.extracted_codes) {
          setExtractedCodes(data.extracted_codes);
        }

        // 단계 4: 완료
        setSearchStep({ current: 4, total: 4, name: '검색 완료!' });
        setResults(data);
      } else {
        setResults({
          success: false,
          results: [],
          total: 0,
          search_time_ms: 0,
          error: data.error || '검색 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      setResults({
        success: false,
        results: [],
        total: 0,
        search_time_ms: 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setSearching(false);
    }
  };

  // 자동 화면 캡처 및 등록 가능성 분석
  useEffect(() => {
    console.log('🔍 [Auto Capture] useEffect triggered:', {
      hasResults: !!results,
      success: results?.success,
      resultsCount: results?.results?.length || 0,
      analyzingRegistrability,
      registrabilityAnalysis: !!registrabilityAnalysis,
    });

    // 이미 시도했거나 분석 결과가 있으면 건너뜀
    if (registrabilityAnalysis || analysisAttempted.current) {
      return;
    }

    if (results && results.success && results.results.length > 0 && !analyzingRegistrability) {
      console.log('✅ [Auto Capture] All conditions met, starting capture...');

      // 1초 대기 후 화면 캡처 (DOM 렌더링 완료 보장)
      const captureAndAnalyze = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2초로 증가 (렌더링 여유)

          console.log('📸 [Auto Capture] Starting screenshot capture...');
          setAnalyzingRegistrability(true);

          // 결과 섹션 캡처
          const element = document.getElementById('search-results-section');
          if (!element) {
            console.error('❌ [Auto Capture] Element #search-results-section not found');
            setAnalyzingRegistrability(false);
            return;
          }

          console.log('📸 [Auto Capture] Element found, capturing...');

          let imageDataUrl: string;
          try {
            imageDataUrl = await toPng(element, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: '#ffffff',
              cacheBust: true, // 캐시 문제 방지
              skipFonts: false, // 폰트 포함
            });
            console.log('✅ [Auto Capture] Screenshot captured successfully');
          } catch (captureError: any) {
            console.error('❌ [Auto Capture] Screenshot capture failed:', {
              message: captureError?.message,
              name: captureError?.name,
              stack: captureError?.stack,
              errorType: typeof captureError,
              errorString: String(captureError),
              errorKeys: captureError ? Object.keys(captureError) : [],
            });

            // CORS 이슈일 가능성이 높으므로 이미지 없이 재시도
            console.log('🔄 [Auto Capture] Retrying without external images...');
            try {
              // 외부 이미지를 숨기고 캡처 시도
              const images = element.querySelectorAll('img[src*="kipris"]');
              const originalDisplay: string[] = [];
              images.forEach((img, idx) => {
                originalDisplay[idx] = (img as HTMLElement).style.display;
                (img as HTMLElement).style.display = 'none';
              });

              imageDataUrl = await toPng(element, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true,
                skipFonts: false,
              });

              // 이미지 다시 표시
              images.forEach((img, idx) => {
                (img as HTMLElement).style.display = originalDisplay[idx];
              });

              console.log('✅ [Auto Capture] Screenshot captured successfully (without external images)');
            } catch (retryError: any) {
              console.error('❌ [Auto Capture] Retry also failed:', retryError);
              setAnalyzingRegistrability(false);
              return;
            }
          }

          console.log('🚀 [Auto Capture] Sending to Gemini Vision API...');

          // Gemini Vision API로 분석 요청
          let response: Response;
          try {
            response = await fetch('/api/analysis/vision-registrability', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageBase64: imageDataUrl,
              }),
            });
          } catch (fetchError: any) {
            console.error('❌ [Auto Capture] API fetch failed:', {
              message: fetchError?.message,
              name: fetchError?.name,
            });
            setAnalyzingRegistrability(false);
            return;
          }

          let data: any;
          try {
            data = await response.json();
          } catch (jsonError: any) {
            console.error('❌ [Auto Capture] JSON parse failed:', {
              message: jsonError?.message,
              status: response.status,
              statusText: response.statusText,
            });
            setAnalyzingRegistrability(false);
            return;
          }

          if (data.success && data.analysis) {
            console.log('✅ [Auto Capture] Analysis received:', data.analysis);
            setRegistrabilityAnalysis(data.analysis);
          } else {
            console.error('❌ [Auto Capture] Analysis failed:', data.error || 'Unknown error');
          }
        } catch (error: any) {
          console.error('❌ [Auto Capture] Unexpected error:', {
            message: error?.message || 'No message',
            name: error?.name || 'Unknown',
            type: typeof error,
            error: String(error),
          });
        } finally {
          setAnalyzingRegistrability(false);
        }
      };

      analysisAttempted.current = true;
      captureAndAnalyze();
    }
  }, [results, analyzingRegistrability, registrabilityAnalysis]);

  const getRiskLevel = (similarity: number) => {
    // 디버깅: 유사도 점수 로깅
    console.log('🎯 [Risk Level] Similarity score:', similarity);

    // 백엔드 기준에 맞춘 위험도 판단
    if (similarity >= 0.70) {
      console.log('🔴 [Risk Level] HIGH RISK (>= 0.70) - 매우 유사/거의 동일');
      return {
        level: '높음',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        description: '등록 거절 가능성 높음'
      };
    }
    if (similarity >= 0.50) {
      console.log('🟡 [Risk Level] MEDIUM RISK (0.50-0.69) - 유사');
      return {
        level: '중간',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300',
        description: '유사도 높음 - 전문가 검토 필요'
      };
    }
    if (similarity >= 0.30) {
      console.log('🟠 [Risk Level] MEDIUM-LOW RISK (0.30-0.49) - 일부 유사');
      return {
        level: '주의',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        description: '일부 유사 - 주의 필요'
      };
    }
    console.log('🟢 [Risk Level] LOW RISK (< 0.30)');
    return {
      level: '낮음',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      description: '참고용 - 일반적으로 등록 가능'
    };
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 유사 상표 이미지 검색</h1>
        <p className="text-gray-600">
          Supabase pgvector + DINOv2 임베딩을 사용한 유사 상표 이미지 검색 시스템
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload + Business Description */}
        <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              이미지 업로드
            </CardTitle>
            <CardDescription>
              검색할 상표 이미지를 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="relative w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      setResults(null);
                    }}
                  >
                    다시 선택
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    클릭하여 이미지 선택
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    JPG, PNG, GIF 등
                  </p>
                </label>
              )}
            </div>

            {results && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  검색 시간: <span className="font-semibold">{results.search_time_ms}ms</span>
                </p>
                {results.method && (
                  <p className="text-xs text-gray-500 mt-1">
                    방법: {results.method}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Description Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              사업 설명 (선택 사항)
            </CardTitle>
            <CardDescription>
              사업 내용을 입력하면 AI가 유사군 코드를 추출하여 더 정확한 검색을 제공합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="예: 온라인 쇼핑몰 운영, 의류 및 액세서리 판매"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />

            <p className="text-sm text-gray-500">
              💡 사업 내용을 입력하면 AI가 자동으로 관련 분류를 찾아 더 정확한 검색을 제공합니다
            </p>

            {extractedCodes.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">✅ 추출된 유사군 코드:</p>
                <div className="flex flex-wrap gap-2">
                  {extractedCodes.map((code) => (
                    <Badge key={code} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={searching || !selectedImage}
          className="w-full"
          size="lg"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              검색 중...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              유사 상표 검색
            </>
          )}
        </Button>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-4">
          {searching && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  {/* 로딩 스피너 */}
                  <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto" />

                  {/* 주요 안내 메시지 */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      {searchStep.name}
                    </h3>
                  </div>

                  {/* 예상 시간 안내 */}
                  {searchStep.current >= 3 && searchStep.current < 4 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-amber-800 font-medium">
                        ⏱️ 예상 소요 시간: 1-2분
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        전체 상표 이미지와 DINOv2 AI로 1:1 비교 중입니다
                      </p>
                    </div>
                  )}

                  {/* 프로그레스 바 */}
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-4 max-w-md mx-auto overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-4 rounded-full transition-all duration-500 ease-out animate-pulse"
                        style={{ width: `${(searchStep.current / searchStep.total) * 100}%` }}
                      />
                    </div>

                    <p className="text-base font-semibold text-gray-700">
                      {searchStep.current} / {searchStep.total} 단계 ({Math.round((searchStep.current / searchStep.total) * 100)}%)
                    </p>
                  </div>

                  {/* 추출된 유사군 코드 실시간 표시 */}
                  {extractedCodes.length > 0 && searchStep.current >= 2 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in max-w-md mx-auto">
                      <p className="text-sm font-semibold text-green-900 mb-2">
                        ✅ 추출된 유사군 코드:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {extractedCodes.map((code) => (
                          <Badge key={code} variant="secondary" className="text-sm bg-green-100 text-green-800 border-green-300">
                            {code}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        이 분류에 해당하는 상표만 검색됩니다
                      </p>
                    </div>
                  )}

                  {/* 단계별 안내 */}
                  <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-xs font-semibold text-gray-600 mb-3">검색 진행 상황</p>
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center gap-2 ${searchStep.current >= 1 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        <span className="text-lg">{searchStep.current >= 1 ? '✓' : '○'}</span>
                        <span>검색 준비</span>
                      </div>
                      <div className={`flex items-center gap-2 ${searchStep.current >= 2 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        <span className="text-lg">{searchStep.current >= 2 ? '✓' : '○'}</span>
                        <span>사업 설명 분석</span>
                      </div>
                      <div className={`flex items-center gap-2 ${searchStep.current >= 3 ? (searchStep.current === 3 ? 'text-blue-600 font-medium' : 'text-green-600 font-medium') : 'text-gray-400'}`}>
                        <span className="text-lg">{searchStep.current > 3 ? '✓' : searchStep.current === 3 ? '⏳' : '○'}</span>
                        <span>이미지 분석 및 전체 상표 비교</span>
                        {searchStep.current === 3 && (
                          <span className="text-xs text-blue-500 animate-pulse">(진행 중...)</span>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 ${searchStep.current >= 4 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                        <span className="text-lg">{searchStep.current >= 4 ? '✅' : '○'}</span>
                        <span>검색 완료!</span>
                      </div>
                    </div>
                  </div>

                  {/* 기술 정보 */}
                  {searchStep.current === 3 && (
                    <div className="text-xs text-gray-500 max-w-md mx-auto">
                      <p className="font-medium mb-1">💡 왜 시간이 걸리나요?</p>
                      <p className="leading-relaxed">
                        업로드한 이미지를 1024차원 벡터로 변환한 후,
                        데이터베이스의 모든 상표 이미지 벡터와 코사인 유사도를 계산하여
                        가장 유사한 상표를 찾습니다. 정확한 결과를 위해 전체 데이터를 검색합니다.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {results && results.error && (
            <Card>
              <CardContent className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-red-700">오류 발생</span>
                </div>
                <p className="text-red-600 text-sm">{results.error}</p>
              </CardContent>
            </Card>
          )}

          {results && results.success && results.results.length > 0 && (
            <div id="search-results-section">
              {/* AI 등록 가능성 판단 카드 - 슬라이드 다운 애니메이션 */}
              {registrabilityAnalysis && (
                <Card className="mb-4 border-2 border-purple-300 shadow-lg animate-slideDown">
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      {/* 헤더 */}
                      <div className="flex items-center gap-2 justify-center">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-purple-700">AI 등록 가능성 판단</h3>
                      </div>

                      {/* 가능성 점수 */}
                      <div className={`text-center p-6 rounded-lg ${
                        registrabilityAnalysis.risk_level === 'low' ? 'bg-green-50 border-2 border-green-500' :
                        registrabilityAnalysis.risk_level === 'medium' ? 'bg-orange-50 border-2 border-orange-500' :
                        'bg-red-50 border-2 border-red-500'
                      }`}>
                        <p className="text-sm text-gray-600 mb-2">등록 가능성</p>
                        <p className={`text-5xl font-bold mb-3 ${
                          registrabilityAnalysis.risk_level === 'low' ? 'text-green-600' :
                          registrabilityAnalysis.risk_level === 'medium' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {registrabilityAnalysis.possibility_score}%
                        </p>
                        <Badge className={`text-sm px-4 py-1 ${
                          registrabilityAnalysis.risk_level === 'low' ? 'bg-green-600' :
                          registrabilityAnalysis.risk_level === 'medium' ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}>
                          {registrabilityAnalysis.risk_level === 'low' ? '낮은 위험' :
                           registrabilityAnalysis.risk_level === 'medium' ? '중간 위험' :
                           '높은 위험'}
                        </Badge>
                        <p className="text-lg font-semibold text-gray-700 mt-3">
                          {registrabilityAnalysis.conclusion}
                        </p>
                      </div>

                      {/* 판단 근거 */}
                      {registrabilityAnalysis.reasoning && registrabilityAnalysis.reasoning.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">판단 근거:</p>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {registrabilityAnalysis.reasoning.map((reason, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span>•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 면책 문구 */}
                      <p className="text-xs text-gray-500 text-center">
                        ⚠️ AI 분석 결과는 참고용입니다. 실제 등록 여부는 특허청 심사 결과에 따릅니다.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI 분석 중 로딩 인디케이터 */}
              {analyzingRegistrability && !registrabilityAnalysis && (
                <Card className="mb-4 border border-purple-200 bg-purple-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">
                        🤖 AI가 등록 가능성을 분석하고 있습니다...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 검색 완료 요약 */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="py-4">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg font-bold text-green-600">검색 완료!</h3>

                    {/* 발견된 결과 - 가장 크게 강조 */}
                    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-green-500 max-w-md mx-auto">
                      <p className="text-sm text-gray-600 mb-1">발견된 결과</p>
                      <p className="text-3xl font-bold text-green-600">
                        상위 {results.total}개
                      </p>
                    </div>

                    {/* 유사군 코드 필터링 - 크게 강조 */}
                    {results.filtered_by_classification && results.extracted_codes && results.extracted_codes.length > 0 && (
                      <div className="mt-3 p-4 bg-white rounded-lg border-2 border-blue-500 shadow-md max-w-md mx-auto">
                        <p className="text-sm text-blue-700 font-bold mb-2">
                          🎯 유사군 코드 필터링 적용됨
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {results.extracted_codes.map((code) => (
                            <Badge key={code} className="text-sm bg-blue-600 text-white px-3 py-1">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 소요 시간, 검색 대상 - 작게 참고용 */}
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mt-3">
                      <div className="bg-white/80 rounded p-2">
                        <p className="text-xs text-gray-500">소요 시간</p>
                        <p className="text-sm font-semibold text-gray-600">
                          {results.search_time_ms ? `${(results.search_time_ms / 1000).toFixed(1)}초` : '-'}
                        </p>
                      </div>

                      <div className="bg-white/80 rounded p-2">
                        <p className="text-xs text-gray-500">검색 대상</p>
                        <p className="text-sm font-semibold text-gray-600">
                          303,821개
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>유사 상표 목록</span>
                    <Badge variant="secondary" className="text-sm">
                      상위 {Math.min(20, results.total)}개 표시
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.results.map((result) => (
                    <div
                      key={result.trademark_number}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-600">
                              {result.rank}
                            </span>
                          </div>
                        </div>

                        {/* Trademark Image */}
                        <div className="flex-shrink-0">
                          {result.kipris_image_url ? (
                            <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                              <img
                                src={result.kipris_image_url}
                                alt={result.trademark_number}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {result.bibliographic?.title || '상표명 정보 없음'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                출원번호: {result.trademark_number}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {(() => {
                                const risk = getRiskLevel(result.similarity);
                                return (
                                  <div className={`px-3 py-2 rounded-lg border-2 ${risk.bgColor} ${risk.borderColor}`}>
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${risk.color}`}>
                                        위험도 {risk.level}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {risk.description}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="mb-3">
                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {result.similarity_label}
                            </span>
                          </div>

                          {result.bibliographic && (
                            <div className="space-y-2">
                              {result.bibliographic.title && (
                                <div className="text-sm">
                                  <span className="text-gray-600">상표명:</span>{' '}
                                  <span className="font-semibold text-gray-900">{result.bibliographic.title}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {result.bibliographic.applicantName && (
                                  <div>
                                    <span className="text-gray-600">출원인:</span>{' '}
                                    <span className="font-medium">{result.bibliographic.applicantName}</span>
                                  </div>
                                )}
                                {result.bibliographic.applicationDate && (
                                  <div>
                                    <span className="text-gray-600">출원일:</span>{' '}
                                    <span className="font-medium">{result.bibliographic.applicationDate}</span>
                                  </div>
                                )}
                                {result.bibliographic.applicationStatus && (
                                  <div>
                                    <span className="text-gray-600">상태:</span>{' '}
                                    <span className="font-medium">{result.bibliographic.applicationStatus}</span>
                                  </div>
                                )}
                                {result.bibliographic.goodsClassificationCode && (
                                  <div>
                                    <span className="text-gray-600">상품분류:</span>{' '}
                                    <span className="font-medium">{result.bibliographic.goodsClassificationCode}</span>
                                  </div>
                                )}
                              </div>
                              {result.bibliographic.similarityCodes && result.bibliographic.similarityCodes.length > 0 && (
                                <div className="text-sm">
                                  <span className="text-gray-600">유사군코드:</span>{' '}
                                  <span className="font-medium text-blue-600">{result.bibliographic.similarityCodes.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-3">
                            <a
                              href={`https://doi.org/10.8080/${result.trademark_number}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              KIPRIS에서 보기
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 등록 가능성 안내 (compact) */}
              <Card className="bg-amber-50 border border-amber-200">
                <CardContent className="py-3">
                  <div className="space-y-2">
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-amber-900 mb-1">
                        위험도 평가 기준
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2 border border-red-100">
                        <div className="font-bold text-red-600 mb-1">높음 (≥90%)</div>
                        <div className="text-gray-600">등록 거절 가능성 높음</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 border border-orange-100">
                        <div className="font-bold text-orange-600 mb-1">중간 (70-89%)</div>
                        <div className="text-gray-600">추가 검토 필요</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 border border-blue-100">
                        <div className="font-bold text-blue-600 mb-1">낮음 (&lt;70%)</div>
                        <div className="text-gray-600">일반적으로 등록 가능</div>
                      </div>
                    </div>

                    <div className="bg-white rounded p-2 border border-amber-100">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-semibold">📌 참고:</span>
                        유사군 코드가 다르면 이미지가 비슷해도 등록 가능 (단, 주지·저명상표 제외)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {results && results.success && results.results.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">유사한 상표를 찾을 수 없습니다</p>
              </CardContent>
            </Card>
          )}

          {!searching && !results && (
            <Card>
              <CardContent className="text-center py-12 text-gray-500">
                <div className="space-y-2">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">이미지를 업로드하고 검색을 시작하세요</p>
                  <p className="text-sm">
                    DINOv2 임베딩으로 690,078개의 상표 이미지와 비교합니다
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
