"use client"

import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Progress } from "@/shared/components/ui/progress"
import {
  AlertTriangle,
  // CheckCircle, // Currently unused
  // Clock, // Currently unused
  // FileText, // Currently unused
  // TrendingUp, // Currently unused
  ArrowRight,
  Calendar,
  DollarSign,
  Target,
  // Shield, // Currently unused
} from "lucide-react"
import type { RejectionAnalysisResult } from "@/shared/types/rejection-response"

interface RejectionAnalysisProps {
  result: RejectionAnalysisResult
  onNext: () => void
}

export function RejectionAnalysis({ result, onNext }: RejectionAnalysisProps) {
  const { rejectionNotice, aiAnalysis, estimatedCost, timeline } = result

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-success-600 bg-success-100"
      case "MEDIUM":
        return "text-yellow-600 bg-warning-100"
      case "HARD":
        return "text-error-600 bg-error-100"
      default:
        return "text-neutral-600 bg-neutral-100"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "text-error-600 bg-error-100"
      case "MEDIUM":
        return "text-yellow-600 bg-warning-100"
      case "LOW":
        return "text-success-600 bg-success-100"
      default:
        return "text-neutral-600 bg-neutral-100"
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "RESPONSE":
        return "text-info-600 bg-info-100"
      case "APPEAL":
        return "text-purple-600 bg-purple-100"
      case "AMENDMENT":
        return "text-warning-600 bg-warning-100"
      case "ABANDON":
        return "text-error-600 bg-error-100"
      default:
        return "text-neutral-600 bg-neutral-100"
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case "RESPONSE":
        return "의견서 제출"
      case "APPEAL":
        return "심판 청구"
      case "AMENDMENT":
        return "보정서 제출"
      case "ABANDON":
        return "출원 포기"
      default:
        return action
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 분석 요약 */}
      <Card className="border-2 border-brand-500">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-brand-500" />
            <CardTitle className="text-2xl">AI 분석 결과</CardTitle>
          </div>
          <CardDescription>
            거절통지서를 분석한 AI 결과입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
            <div>
              <div className="text-sm text-neutral-500">상표명</div>
              <div className="font-semibold text-lg">{rejectionNotice.trademarkName}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">출원번호</div>
              <div className="font-semibold">{rejectionNotice.applicationNumber}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">의견서 제출 마감일</div>
              <div className="font-semibold text-error-600">{rejectionNotice.deadline}</div>
            </div>
          </div>

          {/* AI 분석 요약 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">📋 분석 요약</h3>
            <p className="text-neutral-700 leading-relaxed bg-info-50 p-4 rounded-lg">
              {aiAnalysis.summary}
            </p>
          </div>

          {/* 주요 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-500 mb-1">
                    {aiAnalysis.successProbability}%
                  </div>
                  <div className="text-sm text-neutral-600">성공 가능성</div>
                  <Progress value={aiAnalysis.successProbability} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge className={`${getDifficultyColor(aiAnalysis.overallDifficulty)} mb-2`}>
                    {aiAnalysis.overallDifficulty === "EASY" && "쉬움"}
                    {aiAnalysis.overallDifficulty === "MEDIUM" && "보통"}
                    {aiAnalysis.overallDifficulty === "HARD" && "어려움"}
                  </Badge>
                  <div className="text-sm text-neutral-600">난이도</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge className={`${getActionColor(aiAnalysis.recommendedAction)} mb-2`}>
                    {getActionText(aiAnalysis.recommendedAction)}
                  </Badge>
                  <div className="text-sm text-neutral-600">권장 대응</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-success-600 mb-1">
                    {rejectionNotice.rejectionReasons.length}개
                  </div>
                  <div className="text-sm text-neutral-600">거절 사유</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 거절 사유 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📝 거절 사유 상세 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {rejectionNotice.rejectionReasons.map((reason, index) => (
            <div key={reason.id} className="border rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-lg">거절사유 {index + 1}</span>
                    <Badge className={getSeverityColor(reason.severity)}>
                      {reason.severity === "HIGH" && "높음"}
                      {reason.severity === "MEDIUM" && "보통"}
                      {reason.severity === "LOW" && "낮음"}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-brand-500 mb-2">{reason.title}</h4>
                  <div className="text-sm text-neutral-500 mb-2">조문: {reason.code}</div>
                  <p className="text-neutral-700 leading-relaxed">{reason.description}</p>
                </div>
              </div>

              {/* 인용 상표 */}
              {reason.citedTrademarks && reason.citedTrademarks.length > 0 && (
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <h5 className="font-semibold mb-3">인용 상표</h5>
                  <div className="space-y-3">
                    {reason.citedTrademarks.map((trademark) => (
                      <div key={trademark.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-semibold">{trademark.name}</div>
                          <div className="text-sm text-neutral-600">
                            등록번호: {trademark.registrationNumber} | 출원인: {trademark.applicant}
                          </div>
                          <div className="text-sm text-neutral-600">분류: {trademark.classification}</div>
                        </div>
                        <Badge className="bg-error-100 text-error-600">
                          {trademark.similarity}% 유사
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 주요 이슈 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">⚠️ 주요 이슈</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {aiAnalysis.mainIssues.map((issue, index) => (
              <li key={index} className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-700">{issue}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 비용 및 일정 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-success-600" />
              <CardTitle>예상 비용</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-info-50 rounded">
              <span>셀프 대응</span>
              <span className="font-semibold text-info-600">
                ₩{estimatedCost.selfResponse.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-neutral-50 rounded">
              <span>전문가 대응</span>
              <span className="font-semibold">
                ₩{estimatedCost.professionalResponse.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-error-50 rounded">
              <span>심판 절차</span>
              <span className="font-semibold text-error-600">
                ₩{estimatedCost.appealProcess.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <CardTitle>중요 일정</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-error-50 rounded">
              <span>대응 마감일</span>
              <span className="font-semibold text-error-600">{timeline.responseDeadline}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span>권장 제출일</span>
              <span className="font-semibold text-yellow-600">{timeline.recommendedSubmissionDate}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-info-50 rounded">
              <span>예상 처리기간</span>
              <span className="font-semibold text-info-600">{timeline.estimatedProcessingTime}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 다음 단계 */}
      <Card className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">분석이 완료되었습니다!</h3>
            <p className="text-lg opacity-90">
              이제 AI가 추천하는 맞춤형 대응 전략을 확인해보세요
            </p>
            <Button
              size="lg"
              className="bg-white text-brand-500 hover:bg-neutral-100"
              onClick={onNext}
            >
              대응 전략 보기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 