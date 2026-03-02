'use client'

import { Badge } from '@/shared/components/ui/badge'

interface ClassificationBadgesProps {
  classifications: string[]
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  maxDisplay?: number
  className?: string
}

export function ClassificationBadges({
  classifications,
  variant = 'outline',
  size = 'md',
  maxDisplay = 10,
  className
}: ClassificationBadgesProps) {
  if (!classifications || classifications.length === 0) {
    return null
  }

  const displayedClassifications = classifications.slice(0, maxDisplay)
  const remainingCount = classifications.length - maxDisplay

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {displayedClassifications.map((classification, index) => (
        <Badge
          key={index}
          variant={variant}
          className={sizeClasses[size]}
        >
          {classification}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="secondary"
          className={sizeClasses[size]}
        >
          +{remainingCount}개
        </Badge>
      )}
    </div>
  )
}