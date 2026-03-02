import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const sortBy = searchParams.get('sortBy') || 'created_at'  // analysis_date → created_at
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
    
    const limit = pageSize
    const offset = (page - 1) * pageSize
    
    const supabase = await createClient()
    
    // Get total count
    const { count } = await supabase
      .schema('debug_management')
      .from('workflow_snapshots')
      .select('*', { count: 'exact', head: true })
    
    // Get paginated data
    const { data: snapshots, error } = await supabase
      .schema('debug_management')
      .from('workflow_snapshots')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Failed to get workflow snapshots:', error)
      return NextResponse.json({ error: 'Failed to get snapshots' }, { status: 500 })
    }
    
    return NextResponse.json({
      data: snapshots || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Error fetching snapshots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .schema('debug_management')
      .from('workflow_snapshots')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Failed to delete workflow snapshot:', error)
      return NextResponse.json({ error: 'Failed to delete snapshot' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}