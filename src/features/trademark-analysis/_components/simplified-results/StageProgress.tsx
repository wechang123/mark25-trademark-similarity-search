/**
 * 3단계 플로우 진행 상황 표시 컴포넌트
 */

import { Check } from 'lucide-react';
import { cn } from '@/shared/utils';
import { StageProgressProps } from '../../_types/simplified-types';

const STAGES = [
  { number: 1, title: '상표 입력', description: '기본 정보 입력' },
  { number: 2, title: '결과 확인', description: '분석 결과 및 액션' }
] as const;

export function StageProgress({ 
  currentStage, 
  completedStages, 
  className 
}: StageProgressProps) {
  const isStageCompleted = (stageNumber: number) => 
    completedStages.includes(stageNumber);
  
  const isCurrentStage = (stageNumber: number) => 
    currentStage === stageNumber;

  const getStageStatus = (stageNumber: number) => {
    if (isStageCompleted(stageNumber)) return 'completed';
    if (isCurrentStage(stageNumber)) return 'current';
    return 'pending';
  };

  const getStageStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-600 text-white border-green-600',
          line: 'bg-green-600',
          text: 'text-green-600',
          description: 'text-green-600'
        };
      case 'current':
        return {
          circle: 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100',
          line: 'bg-gray-200',
          text: 'text-blue-600 font-medium',
          description: 'text-blue-600'
        };
      case 'pending':
        return {
          circle: 'bg-gray-200 text-gray-400 border-gray-200',
          line: 'bg-gray-200',
          text: 'text-gray-400',
          description: 'text-gray-400'
        };
      default:
        return {
          circle: 'bg-gray-200 text-gray-400 border-gray-200',
          line: 'bg-gray-200',
          text: 'text-gray-400',
          description: 'text-gray-400'
        };
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {STAGES.map((stage, index) => {
            const status = getStageStatus(stage.number);
            const styles = getStageStyles(status);
            const isLast = index === STAGES.length - 1;

            return (
              <li key={stage.number} className="flex-1 flex items-center">
                <div className="flex items-center">
                  {/* 단계 원형 아이콘 */}
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 border-2 rounded-full transition-all duration-300',
                    styles.circle
                  )}>
                    {status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">
                        {stage.number}
                      </span>
                    )}
                  </div>

                  {/* 단계 정보 */}
                  <div className="ml-3">
                    <p className={cn(
                      'text-sm transition-colors duration-300',
                      styles.text
                    )}>
                      {stage.title}
                    </p>
                    <p className={cn(
                      'text-xs transition-colors duration-300',
                      styles.description
                    )}>
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* 연결선 */}
                {!isLast && (
                  <div className="flex-1 mx-6">
                    <div className={cn(
                      'h-0.5 transition-colors duration-300',
                      styles.line
                    )} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 진행률 표시 */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>진행률</span>
          <span>{Math.round((completedStages.length / STAGES.length) * 100)}% 완료</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${(completedStages.length / STAGES.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}