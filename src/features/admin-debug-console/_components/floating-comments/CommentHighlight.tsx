'use client'

import { useEffect, useRef } from 'react'
import { MessageSquare, CheckCircle } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/shared/components/ui/hover-card'
import { Badge } from '@/shared/components/ui/badge'
import { Comment } from '../../_types/comment.types'
import { cn } from '@/shared/utils'

interface CommentHighlightProps {
  comment: Comment
  onClick?: () => void
  className?: string
}

export function CommentHighlight({ comment, onClick, className }: CommentHighlightProps) {
  const highlightRef = useRef<HTMLSpanElement>(null)

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span
          ref={highlightRef}
          className={cn(
            'relative inline cursor-pointer transition-colors',
            'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50',
            'border-b-2 border-yellow-400 dark:border-yellow-600',
            comment.resolved && 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 border-green-400 dark:border-green-600',
            className
          )}
          onClick={onClick}
        >
          {comment.highlightedText}
          <span className="absolute -top-1 -right-1">
            {comment.resolved ? (
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <MessageSquare className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            )}
          </span>
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{comment.author}</span>
              {comment.resolved && (
                <Badge variant="outline" className="text-xs">
                  해결됨
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.timestamp)}
            </span>
          </div>
          
          <p className="text-sm">{comment.text}</p>
          
          {comment.replies.length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                답글 {comment.replies.length}개
              </span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

interface CommentHighlightLayerProps {
  comments: Comment[]
  containerRef: React.RefObject<HTMLElement>
  onCommentClick: (commentId: string) => void
}

export function CommentHighlightLayer({ 
  comments, 
  containerRef,
  onCommentClick 
}: CommentHighlightLayerProps) {
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const text = container.textContent || ''
    
    comments.forEach(comment => {
      const regex = new RegExp(comment.highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      const matches = text.matchAll(regex)
      
      for (const match of matches) {
        if (match.index === undefined) continue
        
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          null
        )
        
        let currentIndex = 0
        let node: Node | null
        
        while (node = walker.nextNode()) {
          const textNode = node as Text
          const nodeLength = textNode.textContent?.length || 0
          
          if (currentIndex + nodeLength > match.index) {
            const startOffset = match.index - currentIndex
            const endOffset = Math.min(startOffset + comment.highlightedText.length, nodeLength)
            
            try {
              const range = document.createRange()
              range.setStart(textNode, startOffset)
              range.setEnd(textNode, endOffset)
              
              const span = document.createElement('span')
              span.className = cn(
                'inline cursor-pointer transition-colors',
                'bg-yellow-100 hover:bg-yellow-200',
                comment.resolved && 'bg-green-100 hover:bg-green-200'
              )
              span.dataset.commentId = comment.id
              span.onclick = () => onCommentClick(comment.id)
              
              range.surroundContents(span)
            } catch (e) {
              console.error('Error highlighting text:', e)
            }
            
            break
          }
          
          currentIndex += nodeLength
        }
      }
    })
    
    return () => {
      const highlights = container.querySelectorAll('[data-comment-id]')
      highlights.forEach(highlight => {
        const parent = highlight.parentNode
        while (highlight.firstChild) {
          parent?.insertBefore(highlight.firstChild, highlight)
        }
        parent?.removeChild(highlight)
      })
    }
  }, [comments, containerRef, onCommentClick])
  
  return null
}