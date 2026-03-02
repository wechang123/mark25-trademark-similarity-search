'use client'

import React from 'react'
import { Progress } from '@/shared/components/ui/progress'
import { Separator } from '@/shared/components/ui/separator'
import { Badge } from '@/shared/components/ui/badge'

interface AnalysisDetailPanelProps {
  results: {
    registration_possibility: number
    designated_goods_compatibility_score?: number
    distinctiveness_score?: number
    prior_trademark_similarity_score?: number
    final_recommendation?: string
    designated_goods_compatibility_reason?: string
    distinctiveness_reason?: string
    prior_trademark_similarity_reason?: string
  }
  designatedProducts?: string[]
  classificationCodes?: string[] | number[]
}

export function AnalysisDetailPanel({ 
  results, 
  designatedProducts, 
  classificationCodes 
}: AnalysisDetailPanelProps) {
  
  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const ScoreSection = ({ 
    title, 
    score, 
    reason 
  }: { 
    title: string
    score: number | undefined
    reason: string | undefined
  }) => {
    if (score === undefined || score === null) return null
    
    return (
      <div className="border-l-4 border-blue-500 pl-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
          <span className="text-lg font-bold text-gray-900">{score}점</span>
        </div>
        {reason && (
          <p className="text-sm text-gray-600">{reason}</p>
        )}
      </div>
    )
  }

  return (
    <div className="py-6 px-6 bg-gray-50">
      {/* 3대 평가 지표 */}
      <div className="space-y-4 mb-6">
        <ScoreSection
          title="지정상품 적합성"
          score={results.designated_goods_compatibility_score}
          reason={results.designated_goods_compatibility_reason}
        />
        
        <ScoreSection
          title="식별력"
          score={results.distinctiveness_score}
          reason={results.distinctiveness_reason}
        />
        
        <ScoreSection
          title="선행상표 유사도"
          score={results.prior_trademark_similarity_score}
          reason={results.prior_trademark_similarity_reason}
        />
      </div>

      <Separator className="my-4" />

      {/* 최종 권고사항 */}
      {results.final_recommendation && (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-900">최종 권고사항</h4>
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {results.final_recommendation}
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </>
      )}

      {/* 지정상품 및 분류코드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {designatedProducts && designatedProducts.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold mb-2 text-gray-900">지정상품</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              {designatedProducts.map((product, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{product}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {classificationCodes && classificationCodes.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold mb-2 text-gray-900">상품분류코드</h5>
            <div className="flex flex-wrap gap-1">
              {classificationCodes.map((code, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-700"
                >
                  제{code}류
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}