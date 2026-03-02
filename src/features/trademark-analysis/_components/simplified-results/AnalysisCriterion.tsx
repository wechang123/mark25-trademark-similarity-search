/**
 * 개별 평가 기준 표시 컴포넌트
 * 3가지 기준 (유사군 코드 적합성, 상표 식별력, 선행상표 유사도)을 표시
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/utils';
import { AnalysisCriterionProps } from '../../_types/simplified-types';

export function AnalysisCriterion({ 
  title, 
  criterion, 
  className 
}: AnalysisCriterionProps) {
  // 점수에 따른 색상 및 스타일 결정
  const getStatusColor = () => {
    switch (criterion.status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getProgressColor = () => {
    switch (criterion.status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBadgeVariant = () => {
    switch (criterion.status) {
      case 'excellent':
        return 'default' as const;
      case 'good':
        return 'secondary' as const;
      case 'warning':
        return 'outline' as const;
      case 'danger':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-sm',
      getStatusColor(),
      className
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 헤더: 제목과 아이콘 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{criterion.icon}</span>
              <h4 className="font-medium text-sm">{title}</h4>
            </div>
            <Badge variant={getBadgeVariant()} className="text-xs">
              {criterion.score}점
            </Badge>
          </div>

          {/* 진행률 바 */}
          <div className="space-y-1">
            <Progress 
              value={criterion.score} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium">{criterion.score}/100</span>
              <span>100</span>
            </div>
          </div>

          {/* 설명 */}
          <p className="text-sm leading-relaxed">
            {criterion.description}
          </p>

          {/* 상세 정보 (선택적) */}
          {criterion.details && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground transition-colors">
                자세히 보기
              </summary>
              <p className="mt-2 pl-4 border-l-2 border-muted">
                {criterion.details}
              </p>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}