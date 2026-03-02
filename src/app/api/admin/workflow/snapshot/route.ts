import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 [API] Snapshot POST request received')
    const body = await request.json()
    const { session_id, trademark_name, snapshot_data } = body

    console.log('📦 [API] Request data:', {
      session_id,
      trademark_name: trademark_name || 'none',
      hasSnapshotData: !!snapshot_data
    })

    if (!session_id || !snapshot_data) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use RPC function to safely upsert snapshot (handles generated columns)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.warn('⚠️ [API] Failed to get user, proceeding without user_id:', userError)
    }

    console.log('💾 [API] Upserting snapshot via RPC')
    console.log('📊 [API] User ID:', user?.id || 'none')

    // Use RPC function: it will extract metadata and handle generated columns
    const { data: snapshot, error } = await supabase
      .schema('debug_management')
      .rpc('upsert_workflow_snapshot', {
        p_session_id: session_id,
        p_snapshot_data: snapshot_data,
        p_user_id: user?.id || null
      })

    if (error) {
      console.error('❌ [API] Failed to upsert workflow snapshot:', error)
      return NextResponse.json(
        { error: 'Failed to create snapshot' },
        { status: 500 }
      )
    }

    console.log('✅ [API] Snapshot created successfully:', snapshot.id)
    return NextResponse.json({ success: true, data: snapshot })
  } catch (error) {
    console.error('❌ [API] Error creating workflow snapshot:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    // Direct Supabase query replacing WorkflowSnapshotRepository
    const supabase = await createClient()
    
    if (id) {
      const useRpc = searchParams.get('useRpc') === 'true'

      if (useRpc) {
        // Use RPC function to get snapshot with comments in one query
        console.log('🚀 [API] Using RPC function to fetch snapshot with comments:', id)

        const { data, error } = await supabase
          .schema('debug_management')
          .rpc('get_snapshot_with_comments', {
            p_snapshot_id: id
          })

        if (error) {
          console.error('❌ [API] RPC failed:', error)
          return NextResponse.json(
            { error: 'Failed to fetch snapshot' },
            { status: 500 }
          )
        }

        if (!data || data.error) {
          console.error('❌ [API] Snapshot not found via RPC')
          return NextResponse.json(
            { error: 'Snapshot not found' },
            { status: 404 }
          )
        }

        console.log('✅ [API] Snapshot fetched via RPC with', data.comments?.length || 0, 'comments')
        return NextResponse.json({ success: true, data })
      } else {
        // Original: Get single snapshot by ID (no comments)
        const { data: snapshot, error } = await supabase
          .schema('debug_management')
          .from('workflow_snapshots')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !snapshot) {
          console.error('❌ [API] Snapshot not found:', error)
          return NextResponse.json(
            { error: 'Snapshot not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ success: true, data: snapshot })
      }
    } else {
      // Get paginated list of snapshots
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '20')
      const sortBy = searchParams.get('sortBy') || 'created_at'
      const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
      const filterByUser = searchParams.get('filterByUser') === 'true'

      const offset = (page - 1) * pageSize

      // Get current user if filterByUser is true
      let userId: string | null = null
      if (filterByUser) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
        console.log('🔍 [API] Filtering snapshots by user:', userId)
      }

      // Build query
      let countQuery = supabase
        .schema('debug_management')
        .from('workflow_snapshots')
        .select('*', { count: 'exact', head: true })

      let dataQuery = supabase
        .schema('debug_management')
        .from('workflow_snapshots')
        .select('*')

      // Apply user filter if needed
      if (filterByUser && userId) {
        countQuery = countQuery.eq('user_id', userId)
        dataQuery = dataQuery.eq('user_id', userId)
      }

      // Get total count
      const { count } = await countQuery

      // Get paginated data
      const { data: snapshots, error } = await dataQuery
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error('❌ [API] Failed to get workflow snapshots:', error)
        return NextResponse.json(
          { error: 'Failed to get snapshots' },
          { status: 500 }
        )
      }

      console.log(`✅ [API] Fetched ${snapshots?.length || 0} snapshots (filterByUser: ${filterByUser})`)

      return NextResponse.json({
        success: true,
        data: snapshots || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      })
    }
  } catch (error) {
    console.error('❌ [API] Error fetching workflow snapshots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing snapshot id' },
        { status: 400 }
      )
    }
    
    // Direct Supabase query replacing WorkflowSnapshotRepository
    const supabase = await createClient()
    
    const { error } = await supabase
      .schema('debug_management')
      .from('workflow_snapshots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ [API] Failed to delete workflow snapshot:', error)
      return NextResponse.json(
        { error: 'Failed to delete snapshot' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [API] Error deleting workflow snapshot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}