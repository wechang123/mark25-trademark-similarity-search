'use client'

import { useRef, useState, useEffect } from 'react'
import { CommentTrigger } from './CommentTrigger'
import { CommentPopover } from './CommentPopover'
import { CommentSidebar } from './CommentSidebar'
import { CommentHighlightLayer } from './CommentHighlight'
import { useTextSelection } from '../../_hooks/useTextSelection'
import { useCommentStore } from '../../_hooks/useCommentStore'

interface FloatingCommentSystemProps {
  children: React.ReactNode
  containerClassName?: string
  currentUser?: string
}

export function FloatingCommentSystem({ 
  children, 
  containerClassName,
  currentUser = 'Admin'
}: FloatingCommentSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { selection, clearSelection } = useTextSelection(containerRef as React.RefObject<HTMLElement>)
  
  const {
    comments,
    sidebarOpen,
    addComment,
    deleteComment,
    resolveComment,
    addReply,
    setActiveComment,
    toggleSidebar,
    getCommentsByPage
  } = useCommentStore()

  const pageComments = Array.from(comments.values()).filter(
    comment => comment.pageUrl === window.location.pathname
  )

  const handleAddComment = (text: string) => {
    if (selection) {
      addComment(selection, text, currentUser)
      clearSelection()
      setPopoverOpen(false)
    }
  }

  const handleCommentClick = (commentId: string) => {
    setActiveComment(commentId)
    toggleSidebar()
  }

  const handleTriggerClick = () => {
    setPopoverOpen(true)
  }

  useEffect(() => {
    if (!selection) {
      setPopoverOpen(false)
    }
  }, [selection])

  return (
    <>
      <div ref={containerRef} className={containerClassName}>
        <CommentHighlightLayer
          comments={pageComments}
          containerRef={containerRef as React.RefObject<HTMLElement>}
          onCommentClick={handleCommentClick}
        />
        {children}
      </div>

      <CommentTrigger
        selection={selection}
        onTrigger={handleTriggerClick}
      />

      <CommentPopover
        selection={selection}
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        onSubmit={handleAddComment}
      />

      <CommentSidebar
        open={sidebarOpen}
        onOpenChange={toggleSidebar}
        comments={pageComments}
        onResolve={resolveComment}
        onDelete={deleteComment}
        onReply={addReply}
        onCommentClick={handleCommentClick}
        currentUser={currentUser}
      />
    </>
  )
}