'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { User, Calendar, Search, Hash, FileText, Image as ImageIcon } from 'lucide-react'
import { TrademarkInfo } from '../../_types/trademark.types'
import { TrademarkTypeDisplay } from './TrademarkTypeDisplay'
import { ClassificationBadges } from './ClassificationBadges'

interface TrademarkInfoCardProps {
  data: TrademarkInfo
  variant?: 'full' | 'compact' | 'summary'
  showHeader?: boolean
  className?: string
}

export function TrademarkInfoCard({
  data,
  variant = 'full',
  showHeader = true,
  className
}: TrademarkInfoCardProps) {
  const getStatusBadge = () => {
    if (!data.status) return null
    
    switch (data.status) {
      case 'processing':
        return <Badge variant="default" className="animate-pulse">진행 중</Badge>
      case 'completed':
        return <Badge variant="secondary">완료</Badge>
      case 'failed':
        return <Badge variant="destructive">실패</Badge>
      default:
        return <Badge variant="outline">대기 중</Badge>
    }
  }

  if (variant === 'summary') {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <TrademarkTypeDisplay type={data.type} variant="badge" />
            {getStatusBadge()}
          </div>
          <div>
            <p className="text-sm font-medium">{data.name}</p>
            {data.classifications && data.classifications.length > 0 && (
              <ClassificationBadges 
                classifications={data.classifications} 
                size="sm"
                maxDisplay={3}
                className="mt-2"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">분석 정보</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'pt-6'}>
        <div className="space-y-4">
          {/* 워크플로우 ID */}
          {data.workflowId && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Hash className="h-3 w-3" />
                <span>워크플로우 ID</span>
              </div>
              <p className="font-mono text-sm pl-5">{data.workflowId}</p>
            </div>
          )}

          {/* 요청자 정보 */}
          {(data.userEmail || data.userName) && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-3 w-3" />
                <span>요청자</span>
              </div>
              <div className="pl-5">
                <p className="text-sm">{data.userEmail}</p>
                {data.userId && (
                  <p className="text-xs text-muted-foreground">{data.userId}</p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* 상표 정보 */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Search className="h-3 w-3" />
              <span>상표명</span>
            </div>
            <p className="font-semibold text-base pl-5">{data.name}</p>
          </div>

          {/* 상표 유형 */}
          <div>
            <TrademarkTypeDisplay type={data.type} variant="full" />
          </div>

          {/* 이미지 (도형/결합 상표) */}
          {data.imageUrl && (data.type === 'image' || data.type === 'combined') && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <ImageIcon className="h-3 w-3" />
                <span>상표 이미지</span>
              </div>
              <div className="pl-5">
                <img 
                  src={data.imageUrl} 
                  alt="상표 이미지"
                  className="h-20 w-auto rounded border"
                />
              </div>
            </div>
          )}

          {/* 요청 시간 */}
          {data.requestTime && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span>요청 시간</span>
              </div>
              <p className="text-sm pl-5">{data.requestTime}</p>
            </div>
          )}

          <Separator />

          {/* 상품분류 */}
          {data.classifications && data.classifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-3 w-3" />
                <span>상품분류</span>
              </div>
              <ClassificationBadges 
                classifications={data.classifications}
                className="pl-5"
              />
            </div>
          )}

          {/* 비즈니스 설명 */}
          {data.descriptions && data.descriptions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-3 w-3" />
                <span>비즈니스 설명</span>
              </div>
              <div className="pl-5 space-y-1">
                {data.descriptions.map((desc, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {desc}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}