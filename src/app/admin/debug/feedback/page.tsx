'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WorkflowSnapshotClientService, type WorkflowSnapshot } from '@/features/admin-debug-console/_services/workflow-snapshot-client-service'
import { ChevronUp, ChevronDown, Trash2, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

const snapshotService = new WorkflowSnapshotClientService()

export default function FeedbackBoardPage() {
  const router = useRouter()
  const [snapshots, setSnapshots] = useState<WorkflowSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [sortBy, setSortBy] = useState<string>('created_at')  // analysis_date → created_at
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showOnlyMine, setShowOnlyMine] = useState(true) // Default to showing only user's analyses

  // Load snapshots
  const loadSnapshots = async () => {
    setLoading(true)
    try {
      const result = await snapshotService.getSnapshots({
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
        filterByUser: showOnlyMine
      })
      setSnapshots(result.data)
      setTotalCount(result.total)
    } catch (error) {
      console.error('Failed to load snapshots:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSnapshots()
  }, [currentPage, sortBy, sortOrder, showOnlyMine])

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Handle row selection
  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === snapshots.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(snapshots.map(s => s.id)))
    }
  }

  // Delete selected snapshots
  const handleDeleteSelected = async () => {
    if (!confirm(`정말로 선택한 ${selectedRows.size}개의 스냅샷을 삭제하시겠습니까?`)) {
      return
    }

    for (const id of selectedRows) {
      await snapshotService.deleteSnapshot(id)
    }

    setSelectedRows(new Set())
    await loadSnapshots()
  }

  // Handle row click to navigate to detail
  const handleRowClick = (snapshotId: string) => {
    router.push(`/admin/debug/feedback/${snapshotId}`)
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format cost
  const formatCost = (cost?: number) => {
    if (!cost) return '-'
    return `$${cost.toFixed(4)}`
  }

  // Format execution time
  const formatExecutionTime = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortOrder === 'desc' ? 
      <ChevronDown className="h-4 w-4 inline ml-1" /> : 
      <ChevronUp className="h-4 w-4 inline ml-1" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">피드백 보드</h1>

        <div className="flex gap-2">
          {/* Toggle: Show All vs My Analyses */}
          <div className="flex items-center gap-2 bg-muted rounded-md p-1">
            <Button
              onClick={() => setShowOnlyMine(true)}
              variant={showOnlyMine ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              내 분석
            </Button>
            <Button
              onClick={() => setShowOnlyMine(false)}
              variant={!showOnlyMine ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              전체
            </Button>
          </div>

          {selectedRows.size > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제 ({selectedRows.size})
            </Button>
          )}
          <Button
            onClick={loadSnapshots}
            variant="default"
            size="sm"
          >
            새로고침
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.size === snapshots.length && snapshots.length > 0}
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('created_at')}
                  >
                    분석 일시
                    <SortIcon column="created_at" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('trademark_name')}
                  >
                    상표명
                    <SortIcon column="trademark_name" />
                  </TableHead>
                  <TableHead>세션 ID</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('total_tokens')}
                  >
                    토큰 사용량
                    <SortIcon column="total_tokens" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('execution_time')}
                  >
                    실행 시간
                    <SortIcon column="execution_time" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('total_cost')}
                  >
                    비용
                    <SortIcon column="total_cost" />
                  </TableHead>
                  <TableHead className="text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : snapshots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      분석 기록이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  snapshots.map((snapshot) => (
                    <TableRow
                      key={snapshot.id}
                      onClick={() => handleRowClick(snapshot.id)}
                      className={`cursor-pointer hover:bg-muted/30 ${selectedRows.has(snapshot.id) ? 'bg-muted/50' : ''}`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(snapshot.id)}
                          onCheckedChange={() => toggleRowSelection(snapshot.id)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(snapshot.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {snapshot.trademark_name || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {snapshot.session_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {snapshot.total_tokens?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        {formatExecutionTime(snapshot.execution_time)}
                      </TableCell>
                      <TableCell>
                        {formatCost(snapshot.total_cost)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={() => window.open(`/admin/debug/feedback/${snapshot.id}`, '_blank')}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={async () => {
                              if (confirm('이 스냅샷을 삭제하시겠습니까?')) {
                                await snapshotService.deleteSnapshot(snapshot.id)
                                await loadSnapshots()
                              }
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="px-4 py-3 flex justify-between items-center border-t">
              <div className="text-sm text-muted-foreground">
                총 {totalCount}개 중 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  이전
                </Button>
                <span className="px-3 py-2 text-sm">
                  {currentPage} / {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  variant="outline"
                  size="sm"
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}