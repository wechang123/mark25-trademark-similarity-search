"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
// import { Badge } from "@/shared/components/ui/badge" // Currently unused
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Textarea } from "@/shared/components/ui/textarea"
// import { Input } from "@/shared/components/ui/input" // Currently unused
// import { Label } from "@/shared/components/ui/label" // Currently unused
import {
  FileText,
  Download,
  Edit,
  Save,
  ArrowLeft,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Clock,
  Brain,
  Copy,
  RefreshCw,
  Zap,
} from "lucide-react"
import type { RejectionAnalysisResult, ResponseDocument } from "@/shared/types/rejection-response"

interface ResponseDocumentHelperProps {
  result: RejectionAnalysisResult
  onBack: () => void
}

export function ResponseDocumentHelper({ result, onBack }: ResponseDocumentHelperProps) {
  const [currentDocument, setCurrentDocument] = useState<"opinion" | "amendment">("opinion")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [editableContent, setEditableContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // AI 대응서 생성
  const generateDocument = async () => {
    setIsGenerating(true)
    
    // 모의 생성 과정 (실제로는 AI API 호출)
    setTimeout(() => {
      const mockContent = generateMockDocument(currentDocument)
      setGeneratedContent(mockContent)
      setEditableContent(mockContent)
      setIsGenerating(false)
    }, 3000)
  }

  // 모의 문서 생성 함수
  const generateMockDocument = (type: "opinion" | "amendment") => {
    const baseInfo = `
출원번호: ${result.rejectionNotice.applicationNumber}
상표: ${result.rejectionNotice.trademarkName}
출원인: [출원인명]
대리인: [대리인명]

특허청장 귀하

${type === "opinion" ? "의견서" : "보정서"}

1. 출원번호: ${result.rejectionNotice.applicationNumber}
2. 상표: ${result.rejectionNotice.trademarkName}
3. 거절이유통지일: ${result.rejectionNotice.rejectionDate}

존경하는 심사관님께,

`

    if (type === "opinion") {
      return baseInfo + `
위 출원에 대하여 ${result.rejectionNotice.rejectionDate}자로 거절이유통지서를 받았으므로, 다음과 같이 의견을 진술드립니다.

【거절이유에 대한 의견】

${result.rejectionNotice.rejectionReasons.map((reason, index) => `
거절이유 ${index + 1}: ${reason.title}

1. 거절이유의 요지
${reason.description}

2. 출원인의 의견
출원상표 "${result.rejectionNotice.trademarkName}"는 다음과 같은 이유로 등록받을 수 있다고 사료됩니다.

가. 상표의 특징
출원상표는 독창적이고 특유한 구성을 가지고 있어 수요자로 하여금 상품의 출처를 명확히 식별할 수 있게 하는 식별력을 가지고 있습니다.

나. 인용상표와의 차별성
${reason.citedTrademarks?.map(trademark => `
- 인용상표 "${trademark.name}"과 비교 시, 외관, 호칭, 관념 모든 면에서 명확히 구별됩니다.
- 실제 거래 실정에서 수요자가 혼동할 가능성은 없다고 판단됩니다.
`).join("") || ""}

다. 사용에 의한 식별력 획득
출원상표는 출원 전부터 계속적으로 사용되어 왔으며, 관련 업계 및 수요자들 사이에서 출원인의 상품을 나타내는 표지로 인식되고 있습니다.

3. 결론
따라서 출원상표는 상표법상 등록요건을 충족하므로 등록되어야 한다고 사료됩니다.
`).join("")}

이상과 같은 이유로 거절이유는 타당하지 않다고 판단되오니, 심사관님께서는 재고하시어 등록결정하여 주시기 바랍니다.

2024년 12월 일

출원인 [성명]
대리인 [성명]
`
    } else {
      return baseInfo + `
위 출원에 대하여 다음과 같이 보정합니다.

【보정의 내용】

1. 지정상품의 보정
기존: [기존 지정상품]
보정후: [보정된 지정상품]

2. 보정의 이유
거절이유통지서에서 지적된 사항을 해결하기 위하여 지정상품을 한정 보정합니다.

【보정 후 상표의 등록 가능성】

보정된 지정상품은 다음과 같은 이유로 등록받을 수 있다고 사료됩니다:

1. 선행상표와의 차별성 확보
2. 명확한 상품 분류 및 범위 한정
3. 혼동 가능성 제거

이상과 같이 보정하오니 등록결정하여 주시기 바랍니다.

2024년 12월 일

출원인 [성명]
대리인 [성명]
`
    }
  }

  const handleSave = () => {
    setGeneratedContent(editableContent)
    setIsEditing(false)
    alert("변경사항이 저장되었습니다.")
  }

  const handleDownload = () => {
    const blob = new Blob([editableContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentDocument === "opinion" ? "의견서" : "보정서"}_${result.rejectionNotice.trademarkName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent)
    alert("클립보드에 복사되었습니다.")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 헤더 */}
      <Card className="border-2 border-brand-500">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-brand-500" />
            <CardTitle className="text-2xl">AI 대응서 작성 도우미</CardTitle>
          </div>
          <CardDescription>
            선택된 전략을 바탕으로 전문적인 대응서를 생성하고 편집하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-info-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-brand-500">의견서</div>
              <div className="text-sm text-neutral-600">권장 문서</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-success-600">{result.aiAnalysis.successProbability}%</div>
              <div className="text-sm text-neutral-600">예상 성공률</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">3-5페이지</div>
              <div className="text-sm text-neutral-600">예상 분량</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-warning-600">{result.timeline.recommendedSubmissionDate}</div>
              <div className="text-sm text-neutral-600">권장 제출일</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 문서 타입 선택 */}
      <Tabs value={currentDocument} onValueChange={(value) => setCurrentDocument(value as "opinion" | "amendment")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="opinion">의견서</TabsTrigger>
          <TabsTrigger value="amendment">보정서</TabsTrigger>
        </TabsList>

        {/* 의견서 탭 */}
        <TabsContent value="opinion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-brand-500" />
                <span>AI 의견서 생성</span>
              </CardTitle>
              <CardDescription>
                거절이유별 맞춤형 의견서를 AI가 자동으로 생성합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!generatedContent ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">의견서를 생성해보세요</h3>
                  <p className="text-neutral-600 mb-6">AI가 선택된 전략을 바탕으로 전문적인 의견서를 작성합니다</p>
                  <Button
                    size="lg"
                    onClick={generateDocument}
                    disabled={isGenerating}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        AI가 의견서 작성 중...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 w-5 h-5" />
                        AI 의견서 생성하기
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 문서 도구 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? "편집 완료" : "편집하기"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-2" />
                      복사
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </Button>
                    <Button variant="outline" size="sm" onClick={generateDocument}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      재생성
                    </Button>
                  </div>

                  {/* 문서 편집 영역 */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        rows={25}
                        className="font-mono text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleSave} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditableContent(generatedContent)
                            setIsEditing(false)
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-50 p-6 rounded-lg border max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {generatedContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보정서 탭 */}
        <TabsContent value="amendment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-brand-500" />
                <span>AI 보정서 생성</span>
              </CardTitle>
              <CardDescription>
                지정상품 보정이 필요한 경우 보정서를 생성합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning-800">보정 안내</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      현재 거절사유가 지정상품 관련이 아닌 경우, 보정서보다는 의견서 제출이 더 적합할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {!generatedContent ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">보정서를 생성해보세요</h3>
                  <p className="text-neutral-600 mb-6">지정상품을 한정하여 거절사유를 해결하는 보정서를 작성합니다</p>
                  <Button
                    size="lg"
                    onClick={generateDocument}
                    disabled={isGenerating}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        AI가 보정서 작성 중...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 w-5 h-5" />
                        AI 보정서 생성하기
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 동일한 문서 도구와 편집 영역 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? "편집 완료" : "편집하기"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="w-4 h-4 mr-2" />
                      복사
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </Button>
                    <Button variant="outline" size="sm" onClick={generateDocument}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      재생성
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        rows={25}
                        className="font-mono text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleSave} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditableContent(generatedContent)
                            setIsEditing(false)
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-50 p-6 rounded-lg border max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {generatedContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 추가 도움 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <span>작성 가이드</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">생성된 문서를 그대로 사용하거나 필요에 따라 수정하세요</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">출원인명, 대리인명 등 개인정보는 실제 정보로 수정하세요</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">증거자료가 필요한 경우 별도로 준비하여 첨부하세요</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">제출 전 전문가 검토를 받는 것을 권장합니다</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span>중요 일정</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-error-50 rounded border-l-4 border-red-400">
              <div className="font-semibold text-error-800">의견서 제출 마감일</div>
              <div className="text-error-600">{result.rejectionNotice.deadline}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <div className="font-semibold text-warning-800">권장 제출일</div>
              <div className="text-yellow-600">{result.timeline.recommendedSubmissionDate}</div>
            </div>
            <div className="p-3 bg-info-50 rounded border-l-4 border-blue-400">
              <div className="font-semibold text-info-800">예상 처리기간</div>
              <div className="text-info-600">{result.timeline.estimatedProcessingTime}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 전문가 상담 CTA */}
      <Card className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">더 확실한 대응이 필요하시나요?</h3>
            <p className="text-lg opacity-90">
              전문가가 직접 검토하고 보완하는 프리미엄 대응 서비스를 이용해보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-brand-500 hover:bg-neutral-100"
                onClick={() => alert("전문가 상담 서비스 준비 중입니다!")}
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                전문가 상담 신청
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-brand-500"
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                이전 단계로
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 