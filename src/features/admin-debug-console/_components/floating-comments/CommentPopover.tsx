'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { TextSelection } from '../../_types/comment.types'

interface CommentPopoverProps {
  selection: TextSelection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (text: string) => void
  triggerElement?: React.ReactNode
}

export function CommentPopover({
  selection,
  open,
  onOpenChange,
  onSubmit,
  triggerElement
}: CommentPopoverProps) {
  const [commentText, setCommentText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  const handleSubmit = () => {
    if (commentText.trim()) {
      onSubmit(commentText.trim())
      setCommentText('')
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!selection) return null

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {triggerElement && (
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
      )}
      <PopoverContent 
        className="w-80" 
        align="start"
        sideOffset={5}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">새 코멘트</Label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-2 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{selection.text}"
            </p>
          </div>

          <Textarea
            ref={textareaRef}
            placeholder="코멘트를 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-y"
          />

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!commentText.trim()}
            >
              <Send className="h-4 w-4 mr-1" />
              등록
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Tip: Cmd/Ctrl + Enter로 빠르게 등록
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}