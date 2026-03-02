'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Comment, CommentStore, TextSelection, CommentReply } from '../_types/comment.types'

export const useCommentStore = create<CommentStore>()(
  persist(
    (set, get) => ({
      comments: new Map(),
      selections: new Map(),
      activeCommentId: null,
      sidebarOpen: false,

      addComment: (selection: TextSelection, text: string, author: string) => {
        const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newComment: Comment = {
          id: commentId,
          selectionId: selection.id,
          text,
          author,
          timestamp: new Date(),
          resolved: false,
          replies: [],
          position: selection.position,
          highlightedText: selection.text,
          pageUrl: window.location.pathname
        }

        set((state) => {
          const newComments = new Map(state.comments)
          const newSelections = new Map(state.selections)
          
          newComments.set(commentId, newComment)
          newSelections.set(selection.id, selection)
          
          return {
            comments: newComments,
            selections: newSelections,
            activeCommentId: commentId
          }
        })
      },

      updateComment: (id: string, text: string) => {
        set((state) => {
          const newComments = new Map(state.comments)
          const comment = newComments.get(id)
          
          if (comment) {
            newComments.set(id, {
              ...comment,
              text,
              timestamp: new Date()
            })
          }
          
          return { comments: newComments }
        })
      },

      deleteComment: (id: string) => {
        set((state) => {
          const newComments = new Map(state.comments)
          const comment = newComments.get(id)
          
          if (comment) {
            const newSelections = new Map(state.selections)
            newSelections.delete(comment.selectionId)
            newComments.delete(id)
            
            return {
              comments: newComments,
              selections: newSelections,
              activeCommentId: state.activeCommentId === id ? null : state.activeCommentId
            }
          }
          
          return state
        })
      },

      resolveComment: (id: string) => {
        set((state) => {
          const newComments = new Map(state.comments)
          const comment = newComments.get(id)
          
          if (comment) {
            newComments.set(id, {
              ...comment,
              resolved: !comment.resolved
            })
          }
          
          return { comments: newComments }
        })
      },

      addReply: (commentId: string, text: string, author: string) => {
        set((state) => {
          const newComments = new Map(state.comments)
          const comment = newComments.get(commentId)
          
          if (comment) {
            const replyId = `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const newReply: CommentReply = {
              id: replyId,
              text,
              author,
              timestamp: new Date()
            }
            
            newComments.set(commentId, {
              ...comment,
              replies: [...comment.replies, newReply]
            })
          }
          
          return { comments: newComments }
        })
      },

      setActiveComment: (id: string | null) => {
        set({ activeCommentId: id })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      getCommentsByPage: (pageUrl: string) => {
        const { comments } = get()
        return Array.from(comments.values()).filter(
          comment => comment.pageUrl === pageUrl
        )
      },

      getUnresolvedComments: () => {
        const { comments } = get()
        return Array.from(comments.values()).filter(
          comment => !comment.resolved
        )
      }
    }),
    {
      name: 'admin-comments-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          
          const parsed = JSON.parse(str)
          return {
            ...parsed,
            state: {
              ...parsed.state,
              comments: new Map(parsed.state.comments),
              selections: new Map(parsed.state.selections)
            }
          }
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              comments: Array.from(value.state.comments.entries()),
              selections: Array.from(value.state.selections.entries())
            }
          }
          localStorage.setItem(name, JSON.stringify(serialized))
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
)