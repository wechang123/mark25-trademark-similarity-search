"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { ArrowLeft, Upload, Loader2, FileText, Image as ImageIcon, Plus, X, Layers } from "lucide-react"
import { useAuth } from "@/features/authentication"
import { AuthRequiredModal } from "@/shared/components/ui/auth-required-modal"
import { SimplifiedResultsView } from "../_components/simplified-results/SimplifiedResultsView"
import { TrademarkType } from "../_types/trademark.types"
import { TrademarkTypeDisplay } from "../_components/shared/TrademarkTypeDisplay"

interface TrademarkData {
  type: TrademarkType
  name: string
  descriptions: string[]  // 상표를 사용할 구체적인 상품/서비스 목록
  image?: File
}

interface TrademarkSelectionFlowProps {
  mode?: 'normal' | 'debug'
  onAnalysisStart?: (sessionId: string) => void
  className?: string
}

/**
 * V3 Unified Trademark Selection Flow
 * 상표 유형과 정보 입력을 하나의 폼으로 통합
 * 프로세스: 상표 입력 → 바로 분석 시작
 */
export function TrademarkSelectionFlow({ 
  mode = 'normal', 
  onAnalysisStart,
  className 
}: TrademarkSelectionFlowProps) {
  const router = useRouter()
  const { state: authState } = useAuth()
  const [formData, setFormData] = useState<TrademarkData>({
    type: 'text',
    name: '',
    descriptions: ['']  // 최소 1개의 입력 필드 유지
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false) // 분석 중 상태
  const [showResults, setShowResults] = useState(false)
  const [stage2Id, setStage2Id] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('trademark-type') // 현재 활성 섹션
  
  // 섹션 refs
  const sectionRefs = useRef<{[key: string]: HTMLElement | null}>({})
  
  // Intersection Observer로 현재 보이는 섹션 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            if (id) {
              setActiveSection(id)
            }
          }
        })
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      }
    )

    // 모든 섹션 관찰
    const sections = ['trademark-type', 'trademark-name', 'trademark-image', 'business-description']
    sections.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
        sectionRefs.current[id] = element
      }
    })

    return () => {
      sections.forEach((id) => {
        const element = sectionRefs.current[id]
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [showResults])
  
  // 상표 분석 시작 - 모든 분석을 백그라운드에서 실행
  const handleStartAnalysis = async () => {
    // 로그인 상태 확인
    if (!authState.user) {
      setShowAuthModal(true)
      return
    }
    
    // 입력값 검증
    const hasValidDescriptions = formData.descriptions.some(desc => desc.trim() !== '')
    if (!formData.name.trim() || !hasValidDescriptions) {
      alert('상표명과 상품/서비스 설명을 모두 입력해주세요.')
      return
    }
    
    if (formData.type === 'combined' && !formData.image) {
      alert('복합 상표는 이미지 파일을 업로드해주세요.')
      return
    }
    
    setIsAnalyzing(true)
    console.log('🚀 상표 분석 시작:', formData)
    
    try {
      // Step 1: Stage 1 데이터 저장 (분류 코드 추출은 LangGraph에서 처리)
      console.log('💾 Step 1: Stage 1 데이터 저장 중...')
      const stage1Data = {
        trademarkName: formData.name,
        trademarkType: formData.type,
        businessDescription: formData.descriptions.filter(desc => desc.trim()).join(', '),  // 배열을 문자열로 변환
        hasImage: formData.type === 'combined' && !!formData.image,
        imageFile: formData.image || null,
        similarGroupCodes: [],  // LangGraph에서 처리
        extractedProducts: [],  // LangGraph에서 처리
        businessDescriptionKeywords: [],  // LangGraph에서 처리
        user_id: authState.user?.id,
        simplified: true,
        // 디버그 모드일 때 추가 플래그
        ...(mode === 'debug' && {
          is_debug_mode: true,
          debug_user_id: authState.user?.id
        })
      }
      
      // 디버그 모드일 때는 다른 엔드포인트 사용
      const apiEndpoint = mode === 'debug' 
        ? '/api/admin/workflow/execute' 
        : '/api/analysis/trademark-input'
      
      const stage1Response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stage1Data)
      })
      
      if (!stage1Response.ok) {
        const errorData = await stage1Response.json()
        throw new Error(errorData.error || 'Stage 1 데이터 저장 실패')
      }
      
      const stage1Result = await stage1Response.json()
      const stage1Id = stage1Result.stage1Id || stage1Result.data?.id || stage1Result.sessionId
      console.log('✅ Stage 1 완료:', stage1Id)
      
      // 디버그 모드에서 콜백 실행하고 종료
      if (mode === 'debug' && onAnalysisStart) {
        onAnalysisStart(stage1Id)
        setIsAnalyzing(false)
        return // 디버그 모드에서는 여기서 종료 (페이지 이동 없음)
      }
      
      // Step 2: Stage 2 - LangGraph 분석 실행 (분류 코드 추출 포함) - 일반 모드에서만
      console.log('🧠 Stage 2: AI 분석 실행 중 (분류 코드 추출 포함)...')
      const stage2Data = { 
        stage1Id: stage1Id,
        trademarkName: formData.name,
        trademarkType: formData.type,
        businessDescription: formData.descriptions.filter(desc => desc.trim()).join(', '),  // 배열을 문자열로 변환
        skipKiprisSearch: false,
        analysisDepth: 'comprehensive' as const
      }
      
      const stage2Response = await fetch('/api/analysis/trademark-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stage2Data)
      })
      
      if (!stage2Response.ok) {
        const errorText = await stage2Response.text()
        throw new Error(`Stage 2 분석 실패: ${errorText}`)
      }
      
      const stage2Result = await stage2Response.json()
      const resultStage2Id = stage2Result.stage2Id || stage2Result.data?.id
      console.log('✅ Stage 2 완료:', resultStage2Id)
      
      // 분석 완료 - 결과 화면으로 전환
      setStage2Id(resultStage2Id)
      setShowResults(true)
      setIsAnalyzing(false)
      
    } catch (error) {
      console.error('❌ 분석 중 오류:', error)
      setIsAnalyzing(false)
      alert(`분석 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        image: file,
        autoGenerateImage: false 
      }))
    }
  }
  
  // 상품/서비스 설명 필드 추가
  const addDescriptionField = () => {
    setFormData(prev => ({
      ...prev,
      descriptions: [...prev.descriptions, '']
    }))
  }
  
  // 상품/서비스 설명 필드 삭제
  const removeDescriptionField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      descriptions: prev.descriptions.filter((_, i) => i !== index)
    }))
  }
  
  // 상품/서비스 설명 필드 업데이트
  const updateDescriptionField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      descriptions: prev.descriptions.map((desc, i) => i === index ? value : desc)
    }))
  }
  
  // 상표 유형 변경
  const handleTypeChange = (type: TrademarkType) => {
    if (type === 'image' || type === 'combined') {
      alert('🚧 도형/결합 상표 분석 서비스는 현재 준비 중입니다.\n곧 서비스를 제공할 예정이니 조금만 기다려주세요!')
      return
    }
    setFormData(prev => ({ ...prev, type }))
  }

  return (
    <div className={mode === 'debug' ? 'h-full' : (className || "min-h-screen bg-gray-50")}>
      {showResults && stage2Id && mode === 'normal' ? (
        // 결과 표시
        <SimplifiedResultsView
          stage2Id={stage2Id}
          trademarkName={formData.name}
          businessDescription={formData.descriptions.filter(desc => desc.trim()).join(', ')}
          onBack={() => {
            setShowResults(false)
            setStage2Id(null)
            // 폼 초기화
            setFormData({
              type: 'text',
              name: '',
              descriptions: ['']
            })
          }}
        />
      ) : isAnalyzing && mode !== 'debug' ? (
        // 분석 중 로딩 화면 (디버그 모드에서는 표시하지 않음)
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <h3 className="text-xl font-semibold">상표 분석 중...</h3>
                <p className="text-sm text-gray-600 text-center">
                  AI가 상표를 분석하고 있습니다.
                  <br />
                  잠시만 기다려주세요.
                </p>
                <div className="w-full space-y-2 mt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>유사군 코드 추출 중...</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span>AI 분석 실행 중...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // 상표 입력 폼
        <div className={mode === 'debug' ? "h-full bg-white" : "min-h-screen bg-white"}>
          {/* 홈 화면과 동일한 네비게이션 바 - 디버그 모드에서는 숨김 */}
          {mode !== 'debug' && (
            <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
              <div className="container mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/logo.png"
                    alt="Mark25"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain cursor-pointer"
                    onClick={() => router.push('/')}
                  />
                  <div className="hidden sm:block">
                    <div className="text-lg font-bold text-gray-900">Mark25</div>
                    <div className="text-xs text-neutral-500">AI 상표 분석</div>
                  </div>
                  <Badge className="hidden md:inline-flex ml-2 bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 border-0">
                    Beta
                  </Badge>
                </div>
                
                {/* 오른쪽 섹션 - 페이지 정보 */}
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    상표 분석 서비스
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>홈으로</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>
          )}

          <div className={mode === 'debug' ? "p-4" : "max-w-7xl mx-auto flex gap-8 px-4 sm:px-6 lg:px-8 py-8"}>
            {/* 왼쪽: 메인 콘텐츠 */}
            <div className={mode === 'debug' ? "w-full" : "flex-1"}>
              {mode !== 'debug' && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    상표 정보 입력
                  </h1>
                  <p className="text-lg text-gray-600">
                    AI 기반 상표 분석을 위해 정보를 입력해주세요
                  </p>
                </div>
              )}

              {/* 진행 단계 표시 - 디버그 모드에서는 숨김 */}
              {mode !== 'debug' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <span className="text-sm font-medium text-gray-900">상표 정보 입력</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-0.5 bg-gray-200" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <span className="text-sm text-gray-400">결과 확인</span>
                    </div>
                  </div>
                </div>
              )}

              <form className={mode === 'debug' ? "space-y-4" : "space-y-6"}>
                {/* 1. 상표 유형 선택 */}
                <Card id="trademark-type" className={mode === 'debug' ? "" : "scroll-mt-24"}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-medium">
                        1
                      </span>
                      <span>상표 유형</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={mode === 'debug' ? "p-4" : ""}>
                    <div className={mode === 'debug' ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                      {(['text', 'combined'] as const).map((type) => {
                        const typeConfig = {
                          text: { icon: FileText, label: '문자 상표', description: '브랜드명, 슬로건 등 문자로만 구성' },
                          combined: { icon: Layers, label: '결합 상표', description: '문자와 도형이 결합된 형태' }
                        } as const
                        const config = typeConfig[type]
                        const Icon = config.icon
                        const isSelected = formData.type === type
                        const isDisabled = type === 'combined'
                        
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => !isDisabled && handleTypeChange(type)}
                            disabled={isDisabled}
                            className={`
                              relative ${mode === 'debug' ? 'p-4' : 'p-6'} rounded-xl border-2 transition-all
                              ${isSelected
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' 
                                : isDisabled
                                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }
                            `}
                          >
                            <div className={mode === 'debug' ? "flex items-center space-x-3" : "flex flex-col items-center space-y-3"}>
                              <div className={`
                                ${mode === 'debug' ? 'w-10 h-10' : 'w-16 h-16'} rounded-full flex items-center justify-center
                                ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                              `}>
                                <Icon className={mode === 'debug' ? "h-5 w-5" : "h-8 w-8"} />
                              </div>
                              <div className={mode === 'debug' ? "" : "text-center"}>
                                <h3 className={mode === 'debug' ? "font-semibold text-sm" : "font-semibold text-lg"}>{config.label}</h3>
                                {mode !== 'debug' && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {config.description}
                                  </p>
                                )}
                                {isDisabled && (
                                  <Badge variant="secondary" className="mt-2">
                                    준비 중
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 right-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. 상표명 입력 */}
                <Card id="trademark-name" className={mode === 'debug' ? "" : "scroll-mt-24"}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-medium">
                        2
                      </span>
                      <span>상표명</span>
                      <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={mode === 'debug' ? "p-4 space-y-4" : "space-y-6"}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        등록하고자 하는 상표명을 입력해주세요
                      </label>
                      
                      {/* 상표 미리보기 - 정사각형 - 디버그 모드에서는 숨김 */}
                      {mode !== 'debug' && (
                        <div className="flex justify-center mb-6">
                          <div className="w-48 h-48 border-2 border-gray-300 rounded-lg bg-white flex items-center justify-center">
                          {formData.name ? (
                            <span className="text-2xl font-bold text-gray-900 text-center px-4">
                              {formData.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-center">
                              상표 미리보기
                            </span>
                          )}
                        </div>
                      </div>
                      )}
                      
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="나이키"
                        className="w-full text-lg"
                      />
                      
                      <div className="mt-2 text-xs text-gray-500">
                        • 정확한 분석을 위해 실제 사용하실 상표명을 입력해주세요
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. 이미지 업로드 (선택사항으로 항상 표시) */}
                <Card id="trademark-image" className={mode === 'debug' ? "" : "scroll-mt-24"}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className={`flex items-center justify-center w-6 h-6 ${formData.type === 'text' ? 'bg-gray-400' : 'bg-blue-600'} text-white rounded-full text-xs font-medium`}>
                        3
                      </span>
                      <span>이미지 업로드</span>
                      {formData.type === 'text' && <span className="text-sm text-gray-500">(선택)</span>}
                      {formData.type === 'combined' && <span className="text-red-500">*</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={mode === 'debug' ? "p-4" : ""}>
                    <div className={`border-2 border-dashed border-gray-300 rounded-lg ${mode === 'debug' ? 'p-4' : 'p-8'} text-center hover:border-gray-400 transition-colors`}>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className={`mx-auto ${mode === 'debug' ? 'h-8 w-8' : 'h-12 w-12'} text-gray-400`} />
                        <p className="mt-2 text-sm text-gray-600">
                          클릭하여 이미지를 업로드하세요
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF (최대 10MB)
                        </p>
                      </label>
                      {formData.image && (
                        <div className="mt-4 text-sm text-green-600">
                          ✓ {formData.image.name} 업로드됨
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 4. 사업 설명 */}
                <Card id="business-description" className={mode === 'debug' ? "" : "scroll-mt-24"}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-medium">
                        4
                      </span>
                      <span>상품/서비스 설명</span>
                      <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={mode === 'debug' ? "p-4 space-y-3" : "space-y-4"}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        상표를 사용할 구체적인 상품/서비스를 하나씩 입력해주세요
                      </label>
                      
                      {/* 작성 팁 - 라벨 바로 아래로 이동 - 디버그 모드에서는 간소화 */}
                      <Card className={`bg-blue-50 border-blue-200 ${mode === 'debug' ? 'mb-3' : 'mb-4'}`}>
                        <CardContent className={mode === 'debug' ? "p-2" : "p-3"}>
                          <div className="text-xs text-blue-900">
                            <p>
                              <strong>💡 구체적으로 작성할수록 정확한 분석이 가능합니다.</strong>
                            </p>
                            {mode !== 'debug' && (
                              <div className="pl-4 border-l-2 border-blue-300 mt-2">
                                <p className="font-medium">예시) "나이키" 상표를 사용하려는 경우:</p>
                                <ul className="mt-1 space-y-1 text-blue-800">
                                  <li>• 회사명으로 사용 (주식회사 나이키)</li>
                                  <li>• 운동화에 상표 부착</li>
                                  <li>• 티셔츠, 운동복에 로고 부착</li>
                                  <li>• 스포츠 가방, 모자에 브랜드 표시</li>
                                  <li>• 운동 기록 관리 모바일 앱에 사용</li>
                                  <li>• 온라인 쇼핑몰 웹사이트에 사용</li>
                                  <li>• 스포츠 용품 매장 운영</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* 동적 입력 필드 리스트 */}
                      <div className="space-y-3">
                        {formData.descriptions.map((description, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="flex-1">
                              <Input
                                type="text"
                                value={description}
                                onChange={(e) => updateDescriptionField(index, e.target.value)}
                                placeholder={
                                  index === 0 ? "예: 커피 전문점 운영" :
                                  index === 1 ? "예: 커피 및 음료 판매" :
                                  index === 2 ? "예: 디저트 판매" :
                                  index === 3 ? "예: 원두 소매업" :
                                  "상품/서비스를 구체적으로 입력"
                                }
                                className="w-full"
                              />
                            </div>
                            {/* 삭제 버튼 - 최소 1개는 유지 */}
                            {formData.descriptions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDescriptionField(index)}
                                className="p-2 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* 필드 추가 버튼 */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDescriptionField}
                        className="mt-3 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>항목 추가</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 분석 시작 버튼 */}
                <div className="flex justify-end pt-6">
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={
                      !formData.name.trim() || 
                      !formData.descriptions.some(desc => desc.trim()) ||
                      isAnalyzing
                    }
                    size="lg"
                    className="px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      '결과 확인'
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* 오른쪽: 사이드바 네비게이션 - 디버그 모드에서는 숨김 */}
            {mode !== 'debug' && (
              <div className="hidden lg:block w-64">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-sm">빠른 이동</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-1">
                    <a 
                      href="#trademark-type"
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                        activeSection === 'trademark-type' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium' 
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      1. 상표 유형
                    </a>
                    <a 
                      href="#trademark-name"
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                        activeSection === 'trademark-name' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium' 
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      2. 상표명
                    </a>
                    <a 
                      href="#trademark-image"
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                        activeSection === 'trademark-image' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium' 
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>3. 이미지 업로드</span>
                        {formData.type === 'text' && (
                          <span className="text-xs text-gray-500">(선택)</span>
                        )}
                      </span>
                    </a>
                    <a 
                      href="#business-description"
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-l-2 ${
                        activeSection === 'business-description' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium' 
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      4. 상품/서비스 설명
                    </a>
                  </nav>
                </CardContent>
              </Card>

              {/* 진행 상태 요약 */}
              <Card className="mt-4 sticky top-[360px]">
                <CardHeader>
                  <CardTitle className="text-sm">입력 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">상표 유형</span>
                      <span className={formData.type ? 'text-green-600' : 'text-gray-400'}>
                        {formData.type === 'text' ? '문자' : formData.type === 'combined' ? '복합' : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">상표명</span>
                      <span className={formData.name ? 'text-green-600' : 'text-gray-400'}>
                        {formData.name || '미입력'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">이미지</span>
                      <span className={formData.image ? 'text-green-600' : 'text-gray-400'}>
                        {formData.image ? '업로드됨' : '미업로드'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">설명</span>
                      <span className={formData.descriptions.some(desc => desc.trim()) ? 'text-green-600' : 'text-gray-400'}>
                        {formData.descriptions.filter(desc => desc.trim()).length > 0 
                          ? `${formData.descriptions.filter(desc => desc.trim()).length}개 입력` 
                          : '미입력'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </div>
      )}

      {/* 로그인 필요 모달 */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}
