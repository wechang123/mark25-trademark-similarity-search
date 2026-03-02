import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'

// GET - Fetch comments for a session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .schema('debug_management')
      .from('workflow_stage_comments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ [API] Failed to fetch comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // Transform to match frontend StageComment interface
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      stageId: comment.stage_id,
      stageName: comment.stage_name,
      text: comment.text,
      author: comment.author,
      timestamp: new Date(comment.created_at).toLocaleString('ko-KR'),
      resolved: comment.resolved,
      replies: comment.replies || []
    }))

    return NextResponse.json({
      success: true,
      data: transformedComments
    })
  } catch (error) {
    console.error('❌ [API] Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, stageId, stageName, text, author } = body

    if (!sessionId || !stageId || !stageName || !text || !author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: comment, error } = await supabase
      .schema('debug_management')
      .from('workflow_stage_comments')
      .insert({
        session_id: sessionId,
        stage_id: stageId,
        stage_name: stageName,
        text: text,
        author: author,
        resolved: false,
        replies: []
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [API] Failed to create comment:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Transform to match frontend format
    const transformedComment = {
      id: comment.id,
      stageId: comment.stage_id,
      stageName: comment.stage_name,
      text: comment.text,
      author: comment.author,
      timestamp: new Date(comment.created_at).toLocaleString('ko-KR'),
      resolved: comment.resolved,
      replies: comment.replies || []
    }

    console.log('✅ [API] Comment created:', comment.id)
    return NextResponse.json({
      success: true,
      data: transformedComment
    })
  } catch (error) {
    console.error('❌ [API] Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a comment (toggle resolved or add reply)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, resolved, reply } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields (id, action)' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (action === 'resolve') {
      // Toggle resolved status
      const { data: comment, error } = await supabase
        .schema('debug_management')
        .from('workflow_stage_comments')
        .update({
          resolved: resolved,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ [API] Failed to update comment:', error)
        return NextResponse.json(
          { error: 'Failed to update comment' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: comment })
    } else if (action === 'reply') {
      // Add a reply to the comment
      if (!reply || !reply.text || !reply.author) {
        return NextResponse.json(
          { error: 'Missing reply fields (text, author)' },
          { status: 400 }
        )
      }

      // First, fetch current comment to get existing replies
      const { data: currentComment, error: fetchError } = await supabase
        .schema('debug_management')
        .from('workflow_stage_comments')
        .select('replies')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('❌ [API] Failed to fetch comment:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch comment' },
          { status: 500 }
        )
      }

      // Create new reply object
      const newReply = {
        id: `reply-${Date.now()}`,
        text: reply.text,
        author: reply.author,
        timestamp: new Date().toLocaleString('ko-KR')
      }

      // Append to existing replies
      const updatedReplies = [...(currentComment.replies || []), newReply]

      // Update comment with new replies
      const { data: updatedComment, error: updateError } = await supabase
        .schema('debug_management')
        .from('workflow_stage_comments')
        .update({
          replies: updatedReplies,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [API] Failed to add reply:', updateError)
        return NextResponse.json(
          { error: 'Failed to add reply' },
          { status: 500 }
        )
      }

      console.log('✅ [API] Reply added to comment:', id)
      return NextResponse.json({ success: true, data: updatedComment })
    } else {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ [API] Error updating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .schema('debug_management')
      .from('workflow_stage_comments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ [API] Failed to delete comment:', error)
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    console.log('✅ [API] Comment deleted:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [API] Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
