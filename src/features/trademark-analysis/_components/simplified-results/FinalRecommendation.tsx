/**
 * 최종 권고사항 섹션 컴포넌트
 * DB의 final_recommendation, detailed_advice, legal_risks, action_items 표시
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';

interface FinalRecommendationProps {
  data: {
    finalRecommendation?: string;
    detailedAdvice?: string;
    legalRisks?: string[];
    actionItems?: string[];
    registrationProbability?: number;
  };
}

// 권고사항 레벨에 따른 아이콘 및 스타일
const getRecommendationStyle = (recommendation: string) => {
  if (recommendation?.includes('등록 진행 권장')) {
    return {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      badge: 'success'
    };
  } else if (recommendation?.includes('신중 검토 필요')) {
    return {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      badge: 'warning'
    };
  } else if (recommendation?.includes('등록 재검토 권장')) {
    return {
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      badge: 'destructive'
    };
  }
  
  return {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    badge: 'default'
  };
};

export function FinalRecommendation({ data }: FinalRecommendationProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['recommendation', 'action', 'risks'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const style = getRecommendationStyle(data.finalRecommendation || '');

  return (
    <Card className="overflow-hidden">
      <CardHeader className={cn(style.bgColor, "border-b", style.borderColor)}>
        <CardTitle className="flex items-center gap-2">
          {style.icon}
          <span>최종 권고사항</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        {/* 최종 권고 */}
        <div className={cn(
          "p-4 rounded-lg border-2",
          style.bgColor,
          style.borderColor
        )}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={cn("font-semibold text-lg", style.textColor)}>
              {data.finalRecommendation || '신중 검토 필요'}
            </h4>
            <Badge variant={style.badge as any}>
              등록 가능성 {data.registrationProbability || 0}%
            </Badge>
          </div>
          
          {data.detailedAdvice && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.detailedAdvice}
            </p>
          )}
        </div>

        {/* 권장 조치사항 */}
        {data.actionItems && data.actionItems.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('action')}
              className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <ChevronRight 
                  className={cn(
                    "w-5 h-5 text-gray-500 transition-transform",
                    expandedSections.has('action') && "rotate-90"
                  )}
                />
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">권장 조치사항</h4>
                </div>
              </div>
              <Badge variant="outline">{data.actionItems.length}개</Badge>
            </button>
            
            {expandedSections.has('action') && (
              <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                <div className="space-y-2">
                  {data.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-700">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700 flex-1">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 법적 리스크 */}
        {data.legalRisks && data.legalRisks.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('risks')}
              className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <ChevronRight 
                  className={cn(
                    "w-5 h-5 text-gray-500 transition-transform",
                    expandedSections.has('risks') && "rotate-90"
                  )}
                />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">법적 리스크 및 주의사항</h4>
                </div>
              </div>
              <Badge variant="outline" className="bg-orange-50">
                {data.legalRisks.length}개
              </Badge>
            </button>
            
            {expandedSections.has('risks') && (
              <div className="px-4 pb-4 pt-2 border-t bg-orange-50">
                <div className="space-y-2">
                  {data.legalRisks.map((risk, idx) => (
                    <Alert key={idx} className="border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-sm">
                        {risk}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 다음 단계 안내 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">다음 단계</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 위 권고사항을 참고하여 상표 출원 전략을 수립하세요</p>
            <p>• 필요시 전문 변리사와 상담을 진행하세요</p>
            <p>• 법적 리스크가 있는 경우, 상표를 수정하거나 다른 안을 검토하세요</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}