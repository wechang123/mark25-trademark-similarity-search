import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: snapshot, error } = await supabase
      .schema('debug_management')
      .from('workflow_snapshots')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Failed to get workflow snapshot:', error)
      return NextResponse.json({ error: 'Failed to get snapshot' }, { status: 500 })
    }
    
    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }
    
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error('Error fetching snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}