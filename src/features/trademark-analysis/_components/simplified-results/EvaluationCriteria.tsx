/**
 * 5가지 평가 기준 표시 컴포넌트
 * 각 기준별로 점수, 요약, 상세 내용 토글 표시
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/shared/components/ui/table';
import { cn } from '@/shared/utils';
import { 
  ArticleViolation, 
  FamousnessViolation, 
  ConflictingTrademark,
  InternetSearchResults 
} from '../../_types/simplified-types';

interface EvaluationCriteriaProps {
  data: {
    // Scores
    codeCompatibilityScore: number;
    distinctivenessScore: number;
    similarityScore: number;
    nonRegistrableScore: number;
    famousnessScore: number;
    
    // Summaries
    codeCompatibilityReason: string;
    distinctivenessReason: string;
    similarityReason: string;
    nonRegistrableSummary: string;
    famousnessSummary: string;
    
    // Detailed data
    designatedGoods?: string[];
    designatedGoodsRecommended?: any; // JSONB from DB
    article33Violations?: ArticleViolation[];
    article34_1to6Violations?: ArticleViolation[];
    article34_9to14Violations?: FamousnessViolation[];
    article34_1_7Violation?: boolean;
    article35_1Violation?: boolean;
    conflictingTrademarks?: ConflictingTrademark[];
    internetSearchResults?: InternetSearchResults;
  };
}

// Helper function to get badge variant based on score
const getScoreBadgeVariant = (score: number): string => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  if (score >= 40) return 'secondary';
  return 'destructive';
};

// Helper function to get score icon
const getScoreIcon = (score: number) => {
  if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  if (score >= 40) return <AlertCircle className="w-4 h-4 text-orange-600" />;
  return <XCircle className="w-4 h-4 text-red-600" />;
};

// Component for displaying violations
const ViolationsList: React.FC<{ violations: ArticleViolation[] }> = ({ violations }) => {
  if (!violations || violations.length === 0) {
    return <p className="text-green-600 font-medium">✅ 위반사항 없음</p>;
  }

  const violatedItems = violations.filter(v => v.violated);
  const passedItems = violations.filter(v => !v.violated);

  return (
    <div className="space-y-3">
      {violatedItems.length > 0 && (
        <div>
          <h5 className="font-medium text-red-700 mb-2">❌ 위반 사항</h5>
          {violatedItems.map((violation, idx) => (
            <div key={idx} className="ml-4 mb-2 pb-2 border-l-2 border-red-500 pl-3">
              <p className="font-medium text-sm">{violation.clauseText}</p>
              <p className="text-xs text-gray-600 mt-1">{violation.description}</p>
              <p className="text-xs text-red-600 mt-1">📌 {violation.reason}</p>
            </div>
          ))}
        </div>
      )}
      
      {passedItems.length > 0 && (
        <div>
          <h5 className="font-medium text-green-700 mb-2">✅ 통과 사항</h5>
          {passedItems.map((violation, idx) => (
            <div key={idx} className="ml-4 mb-2 pb-2 border-l-2 border-green-500 pl-3">
              <p className="font-medium text-sm">{violation.clauseText}</p>
              <p className="text-xs text-gray-600 mt-1">{violation.description}</p>
              <p className="text-xs text-green-600 mt-1">✓ {violation.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component for displaying conflicting trademarks
const ConflictingTrademarksTable: React.FC<{ trademarks: ConflictingTrademark[] }> = ({ trademarks }) => {
  if (!trademarks || trademarks.length === 0) {
    return <p className="text-green-600 font-medium">✅ 충돌 상표 없음</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>상표명</TableHead>
          <TableHead>출원번호</TableHead>
          <TableHead>유사도</TableHead>
          <TableHead>위험도</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trademarks.map((tm, idx) => (
          <TableRow key={idx}>
            <TableCell className="font-medium">{tm.name}</TableCell>
            <TableCell>{tm.applicationNumber}</TableCell>
            <TableCell>{tm.similarityType}</TableCell>
            <TableCell>
              <Badge variant={
                tm.riskLevel === '높음' ? 'destructive' : 
                tm.riskLevel === '중간' ? 'outline' : 'secondary'
              }>
                {tm.riskLevel}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export function EvaluationCriteria({ data }: EvaluationCriteriaProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  const toggleCriterion = (criterion: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criterion)) {
      newExpanded.delete(criterion);
    } else {
      newExpanded.add(criterion);
    }
    setExpandedCriteria(newExpanded);
  };

  const criteria = [
    {
      id: 'codeCompatibility',
      title: '지정상품 적합성',
      score: data.codeCompatibilityScore,
      summary: data.codeCompatibilityReason,
      details: (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">🔍 사업 영역과 지정상품의 일치도를 평가한 결과입니다.</p>
            <p className="text-xs text-gray-500">적합성이 높을수록 상표 보호 범위가 명확해집니다.</p>
          </div>
          {data.designatedGoods && data.designatedGoods.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">📋 현재 선택된 지정상품</h5>
              <div className="flex flex-wrap gap-2">
                {data.designatedGoods.map((code, idx) => (
                  <Badge key={idx} variant="outline">{code}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {data.designatedGoodsRecommended && (
            <div>
              <h5 className="font-medium mb-2">✨ 추가 권장 지정상품</h5>
              <div className="space-y-2">
                {Array.isArray(data.designatedGoodsRecommended) ? 
                  data.designatedGoodsRecommended.map((item, idx) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded-lg">
                      <Badge variant="secondary" className="mb-1">{typeof item === 'string' ? item : item.code || item.name}</Badge>
                      {typeof item === 'object' && item.description && (
                        <p className="text-sm text-gray-600 ml-2">{item.description}</p>
                      )}
                    </div>
                  )) : 
                  <p className="text-sm text-gray-600">{JSON.stringify(data.designatedGoodsRecommended)}</p>
                }
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'distinctiveness',
      title: '상표 식별력',
      score: data.distinctivenessScore,
      summary: data.distinctivenessReason,
      details: (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">🎯 상표가 소비자에게 구별력을 가지는지 평가합니다.</p>
            <p className="text-xs text-gray-500">상표법 제33조에 따른 식별력 요건 검토</p>
          </div>
          <div>
            <h5 className="font-medium mb-3">📊 상표법 제33조 검토 결과</h5>
            <ViolationsList violations={data.article33Violations || []} />
          </div>
        </div>
      )
    },
    {
      id: 'priorSimilarity',
      title: '선행상표 유사도',
      score: data.similarityScore,
      summary: data.similarityReason,
      details: (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">🔍 기존 등록된 상표와의 유사성을 분석한 결과입니다.</p>
            <p className="text-xs text-gray-500">외관, 호칭, 관념 유사성을 종합적으로 평가</p>
          </div>
          <div>
            <h5 className="font-medium mb-2">⚖️ 법적 검토 결과</h5>
            <div className="space-y-1 ml-4">
              <p className="text-sm">
                • 제34조 제1항 제7호 위반: {data.article34_1_7Violation ? 
                  <span className="text-red-600 font-medium">❌ 위반</span> : 
                  <span className="text-green-600 font-medium">✅ 없음</span>}
              </p>
              <p className="text-sm">
                • 제35조 제1항 위반: {data.article35_1Violation ? 
                  <span className="text-red-600 font-medium">❌ 위반</span> : 
                  <span className="text-green-600 font-medium">✅ 없음</span>}
              </p>
            </div>
          </div>
          
          {data.conflictingTrademarks && data.conflictingTrademarks.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">🔍 충돌 상표 목록</h5>
              <ConflictingTrademarksTable trademarks={data.conflictingTrademarks} />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'nonRegistrable',
      title: '불등록사유 검토',
      score: data.nonRegistrableScore,
      summary: data.nonRegistrableSummary,
      details: (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">⚠️ 공공질서, 선량한 풍속 등에 위배되는지 검토합니다.</p>
            <p className="text-xs text-gray-500">국기, 공공기관 표장, 기능 표시 등 검토</p>
          </div>
          <div>
            <h5 className="font-medium mb-3">📜 상표법 제34조 제1항 1-6호 검토</h5>
            <ViolationsList violations={data.article34_1to6Violations || []} />
          </div>
        </div>
      )
    },
    {
      id: 'famousness',
      title: '저명성 검토',
      score: data.famousnessScore,
      summary: data.famousnessSummary,
      details: (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">🌐 저명상표와의 충돌 가능성을 검토합니다.</p>
            <p className="text-xs text-gray-500">인터넷 검색 및 저명상표 DB 확인</p>
          </div>
          {data.internetSearchResults && (
            <div>
              <h5 className="font-medium mb-2">🌐 인터넷 검색 결과</h5>
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                {data.internetSearchResults.google && (
                  <div>
                    <p className="font-medium text-sm">Google 검색:</p>
                    <p className="text-sm text-gray-600 ml-4">{data.internetSearchResults.google}</p>
                  </div>
                )}
                {data.internetSearchResults.naver && (
                  <div>
                    <p className="font-medium text-sm">Naver 검색:</p>
                    <p className="text-sm text-gray-600 ml-4">{data.internetSearchResults.naver}</p>
                  </div>
                )}
                {data.internetSearchResults.summary && (
                  <div>
                    <p className="font-medium text-sm">종합 판단:</p>
                    <p className="text-sm text-gray-700 ml-4">{data.internetSearchResults.summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <h5 className="font-medium mb-3">⚠️ 저명상표 충돌 검토 (제34조 제1항 9-14호)</h5>
            <ViolationsList violations={data.article34_9to14Violations || []} />
          </div>
        </div>
      )
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span>
          <span>5가지 평가 기준</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          각 항목을 클릭하면 상세한 내용을 확인할 수 있습니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCriterion(criterion.id)}
              className="w-full p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="space-y-3">
                {/* 평가 기준 | 점수 | 요약 행 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronRight 
                      className={cn(
                        "w-5 h-5 text-gray-500 transition-transform",
                        expandedCriteria.has(criterion.id) && "rotate-90"
                      )}
                    />
                    <div className="grid grid-cols-12 gap-4 flex-1">
                      {/* 평가 기준 (3/12) */}
                      <div className="col-span-3">
                        <h4 className="font-semibold text-gray-900 text-left">{criterion.title}</h4>
                      </div>
                      
                      {/* 점수 (3/12) */}
                      <div className="col-span-3 flex items-center gap-2">
                        <Progress value={criterion.score} className="flex-1 h-2" />
                        <div className="flex items-center gap-1">
                          {getScoreIcon(criterion.score)}
                          <span className="font-bold text-lg w-12 text-right">{criterion.score}%</span>
                        </div>
                      </div>
                      
                      {/* 요약 (6/12) */}
                      <div className="col-span-6">
                        <p className="text-sm text-gray-600 text-left">{criterion.summary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
            
            {expandedCriteria.has(criterion.id) && (
              <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                <div className="ml-8">
                  {criterion.details}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}