'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { 
  ShoppingBag, 
  Briefcase, 
  Package, 
  Coffee,
  Info,
  CheckCircle,
  Loader2
} from 'lucide-react'
// Define types inline since consultation-types file doesn't exist
type UserChoice = 'proceed' | 'wait' | 'cancel' | null;

interface ConsultationState {
  stage: 'initial' | 'processing' | 'results' | 'complete';
  userChoice: UserChoice;
  backgroundSearchStatus: 'idle' | 'searching' | 'complete' | 'error';
  extractedCodes: string[];
  searchResults: any[];
  needsMoreExplanation: boolean;
}

interface ConsultationFlowProps {
  businessDescription: string
  trademarkName: string
  trademarkType: 'text' | 'combined'
  onComplete: (similarGroupCodes: string[]) => void
}

export function ConsultationFlow({ businessDescription, trademarkName, trademarkType, onComplete }: ConsultationFlowProps) {
  const [state, setState] = useState<ConsultationState>({
    stage: 'processing', // 즉시 처리 단계로 시작
    userChoice: null,
    backgroundSearchStatus: 'idle',
    extractedCodes: [],
    searchResults: [],
    needsMoreExplanation: false
  })
  
  const [searchProgress, setSearchProgress] = useState(0)

  // 컴포넌트 마운트 시 즉시 분석 시작
  useEffect(() => {
    if (businessDescription) {
      startAnalysisWithChoice(null) // userChoice 없이 바로 분석 시작
    }
  }, [businessDescription])


  const startBackgroundSearch = async (userChoice: UserChoice | null = null): Promise<string[]> => {
    setState(prev => ({ ...prev, backgroundSearchStatus: 'searching' }))
    
    // 프로그레스 시뮬레이션
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + 10, 90))
    }, 800)

    try {
      
      const response = await fetch('/api/trademark/extract-similar-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessDescription,
          userChoice: userChoice || 'both' // 기본값으로 전체 검색
        })
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '유사군 코드 추출 실패')
      }

      // 안전한 데이터 추출 (빈 배열이나 undefined 처리)
      const rawCodes = result.selectedCodes || result.extractedCodes || []
      const extractedCodes = Array.isArray(rawCodes) ? rawCodes.filter(code => code && typeof code === 'string') : []
      const confidence = typeof result.confidence === 'number' && !isNaN(result.confidence) ? result.confidence : 85
      const reasoning = result.reasoning || 'AI 가중치 시스템으로 최적 선택'
      
      // 추출된 코드가 없는 경우 에러 처리
      if (extractedCodes.length === 0) {
        throw new Error('유사군 코드를 찾을 수 없습니다. 다른 키워드로 다시 시도해주세요.')
      }
      
      clearInterval(progressInterval)
      setSearchProgress(100)
      
      // API에서 받은 최적 선택 결과를 바로 사용 (안전한 처리)
      const mockResults = extractedCodes
        .filter((code: string) => code && typeof code === 'string') // null/undefined 제거
        .map((code: string, index: number) => {
          // 추가 null 체크 및 안전한 처리
          if (!code || typeof code !== 'string') {
            return null
          }
          
          const safeCode = code || 'G00' // 기본값 설정
          const classCode = safeCode.replace('G', '').substring(0, 2) || '00'
          return {
            productName: `최적선택-${index + 1}`,
            similarGroupCode: safeCode,
            classCode: classCode,
            className: `제${classCode}류`,
            confidence: confidence / 100 + (index * 0.01),
            source: 'ai-optimized'
          }
        })
        .filter(Boolean) // null 값 제거
      
      // 상태 업데이트 (안전한 배열로)
      setState(prev => ({
        ...prev,
        searchResults: mockResults,
        extractedCodes: extractedCodes.length > 0 ? extractedCodes : [], // 빈 배열 방지
        backgroundSearchStatus: 'complete'
      }))
      
      // 추출된 코드를 반환
      return extractedCodes
      
    } catch (error) {
      clearInterval(progressInterval)
      setState(prev => ({ ...prev, backgroundSearchStatus: 'error' }))
      throw error // 에러를 다시 throw하여 호출하는 함수에서 처리할 수 있도록
    }
  }


  // 사용자 선택 관련 함수들 제거 - 더 이상 필요 없음

  const startAnalysisWithChoice = async (choice: UserChoice | null) => {
    try {
      // 유사군 분석 시작 (사용자 선택 없이) - 결과를 직접 받음
      const extractedCodes = await startBackgroundSearch(choice)
      
      // 분석 완료 후 결과 처리 - 추출된 코드를 직접 사용
      processResults(choice, extractedCodes)
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        backgroundSearchStatus: 'error'
      }))
    }
  }

  const processResults = (choice: UserChoice | null, selectedCodes: string[]) => {
    // 안전한 코드 필터링
    const validCodes = selectedCodes.filter(code => code && typeof code === 'string')
    
    // 선택된 코드들이 유효한 경우에만 처리
    if (validCodes.length > 0) {
      setState(prev => ({
        ...prev,
        stage: 'results'
      }))

      // 3초 후 onComplete 콜백 호출로 새로운 3단계 플로우 시작
      setTimeout(() => {
        
        // 새로운 3단계 플로우로 이동하기 위해 onComplete 콜백 호출
        onComplete(validCodes)
      }, 3000)
    } else {
      // 유사군 코드가 없는 경우 에러 표시
      setState(prev => ({
        ...prev,
        backgroundSearchStatus: 'error'
      }))
    }
  }


  return (
    <div className="space-y-6">
      {/* 백그라운드 검색 상태 */}
      {state.backgroundSearchStatus === 'searching' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                상품 데이터베이스 검색 중... ({searchProgress}%)
              </p>
              <Progress value={searchProgress} className="h-2" />
              <p className="text-xs text-blue-700">
                고객님의 사업 설명을 바탕으로 관련 상품/서비스를 찾고 있습니다
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 사용자 선택 단계 완전 제거 - 즉시 분석 시작 */}


      {/* 상세 설명 단계도 제거 */}

      {/* Stage: Processing */}
      {state.stage === 'processing' && (
        <Card className="border-2 border-green-200">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900">
                유사군 코드 추출 중...
              </h3>
              <p className="text-sm text-gray-600">
                사업 설명을 바탕으로 최적의 유사군 코드를 추출하고 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Stage: Results */}
      {state.stage === 'results' && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              최적 유사군 코드 선별 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-3">
                AI가 고객님의 사업에 가장 적합한 {state.extractedCodes.length}개의 유사군 코드를 선별했습니다
              </p>
              
              {/* 선택된 코드들 표시 */}
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {state.extractedCodes
                  .filter(code => code && typeof code === 'string') // 안전한 코드만 표시
                  .map((code, index) => (
                    <Badge 
                      key={index}
                      className="bg-green-100 text-green-800 border-green-200 text-base px-3 py-1"
                    >
                      {code}
                    </Badge>
                  ))}
              </div>
              
              {/* 클래스 정보 표시 */}
              <div className="text-xs text-green-700 text-center space-y-1">
                {state.extractedCodes
                  .filter(code => code && typeof code === 'string') // null/undefined 제거
                  .map((code, index) => {
                    const safeCode = code || 'G00'
                    const classNum = safeCode.replace('G', '').replace('S', '').substring(0, 2) || '00'
                    return (
                      <div key={index}>
                        {safeCode}: 제{classNum}류 관련 상품/서비스
                      </div>
                    )
                  })}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">
                🎯 AI 선택 기준
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>위치 가중치 (40%)</strong>: 상위 검색 결과 우선</p>
                <p>• <strong>빈도 가중치 (30%)</strong>: 반복 등장하는 코드 우선</p>
                <p>• <strong>신뢰도 가중치 (20%)</strong>: RAG 점수 반영</p>
                <p>• <strong>사업 적합성 (10%)</strong>: 업종별 맞춤 선택</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              이제 KIPRIS 검색을 시작하여 등록 가능성을 분석합니다...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}