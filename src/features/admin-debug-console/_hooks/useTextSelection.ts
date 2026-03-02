'use client'

import { useEffect, useState, useCallback } from 'react'
import { TextSelection } from '../_types/comment.types'

export function useTextSelection(containerRef?: React.RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const getSelectionPosition = useCallback((range: Range) => {
    const rect = range.getBoundingClientRect()
    const container = containerRef?.current
    
    if (container) {
      const containerRect = container.getBoundingClientRect()
      return {
        start: range.startOffset,
        end: range.endOffset,
        pageX: rect.left - containerRect.left + rect.width / 2,
        pageY: rect.top - containerRect.top
      }
    }
    
    return {
      start: range.startOffset,
      end: range.endOffset,
      pageX: rect.left + rect.width / 2,
      pageY: rect.top + window.scrollY
    }
  }, [containerRef])

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()
    
    if (!sel || sel.rangeCount === 0) {
      setSelection(null)
      setIsSelecting(false)
      return
    }

    const range = sel.getRangeAt(0)
    const text = sel.toString().trim()

    if (text.length === 0) {
      setSelection(null)
      setIsSelecting(false)
      return
    }

    const container = containerRef?.current
    if (container && !container.contains(range.commonAncestorContainer)) {
      setSelection(null)
      setIsSelecting(false)
      return
    }

    const position = getSelectionPosition(range)
    const selectionId = `sel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    setSelection({
      id: selectionId,
      text,
      range: range.cloneRange(),
      position
    })
    setIsSelecting(true)
  }, [containerRef, getSelectionPosition])

  const clearSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
    }
    setSelection(null)
    setIsSelecting(false)
  }, [])

  const restoreSelection = useCallback((savedSelection: TextSelection) => {
    const sel = window.getSelection()
    if (sel && savedSelection.range) {
      sel.removeAllRanges()
      sel.addRange(savedSelection.range)
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        handleSelectionChange()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const container = containerRef?.current
      if (container && !container.contains(e.target as Node)) {
        clearSelection()
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleSelectionChange, clearSelection, containerRef])

  return {
    selection,
    isSelecting,
    clearSelection,
    restoreSelection
  }
}