'use client'

import { useAuth } from '@/features/authentication'
import { useDashboardData } from '@/features/dashboard'
import { MainHeader } from '@/shared/components/MainHeader'
import { DashboardHeader } from '@/features/dashboard/_components/DashboardHeader'
import { QuickActionsCard } from '@/features/dashboard/_components/QuickActionsCard'
import { AnalysisHistoryTable } from '@/features/dashboard/_components/AnalysisHistoryTable'
import { ApplicationStatusCard } from '@/features/dashboard/_components/ApplicationStatusCard'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function DashboardContent() {
  const router = useRouter()
  const { state: authState } = useAuth()
  const { data, loading, pageLoading, error, refresh, goToPage, page, totalPages } = useDashboardData()

  // 로그인 체크
  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push('/signin?redirect=/dashboard')
    }
  }, [authState.isLoading, authState.user, router])

  if (authState.isLoading || loading) {
    // 로딩 컴포넌트는 이미 loading.tsx에서 처리됨
    return <div className="min-h-screen" />
  }

  if (!authState.user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <MainHeader currentPage="dashboard" />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                데이터를 불러올 수 없습니다
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={refresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <MainHeader currentPage="dashboard" />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with Stats */}
        <DashboardHeader 
          stats={data.stats}
          userName={authState.user.email?.split('@')[0]}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mobile: Analysis History First */}
          <div className="lg:hidden">
            <AnalysisHistoryTable
              sessions={data.sessions}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              loading={pageLoading}
            />
          </div>

          {/* Left Sidebar - Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <QuickActionsCard />
            <ApplicationStatusCard applications={data.applications} />
          </div>

          {/* Desktop: Analysis History */}
          <div className="hidden lg:block lg:col-span-3">
            <AnalysisHistoryTable
              sessions={data.sessions}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              loading={pageLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            더 많은 기능이 궁금하다면{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
              onClick={() => window.open('mailto:tmdals128551@gmail.com', '_blank')}
            >
              문의하기
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}