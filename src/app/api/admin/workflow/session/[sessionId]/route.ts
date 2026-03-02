import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/infrastructure/database/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { sessionId } = await params

    // Get session data from analysis_sessions table
    const { data: session, error } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('id, trademark_name, business_description, status')
      .eq('id', sessionId)
      .single()
    
    if (error) {
      console.error('Failed to fetch session:', error)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}