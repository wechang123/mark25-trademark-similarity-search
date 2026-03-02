'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnalysisSession } from '../_types/dashboard'
import { TableCell, TableRow } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { ChevronDown, ChevronUp, MoreVertical, Trash2 } from 'lucide-react'
import { AnalysisDetailPanel } from './AnalysisDetailPanel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

interface AnalysisTableRowProps {
  session: AnalysisSession
}

export function AnalysisTableRow({ session }: AnalysisTableRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleApplication = () => {
    router.push(`/trademark-application?session_id=${session.id}`)
  }

  const handleConsultation = () => {
    router.push(`/consultation?session_id=${session.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Delete the analysis record
      const response = await fetch(`/api/analysis/${session.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Refresh the page to update the list
        window.location.reload()
      } else {
        console.error('Failed to delete analysis:', data.error || 'Unknown error')
        alert(`삭제 실패: ${data.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('Error deleting analysis:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '')

    const timeStr = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    return `${dateStr} ${timeStr}`
  }

  const formatType = (type: string) => {
    switch (type) {
      case 'text':
        return '문자'
      case 'image':
        return '이미지'
      case 'combined':
        return '결합'
      default:
        return type
    }
  }


  return (
    <>
      {/* 메인 행 */}
      <TableRow>
        <TableCell>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left hover:text-blue-600"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="font-medium">{session.trademark_name}</span>
          </button>
        </TableCell>
        <TableCell>{formatType(session.trademark_type)}</TableCell>
        <TableCell>{session.completed_at ? formatDate(session.completed_at) : '-'}</TableCell>
        <TableCell>
          {session.final_results ? (
            <span className="font-semibold">
              {session.final_results.registration_possibility}%
            </span>
          ) : (
            '-'
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button 
              size="sm" 
              onClick={handleApplication}
              className="bg-blue-600 hover:bg-blue-700"
            >
              출원하러가기
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleConsultation}
            >
              전문 변리사 상담
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {/* 상세 정보 행 - 토글 시 표시 */}
      {isOpen && session.final_results && (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <AnalysisDetailPanel
              results={session.final_results}
              designatedProducts={session.designated_products}
              classificationCodes={session.product_classification_codes}
            />
          </TableCell>
        </TableRow>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>분석 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{session.trademark_name}" 상표 분석 기록을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}