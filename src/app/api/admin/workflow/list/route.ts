import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/infrastructure/database/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 🆕 새로운 권한 확인 방식: user.app_metadata에서 role 직접 접근
    const userRole = user.app_metadata?.role as string;

    if (!userRole || (userRole !== "admin" && userRole !== "manager")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    const body = await request.json()
    const { limit = 20, offset = 0, status } = body
    
    // Build query
    let query = supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select(`
        id,
        trademark_name,
        status,
        progress,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: workflows, error } = await query
    
    if (error) {
      console.error('Error fetching workflows:', error)
      return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
    }
    
    // Transform data for UI
    const workflowList = workflows?.map(w => ({
      id: w.id,
      trademark_name: w.trademark_name,
      user_id: w.user_id,
      status: w.status,
      created_at: w.created_at,
      progress: w.progress || 0
    })) || []
    
    return NextResponse.json({ workflows: workflowList })
    
  } catch (error) {
    console.error('Error listing workflows:', error)
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    )
  }
}