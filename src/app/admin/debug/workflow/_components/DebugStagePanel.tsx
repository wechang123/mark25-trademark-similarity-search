'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { StageItem, StageData } from './StageItem'
import { ArrowDown } from 'lucide-react'

interface DebugStagePanelProps {
  stages: StageData[]
  onStageCommentClick: (stageId: string) => void
  stageComments: { [stageId: string]: number }
}

export function DebugStagePanel({ 
  stages, 
  onStageCommentClick,
  stageComments = {}
}: DebugStagePanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">디버그 정보</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.id}>
                <StageItem
                  stage={stage}
                  stageNumber={index + 1}
                  onCommentClick={onStageCommentClick}
                  commentCount={stageComments[stage.id] || 0}
                />
                {index < stages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}