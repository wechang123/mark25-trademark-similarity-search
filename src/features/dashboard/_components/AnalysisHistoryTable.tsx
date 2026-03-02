'use client'

import React from 'react'
import { AnalysisSession } from '../_types/dashboard'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnalysisTableRow } from './AnalysisTableRow'

interface AnalysisHistoryTableProps {
  sessions: AnalysisSession[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
}

export function AnalysisHistoryTable({
  sessions,
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}: AnalysisHistoryTableProps) {
  
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">아직 분석한 상표가 없습니다</p>
        <Button onClick={() => window.location.href = '/trademark-analysis'}>
          첫 상표 분석 시작하기
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">상표명</TableHead>
              <TableHead className="w-[100px]">타입</TableHead>
              <TableHead className="w-[150px]">분석일</TableHead>
              <TableHead className="w-[120px]">등록가능성</TableHead>
              <TableHead className="w-auto text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <AnalysisTableRow key={session.id} session={session} />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={page === currentPage ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}