'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { FileText, HelpCircle, Plus, History } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActionsCard() {
  const router = useRouter()

  const actions = [
    {
      icon: Plus,
      label: '새 상표 분석',
      description: '새로운 상표 분석을 시작하세요',
      onClick: () => router.push('/'),
      primary: true
    },
    {
      icon: History,
      label: '분석 내역',
      description: '완료된 분석 결과를 확인하세요',
      onClick: () => {
        const element = document.getElementById('analysis-history')
        element?.scrollIntoView({ behavior: 'smooth' })
      }
    },
    {
      icon: FileText,
      label: '상표 출원',
      description: '분석 완료 후 출원을 진행하세요',
      onClick: () => router.push('/trademark-application')
    },
    {
      icon: HelpCircle,
      label: '고객지원',
      description: '궁금한 점을 문의해보세요',
      onClick: () => {
        // 고객지원 모달이나 페이지로 이동
        window.open('mailto:tmdals128551@gmail.com', '_blank')
      }
    }
  ]

  return (
    <Card className="border-0 shadow-sm h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          빠른 작업
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <div key={index}>
              <Button
                onClick={action.onClick}
                variant={action.primary ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-4 ${
                  action.primary 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    action.primary 
                      ? "bg-white/20" 
                      : "bg-gray-100"
                  }`}>
                    <Icon className={`h-5 w-5 ${action.primary ? "text-white" : "text-gray-600"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${action.primary ? "text-white" : "text-gray-900"}`}>
                      {action.label}
                    </p>
                    <p className={`text-sm ${action.primary ? "text-white/80" : "text-gray-500"}`}>
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
              {index < actions.length - 1 && <Separator className="mt-3" />}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}