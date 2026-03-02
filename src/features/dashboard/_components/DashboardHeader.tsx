'use client'

import { Card, CardContent } from '@/shared/components/ui/card'
import { FileSearch, FileText, CheckCircle2 } from 'lucide-react'
import { DashboardStats } from '../_types/dashboard'

interface DashboardHeaderProps {
  stats: DashboardStats
  userName?: string
}

export function DashboardHeader({ stats, userName }: DashboardHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          상표 정보 입력
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          AI 기반 상표 분석을 위해 정보를 입력해주세요
        </p>
      </div>

      {/* Simplified Stats Cards - 3 cards only */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 분석 */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">분석</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.completed || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">완료된 분석</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileSearch className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 출원 */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">출원</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.applications || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">진행중</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 등록 */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">등록</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.registrations || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">완료</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}