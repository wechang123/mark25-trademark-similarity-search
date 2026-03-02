/**
 * 간소화된 결과 화면용 액션 버튼 그룹
 * 출원하기, 전문가 상담 버튼 제공
 */

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { FileText, MessageCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils';
import { SimplifiedActionButtonsProps } from '../../_types/simplified-types';

export function SimplifiedActionButtons({ 
  probability, 
  onApply, 
  onConsult, 
  disabled = false,
  className 
}: SimplifiedActionButtonsProps) {
  
  // 등록 가능성에 따른 추천 액션 결정
  const getRecommendedAction = () => {
    if (probability >= 80) {
      return {
        primary: 'apply',
        message: '높은 등록 가능성으로 출원을 추천합니다',
        variant: 'success' as const,
        icon: TrendingUp
      };
    } else if (probability >= 60) {
      return {
        primary: 'consult',
        message: '전문가 상담 후 출원을 권장합니다',
        variant: 'warning' as const,
        icon: MessageCircle
      };
    } else {
      return {
        primary: 'consult',
        message: '전문가 상담이 필요합니다',
        variant: 'danger' as const,
        icon: AlertTriangle
      };
    }
  };

  const recommendation = getRecommendedAction();
  const isPrimaryApply = recommendation.primary === 'apply';

  return (
    <div className={cn('space-y-4', className)}>
      {/* 액션 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 출원하기 버튼 */}
        <Button
          size="lg"
          variant="outline"
          onClick={onApply}
          disabled={disabled}
          className="flex-1 h-12 transition-all duration-200"
        >
          <FileText className="w-4 h-4 mr-2" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">출원하기</span>
            <span className="text-xs opacity-75">바로 신청</span>
          </div>
        </Button>

        {/* 전문가 상담 버튼 */}
        <Button
          size="lg"
          variant="default"
          onClick={onConsult}
          disabled={disabled}
          className="flex-1 h-12 transition-all duration-200"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">전문가 상담</span>
            <span className="text-xs opacity-75">1:1 상담</span>
          </div>
        </Button>
      </div>

      {/* 부가 정보 */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">
          💡 출원 전 전문가 검토를 통해 성공률을 높일 수 있습니다
        </div>
      </div>
    </div>
  );
}