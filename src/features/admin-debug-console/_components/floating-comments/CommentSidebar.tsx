'use client'

import { useState } from 'react'
import { MessageSquare, X, CheckCircle, Reply, Trash2, Edit2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Textarea } from '@/shared/components/ui/textarea'
import { Separator } from '@/shared/components/ui/separator'
import { Comment } from '../../_types/comment.types'
import { cn } from '@/shared/utils'

interface CommentSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comments: Comment[]
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  onReply: (commentId: string, text: string, author: string) => void
  onCommentClick?: (commentId: string) => void
  currentUser?: string
}

export function CommentSidebar({
  open,
  onOpenChange,
  comments,
  onResolve,
  onDelete,
  onReply,
  onCommentClick,
  currentUser = 'Admin'
}: CommentSidebarProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleReplySubmit = (commentId: string) => {
    if (replyText.trim()) {
      onReply(commentId, replyText.trim(), currentUser)
      setReplyText('')
      setReplyingTo(null)
    }
  }

  const unresolvedCount = comments.filter(c => !c.resolved).length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          코멘트 ({comments.length})
          {unresolvedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unresolvedCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>코멘트 목록</SheetTitle>
          <SheetDescription>
            전체 {comments.length}개 · 미해결 {unresolvedCount}개
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                아직 코멘트가 없습니다
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    comment.resolved 
                      ? 'bg-muted/50 border-muted-foreground/20' 
                      : 'bg-background border-border hover:border-primary/50',
                    'cursor-pointer'
                  )}
                  onClick={() => onCommentClick?.(comment.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {comment.author}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.timestamp)}
                          </span>
                          {comment.resolved && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              해결됨
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mb-2 p-2 bg-muted rounded text-xs text-muted-foreground line-clamp-2">
                          "{comment.highlightedText}"
                        </div>
                        
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setReplyingTo(comment.id)
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        답글
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          onResolve(comment.id)
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {comment.resolved ? '미해결' : '해결'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(comment.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {comment.replies.length > 0 && (
                      <div className="pl-4 space-y-2 border-l-2 border-muted">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs">
                                {reply.author}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(reply.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{reply.text}</p>
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
                          className="min-h-[100px] resize-y text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReplySubmit(comment.id)}
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
      </SheetContent>
    </Sheet>
  )
}