'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { FileText, Calendar, ExternalLink } from 'lucide-react'
import { TrademarkApplication } from '../_types/dashboard'
import { DashboardService } from '../_services/dashboardService'
import { useRouter } from 'next/navigation'

interface ApplicationStatusCardProps {
  applications: TrademarkApplication[]
}

export function ApplicationStatusCard({ applications }: ApplicationStatusCardProps) {
  const router = useRouter()

  const handleViewApplication = (applicationId: string) => {
    router.push(`/trademark-application?id=${applicationId}`)
  }

  if (applications.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
            출원 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-1">진행중인 출원이 없습니다</h4>
            <p className="text-sm text-gray-500 mb-4">
              분석 완료 후 출원을 진행하세요
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push('/trademark-application')}
            >
              출원하기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
          출원 현황
          <Badge variant="secondary" className="ml-auto">
            {applications.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.slice(0, 3).map((application) => {
          const statusFormat = DashboardService.formatApplicationStatus(application.status)
          const trademarkType = DashboardService.formatTrademarkType(application.trademark_type || '')

          return (
            <div 
              key={application.id}
              className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {trademarkType}
                    </Badge>
                    <Badge 
                      className={`text-xs ${statusFormat.bgColor} ${statusFormat.color} border-0`}
                    >
                      {statusFormat.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(application.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewApplication(application.id)}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}

        {applications.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/trademark-application')}
            className="w-full mt-3"
          >
            전체 출원 현황 보기 ({applications.length}건)
          </Button>
        )}
      </CardContent>
    </Card>
  )
}