'use client'

import { TrademarkInfoCard } from '@/features/trademark-analysis/_components/shared/TrademarkInfoCard'
import { TrademarkInfo } from '@/features/trademark-analysis/_types/trademark.types'

interface AnalysisInfoPanelProps {
  workflowData: TrademarkInfo
}

export function AnalysisInfoPanel({ workflowData }: AnalysisInfoPanelProps) {
  return (
    <TrademarkInfoCard 
      data={workflowData} 
      variant="full" 
      showHeader={true}
      className="h-full"
    />
  )
}