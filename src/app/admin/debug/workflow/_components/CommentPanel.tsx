'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { MessageSquare, Send, CheckCircle, Clock, Reply, Trash2 } from 'lucide-react'
import { cn } from '@/shared/utils'

export interface StageComment {
  id: string
  stageId: string
  stageName: string
  text: string
  author: string
  timestamp: string
  resolved: boolean
  replies: {
    id: string
    text: string
    author: string
    timestamp: string
  }[]
}

interface CommentPanelProps {
  comments: StageComment[]
  stageNumberMapping?: { [key: string]: number }
  activeStageId?: string
  currentUser?: string
  onAddComment: (stageId: string, text: string) => void
  onResolveComment: (commentId: string) => void
  onDeleteComment: (commentId: string) => void
  onReplyComment: (commentId: string, text: string) => void
  onClearActiveStage?: () => void // ✅ Stage 버튼 클릭 시 activeStageId 초기화
}

export function CommentPanel({
  comments,
  stageNumberMapping,
  activeStageId,
  currentUser = 'Admin',
  onAddComment,
  onResolveComment,
  onDeleteComment,
  onReplyComment,
  onClearActiveStage
}: CommentPanelProps) {
  const [newCommentText, setNewCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | null>(null)

  // Filter and sort comments
  const filteredAndSortedComments = useMemo(() => {
    let result = [...comments]

    // ✅ 우선순위 필터링: activeStageId가 있으면 이것만 사용
    if (activeStageId) {
      // Stage item 클릭 시: activeStageId로만 필터링
      result = result.filter(c => c.stageId === activeStageId)
    } else if (selectedStageFilter !== null && stageNumberMapping) {
      // Stage 버튼 클릭 시: selectedStageFilter로 필터링
      result = result.filter(comment =>
        stageNumberMapping[comment.stageId] === selectedStageFilter
      )
    }

    // Sort by stage number
    if (stageNumberMapping) {
      result.sort((a, b) => {
        const stageA = stageNumberMapping[a.stageId] || 999
        const stageB = stageNumberMapping[b.stageId] || 999
        return stageA - stageB
      })
    }

    return result
  }, [comments, selectedStageFilter, activeStageId, stageNumberMapping])

  const unresolvedCount = filteredAndSortedComments.filter(c => !c.resolved).length

  const handleAddComment = () => {
    if (newCommentText.trim() && activeStageId) {
      onAddComment(activeStageId, newCommentText.trim())
      setNewCommentText('')
    }
  }

  const handleReply = (commentId: string) => {
    if (replyText.trim()) {
      onReplyComment(commentId, replyText.trim())
      setReplyText('')
      setReplyingTo(null)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            플로팅 코멘트
          </CardTitle>
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              미해결 {unresolvedCount}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Stage Filter Tabs */}
      {stageNumberMapping && Object.keys(stageNumberMapping).length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 flex-wrap">
            {/* All button */}
            <button
              onClick={() => {
                setSelectedStageFilter(null)
                onClearActiveStage?.() // ✅ activeStageId 초기화
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                selectedStageFilter === null
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              )}
            >
              전체 ({comments.length})
            </button>

            {/* Stage filter buttons */}
            {Object.entries(stageNumberMapping)
              .sort(([, numA], [, numB]) => numA - numB)
              .map(([stageId, stageNum]) => {
                const count = comments.filter(c => c.stageId === stageId).length
                return (
                  <button
                    key={stageId}
                    onClick={() => {
                      setSelectedStageFilter(stageNum)
                      onClearActiveStage?.() // ✅ activeStageId 초기화
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      selectedStageFilter === stageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    )}
                  >
                    Stage {stageNum} ({count})
                  </button>
                )
              })
            }
          </div>
        </div>
      )}

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {activeStageId && (
          <div className="mb-4 space-y-2">
            <Textarea
              placeholder="이 Stage에 대한 코멘트를 입력하세요..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="min-h-[300px] text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-1" />
              코멘트 추가
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {filteredAndSortedComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {activeStageId
                  ? "이 Stage에 코멘트가 없습니다"
                  : "코멘트가 없습니다"}
              </div>
            ) : (
              filteredAndSortedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "p-3 rounded-lg border bg-card",
                    comment.resolved && "opacity-60"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {stageNumberMapping?.[comment.stageId]
                              ? `Stage ${stageNumberMapping[comment.stageId]}: ${comment.stageName}`
                              : comment.stageName
                            }
                          </Badge>
                          {comment.resolved && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {comment.author}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        답글
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => onResolveComment(comment.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {comment.resolved ? '미해결' : '해결'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs text-destructive"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {comment.replies.length > 0 && (
                      <div className="pl-4 space-y-2 border-l-2 border-muted">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="space-y-1">
                            <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {reply.author}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {reply.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {replyingTo === comment.id && (
                      <div className="pl-4 space-y-2 border-l-2 border-primary">
                        <Textarea
                          placeholder="답글을 입력하세요..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[60px] text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleReply(comment.id)}
                            disabled={!replyText.trim()}
                          >
                            답글 등록
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}