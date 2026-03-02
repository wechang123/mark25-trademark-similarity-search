'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WorkflowSnapshotClientService, type WorkflowSnapshot } from '@/features/admin-debug-console/_services/workflow-snapshot-client-service'
import { ArrowLeft, Copy, Download } from 'lucide-react'
import { useAdminAuth } from '@/features/admin-dashboard/_hooks/useAdminAuth'
import { StageItem } from '@/app/admin/debug/workflow/_components/StageItem'
import { CommentPanel, type StageComment } from '@/app/admin/debug/workflow/_components/CommentPanel'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

const snapshotService = new WorkflowSnapshotClientService()

interface SnapshotWithComments {
  snapshot: WorkflowSnapshot
  comments: StageComment[]
}

export default function SnapshotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAdmin, isManager, loading: authLoading } = useAdminAuth()
  const [snapshotData, setSnapshotData] = useState<SnapshotWithComments | null>(null)
  const [comments, setComments] = useState<StageComment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStageId, setActiveStageId] = useState<string | undefined>()

  // 권한 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    } else if (!authLoading && !(isAdmin() || isManager())) {
      router.push('/dashboard')
    }
  }, [authLoading, user, isAdmin, isManager, router])

  useEffect(() => {
    const loadSnapshot = async () => {
      if (!params.id || typeof params.id !== 'string') return

      setLoading(true)
      try {
        const data = await snapshotService.getSnapshotWithComments(params.id)

        if (!user || !(isAdmin() || isManager())) {
          console.warn('Unauthorized access attempt to snapshot:', params.id)
          router.push('/dashboard')
          return
        }

        setSnapshotData(data)
        setComments(data.comments || [])
        console.log('📊 Loaded snapshot with', data.comments?.length || 0, 'comments')
      } catch (error) {
        console.error('Failed to load snapshot:', error)
        if (error instanceof Error && error.message?.includes('unauthorized')) {
          router.push('/dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    loadSnapshot()
  }, [params.id, router])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadAsJSON = () => {
    if (!snapshotData) return

    const blob = new Blob([JSON.stringify(snapshotData.snapshot.snapshot_data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-snapshot-${snapshotData.snapshot.session_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate comment counts per stage
  const getStageCommentCounts = () => {
    if (!comments) return {}

    return comments.reduce((acc, comment) => {
      acc[comment.stageId] = (acc[comment.stageId] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
  }

  // Get stage number mapping from stages array
  const getStageNumberMapping = () => {
    if (!snapshotData?.snapshot.snapshot_data.stages) return {}

    return snapshotData.snapshot.snapshot_data.stages.reduce((acc: { [key: string]: number }, stage: any, index: number) => {
      acc[stage.id] = index + 1
      return acc
    }, {} as { [key: string]: number })
  }

  // Handle stage comment click
  const handleStageCommentClick = (stageId: string) => {
    setActiveStageId(stageId)
  }

  // Comment handlers
  const handleAddComment = async (stageId: string, text: string) => {
    if (!snapshotData) return

    const stage = snapshotData.snapshot.snapshot_data.stages?.find((s: any) => s.id === stageId)
    const authorName = user?.name || user?.email || 'Unknown'

    // Optimistic update
    const tempComment: StageComment = {
      id: `comment-${Date.now()}`,
      stageId,
      stageName: stage?.name || '',
      text,
      author: authorName,
      timestamp: new Date().toLocaleString('ko-KR'),
      resolved: false,
      replies: []
    }
    setComments([...comments, tempComment])

    // Save to DB
    try {
      const response = await fetch('/api/admin/workflow/stage-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: snapshotData.snapshot.session_id,
          stageId,
          stageName: stage?.name || '',
          text,
          author: authorName
        })
      })

      if (!response.ok) {
        console.error('Failed to save comment')
        // Rollback on error
        setComments(comments)
      } else {
        const result = await response.json()
        // Update with server response (correct ID and timestamp)
        setComments(prev =>
          prev.map(c => c.id === tempComment.id ? result.data : c)
        )
      }
    } catch (error) {
      console.error('Error saving comment:', error)
      // Rollback on error
      setComments(comments)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    const newResolvedState = !comment.resolved

    // Optimistic update
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, resolved: newResolvedState } : c
    ))

    // Save to DB
    try {
      const response = await fetch('/api/admin/workflow/stage-comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          action: 'resolve',
          resolved: newResolvedState
        })
      })

      if (!response.ok) {
        console.error('Failed to update comment')
        // Rollback on error
        setComments(comments.map(c =>
          c.id === commentId ? { ...c, resolved: !newResolvedState } : c
        ))
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      // Rollback on error
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, resolved: !newResolvedState } : c
      ))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    // Optimistic update
    const previousComments = comments
    setComments(comments.filter(c => c.id !== commentId))

    // Delete from DB
    try {
      const response = await fetch(`/api/admin/workflow/stage-comments?id=${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error('Failed to delete comment')
        // Rollback on error
        setComments(previousComments)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      // Rollback on error
      setComments(previousComments)
    }
  }

  const handleReplyComment = async (commentId: string, text: string) => {
    const authorName = user?.name || user?.email || 'Unknown'

    const newReply = {
      id: `reply-${Date.now()}`,
      text,
      author: authorName,
      timestamp: new Date().toLocaleString('ko-KR')
    }

    // Optimistic update
    const previousComments = comments
    setComments(comments.map(c =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, newReply] }
        : c
    ))

    // Save to DB
    try {
      const response = await fetch('/api/admin/workflow/stage-comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          action: 'reply',
          reply: {
            text,
            author: authorName
          }
        })
      })

      if (!response.ok) {
        console.error('Failed to add reply')
        // Rollback on error
        setComments(previousComments)
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      // Rollback on error
      setComments(previousComments)
    }
  }

  // Loading states
  if (authLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-gray-400">권한 확인 중...</div>
      </div>
    )
  }

  if (!user || !(isAdmin() || isManager())) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">
          이 페이지에 접근할 권한이 없습니다.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    )
  }

  if (!snapshotData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">
          스냅샷을 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  const { snapshot } = snapshotData
  const data = snapshot.snapshot_data
  const stageCommentCounts = getStageCommentCounts()
  const stageNumberMapping = getStageNumberMapping()

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="flex h-screen overflow-hidden">
        {/* Left Panel: Stage Display (75%) */}
        <div className="w-[75%] border-r bg-gray-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-white border-b border-gray-200 shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => router.back()}
                  className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={20} />
                  돌아가기
                </button>
                <h1 className="text-2xl font-bold mb-2 text-gray-900">워크플로우 분석 상세</h1>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>상표명: <span className="text-gray-900 font-medium">{snapshot.trademark_name}</span></span>
                  <span>분석일시: {snapshot.created_at ? new Date(snapshot.created_at).toLocaleString('ko-KR') : 'N/A'}</span>
                  <span>세션 ID: {snapshot.session_id}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(snapshot.session_id)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy size={16} />
                  세션 ID 복사
                </button>
                <button
                  onClick={downloadAsJSON}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download size={16} />
                  JSON 다운로드
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-6 bg-white border-b border-gray-200 shrink-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">총 토큰 사용량</div>
                <div className="text-2xl font-bold text-gray-900">{data.totalTokens?.toLocaleString() || 0}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">총 실행 시간</div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.totalExecutionTime ? `${(data.totalExecutionTime / 1000).toFixed(1)}s` : '-'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">총 비용</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${data.totalCost?.toFixed(4) || '0.0000'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">API 호출 수</div>
                <div className="text-2xl font-bold text-gray-900">{data.apiCalls?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Stage List - Scrollable */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {data.stages?.map((stage: any, index: number) => (
                <StageItem
                  key={stage.id}
                  stage={stage}
                  stageNumber={index + 1}
                  onCommentClick={handleStageCommentClick}
                  commentCount={stageCommentCounts[stage.id] || 0}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Comment Panel (25%) */}
        <div className="w-[25%] bg-white flex flex-col overflow-hidden">
          <CommentPanel
            comments={comments}
            stageNumberMapping={stageNumberMapping}
            activeStageId={activeStageId}
            currentUser={user?.name || user?.email || 'Viewer'}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            onDeleteComment={handleDeleteComment}
            onReplyComment={handleReplyComment}
          />
        </div>
      </div>
    </div>
  )
}
