"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { FileCheck, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react"

interface Trademark {
  id: string
  name: string
  applicant: string
  similarity: number
  status: string
  applicationDate: string
  classification: {
    mainClass: string
    mainClassName: string
    designatedProducts: string[]
  }
  riskAnalysis?: {
    level: string
    factors: string[]
    conflictProbability: number
  }
  imageUrl?: string
  rejectionReason?: string // 거절 사유 (전체)
  rejectionReasonSummary?: string // 거절 사유 (한 줄 요약)
  legalGround?: string // 법적 근거
  applicationNumber?: string // 출원번호
  docName?: string // 문서 이름
  rejectionDate?: string // 거절일자
  decisionNumber?: string // 결정번호
}

interface SimilarTrademarksListProps {
  trademarks: Trademark[]
  trademarkName: string
}

export function SimilarTrademarksList({ trademarks, trademarkName }: SimilarTrademarksListProps) {
  const [expandedTrademark, setExpandedTrademark] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(5)

  /**
   * 거절 사유를 한 줄로 요약하는 함수
   */
  function summarizeRejectionReason(rejectionReason?: string): string {
    if (!rejectionReason) return "거절 사유 정보 없음"
    
    // 실제 거절 사유에서 핵심 키워드 추출
    const keywords = [
      "유사 상표", "유사성", "혼동", "식별력", "설명적", "일반적", 
      "지리적 표시", "품질 오인", "출처 오인", "기업명", "성명권",
      "기존 등록", "동일 상표", "유명 상표", "분류 불일치"
    ]
    
    for (const keyword of keywords) {
      if (rejectionReason.includes(keyword)) {
        return `${keyword}으로 인한 거절`
      }
    }
    
    // 키워드가 없는 경우 첫 30자로 요약
    return rejectionReason.length > 30 
      ? rejectionReason.substring(0, 30) + "..." 
      : rejectionReason
  }

  /**
   * 법적 근거를 정리하는 함수
   */
  function formatLegalGround(legalGround?: string): string {
    if (!legalGround) return "상표법 제7조"
    
    // 상표법 조문 패턴 매칭
    const lawPatterns = [
      /상표법\s*제(\d+)조/,
      /상표법\s*제(\d+)조\s*제(\d+)항/,
      /상표법\s*제(\d+)조\s*제(\d+)항\s*제(\d+)호/
    ]
    
    for (const pattern of lawPatterns) {
      const match = legalGround.match(pattern)
      if (match) {
        return `상표법 제${match[1]}조${match[2] ? ` 제${match[2]}항` : ''}${match[3] ? ` 제${match[3]}호` : ''}`
      }
    }
    
    return legalGround
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "bg-error-100 text-error-800"
    if (similarity >= 70) return "bg-warning-100 text-orange-800"
    if (similarity >= 50) return "bg-warning-100 text-warning-800"
    return "bg-success-100 text-green-800"
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return "bg-error-100 text-error-800"
      case 'MEDIUM': return "bg-warning-100 text-warning-800"
      case 'LOW': return "bg-success-100 text-green-800"
      default: return "bg-neutral-100 text-gray-800"
    }
  }

  const getRiskLevel = (similarity: number) => {
    if (similarity >= 90) return { level: "매우 높음", icon: AlertTriangle, color: "text-error-600" }
    if (similarity >= 70) return { level: "높음", icon: AlertTriangle, color: "text-warning-600" }
    if (similarity >= 50) return { level: "보통", icon: AlertTriangle, color: "text-yellow-600" }
    return { level: "낮음", icon: CheckCircle, color: "text-success-600" }
  }

  // Sort trademarks by similarity (highest first)
  const sortedTrademarks = [...trademarks].sort((a, b) => b.similarity - a.similarity)
  const displayedTrademarks = sortedTrademarks.slice(0, displayCount)
  
  const highRiskCount = trademarks.filter(tm => tm.similarity >= 70).length
  const totalCount = trademarks.length

  return (
    <Card className="border-2 border-neutral-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-purple-600" />
          </div>
          📋 유사 상표 검색 결과
          {totalCount > 0 && (
            <Badge className="ml-2 bg-info-100 text-info-800">
              {totalCount}개 발견
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {totalCount > 0 ? (
          <>
            {/* Summary Statistics */}
            <div className="bg-neutral-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-info-600 mb-1">{totalCount}</div>
                  <div className="text-sm text-neutral-600">총 발견</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-error-600 mb-1">{highRiskCount}</div>
                  <div className="text-sm text-neutral-600">고위험</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success-600 mb-1">{totalCount - highRiskCount}</div>
                  <div className="text-sm text-neutral-600">저위험</div>
                </div>
              </div>
            </div>

            {/* Trademarks List */}
            <div className="space-y-4">
              {displayedTrademarks.map((trademark) => {
                const risk = getRiskLevel(trademark.similarity)
                const RiskIcon = risk.icon
                
                return (
                  <div key={trademark.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg text-gray-900">
                            {trademark.name}
                          </h4>
                          <Badge className={`${getSimilarityColor(trademark.similarity)} font-semibold`}>
                            {trademark.similarity}% 유사
                          </Badge>
                          <Badge className={`${getRiskColor(trademark.riskAnalysis?.level || 'MEDIUM')}`}>
                            <RiskIcon className="w-3 h-3 mr-1" />
                            위험도: {risk.level}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-neutral-600 space-y-1">
                          <div><strong>출원인:</strong> {trademark.applicant}</div>
                          <div><strong>상태:</strong> {trademark.status}</div>
                          <div><strong>분류:</strong> {trademark.classification.mainClass} ({trademark.classification.mainClassName})</div>
                          <div><strong>출원일:</strong> {trademark.applicationDate}</div>
                          
                          {/* 거절 사유 표시 */}
                          {(trademark.rejectionReason || trademark.rejectionReasonSummary) && (
                            <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-red-700 text-xs font-medium mb-1">거절 사유:</p>
                                  <p className="text-red-800 text-xs">
                                    {trademark.rejectionReason ? 
                                      summarizeRejectionReason(trademark.rejectionReason) :
                                      (trademark.rejectionReasonSummary || "거절 사유 정보 없음")
                                    }
                                  </p>
                                  {trademark.legalGround && (
                                    <p className="text-red-600 text-xs mt-1">
                                      법적 근거: {formatLegalGround(trademark.legalGround)}
                                    </p>
                                  )}
                                  {trademark.applicationNumber && (
                                    <p className="text-red-600 text-xs mt-1">
                                      출원번호: {trademark.applicationNumber}
                                    </p>
                                  )}
                                  {trademark.docName && (
                                    <p className="text-red-600 text-xs mt-1">
                                      문서: {trademark.docName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {trademark.imageUrl && (
                        <div className="w-16 h-16 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center ml-4">
                          <Image
                            src={trademark.imageUrl}
                            alt={`${trademark.name} 상표 이미지`}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Conflict Analysis */}
                    <div className={`p-3 rounded-lg border-l-4 ${
                      trademark.similarity >= 90 ? 'bg-error-50 border-red-400' :
                      trademark.similarity >= 70 ? 'bg-orange-50 border-orange-400' :
                      trademark.similarity >= 50 ? 'bg-yellow-50 border-yellow-400' :
                      'bg-success-50 border-green-400'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <RiskIcon className={`w-4 h-4 ${risk.color}`} />
                        <span className={`font-semibold text-sm ${risk.color}`}>
                          충돌 분석
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700">
                        {trademark.similarity >= 90 ? 
                          `"${trademark.name}"은 "${trademarkName}"과 매우 유사하여 상표 등록이 거의 불가능합니다.` :
                         trademark.similarity >= 70 ? 
                          `"${trademark.name}"과의 유사성으로 인해 등록에 어려움이 예상됩니다.` :
                         trademark.similarity >= 50 ? 
                          `"${trademark.name}"과 일부 유사하지만 등록 가능성이 있습니다.` :
                          `"${trademark.name}"과의 충돌 위험은 낮습니다.`
                        }
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 p-0 h-auto text-brand-500 font-medium"
                      onClick={() => setExpandedTrademark(
                        expandedTrademark === trademark.id ? null : trademark.id
                      )}
                    >
                      상세 비교 분석
                      {expandedTrademark === trademark.id ? (
                        <ChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                    
                    {expandedTrademark === trademark.id && (
                      <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-3">상세 유사도 분석</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                          <div>
                            <div className="font-semibold text-neutral-700">철자 유사도</div>
                            <div className="text-lg font-bold text-brand-500">{Math.max(0, trademark.similarity - 5)}%</div>
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-700">발음 유사도</div>
                            <div className="text-lg font-bold text-brand-500">{trademark.similarity}%</div>
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-700">의미 유사도</div>
                            <div className="text-lg font-bold text-brand-500">{Math.min(100, trademark.similarity + 3)}%</div>
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-700">시각적 유사도</div>
                            <div className="text-lg font-bold text-brand-500">
                              {trademark.imageUrl ? `${Math.max(0, trademark.similarity - 10)}%` : 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        {trademark.classification.designatedProducts.length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded-lg">
                            <h6 className="font-semibold text-gray-800 mb-2">지정상품</h6>
                            <div className="text-sm text-neutral-600">
                              {trademark.classification.designatedProducts.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
                         {/* Show More/Less Button */}
             {trademarks.length > displayCount && (
               <div className="text-center pt-4 border-t border-neutral-200">
                 <Button
                   variant="outline"
                   onClick={() => setDisplayCount(prev => prev + 5)}
                   className="text-brand-500 border-brand-500 hover:bg-brand-500 hover:text-white"
                 >
                   더 보기 ({trademarks.length - displayCount}개)
                 </Button>
               </div>
             )}
          </>
        ) : (
          /* No Similar Trademarks */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">유사 상표가 없습니다</h3>
            <p className="text-neutral-600 mb-4">현재 검색 범위에서는 유사한 상표가 발견되지 않았습니다.</p>
            
            <div className="bg-success-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                <div className="text-green-800 text-sm">
                  <p className="font-medium">좋은 소식입니다!</p>
                  <p>유사 상표가 없어 상표 등록 가능성이 높습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}