'use client'

import { FileText, Image, Layers } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { TrademarkType } from '../../_types/trademark.types'

interface TrademarkTypeDisplayProps {
  type: TrademarkType
  variant?: 'badge' | 'icon' | 'full'
  className?: string
}

const typeConfig = {
  text: {
    label: '문자 상표',
    icon: FileText,
    color: 'blue',
    description: '브랜드명, 슬로건 등 문자로만 구성'
  },
  image: {
    label: '도형 상표',
    icon: Image,
    color: 'green',
    description: '로고, 도형, 기호 등 시각적 요소'
  },
  combined: {
    label: '결합 상표',
    icon: Layers,
    color: 'purple',
    description: '문자와 도형이 결합된 형태'
  }
}

export function TrademarkTypeDisplay({ 
  type, 
  variant = 'badge',
  className 
}: TrademarkTypeDisplayProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  if (variant === 'badge') {
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center p-2 rounded-full bg-${config.color}-100 ${className}`}>
        <Icon className={`h-5 w-5 text-${config.color}-600`} />
      </div>
    )
  }

  // variant === 'full'
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
        <Icon className={`h-5 w-5 text-${config.color}-600`} />
      </div>
      <div>
        <h4 className="font-medium text-sm">{config.label}</h4>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
    </div>
  )
}