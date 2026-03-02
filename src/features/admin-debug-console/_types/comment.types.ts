export interface CommentPosition {
  start: number
  end: number
  elementId?: string
  pageX?: number
  pageY?: number
}

export interface CommentReply {
  id: string
  text: string
  author: string
  timestamp: Date
}

export interface Comment {
  id: string
  selectionId: string
  text: string
  author: string
  timestamp: Date
  resolved: boolean
  replies: CommentReply[]
  position: CommentPosition
  highlightedText: string
  pageUrl?: string
}

export interface TextSelection {
  id: string
  text: string
  range: Range
  position: CommentPosition
}

export interface CommentStore {
  comments: Map<string, Comment>
  selections: Map<string, TextSelection>
  activeCommentId: string | null
  sidebarOpen: boolean
  
  addComment: (selection: TextSelection, text: string, author: string) => void
  updateComment: (id: string, text: string) => void
  deleteComment: (id: string) => void
  resolveComment: (id: string) => void
  addReply: (commentId: string, text: string, author: string) => void
  
  setActiveComment: (id: string | null) => void
  toggleSidebar: () => void
  
  getCommentsByPage: (pageUrl: string) => Comment[]
  getUnresolvedComments: () => Comment[]
}