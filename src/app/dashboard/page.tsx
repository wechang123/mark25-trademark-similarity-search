import { Metadata } from 'next'
import { DashboardContent } from './dashboard-content'

export const metadata: Metadata = {
  title: '내 대시보드 | Mark25 - AI 상표 분석',
  description: '나의 상표 분석 내역과 출원 현황을 확인하세요',
}

export default function DashboardPage() {
  return <DashboardContent />
}