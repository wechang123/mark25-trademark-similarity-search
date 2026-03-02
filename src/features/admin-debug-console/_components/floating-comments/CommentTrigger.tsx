'use client'

import { useEffect, useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { TextSelection } from '../../_types/comment.types'

interface CommentTriggerProps {
  selection: TextSelection | null
  onTrigger: () => void
}

export function CommentTrigger({ selection, onTrigger }: CommentTriggerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!selection || !selection.position.pageX || !selection.position.pageY) {
      setVisible(false)
      return
    }

    setPosition({
      x: selection.position.pageX,
      y: selection.position.pageY - 40
    })
    
    setTimeout(() => setVisible(true), 10)
  }, [selection])

  if (!selection || !visible) return null

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-1 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <Button
        size="sm"
        variant="default"
        className="h-8 px-2 shadow-lg"
        onClick={(e) => {
          e.stopPropagation()
          onTrigger()
        }}
      >
        <MessageSquarePlus className="h-4 w-4 mr-1" />
        코멘트 추가
      </Button>
    </div>
  )
}