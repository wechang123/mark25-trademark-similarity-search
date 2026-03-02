import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/database/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()

    // 로그아웃 처리
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: '로그아웃이 완료되었습니다.'
    })

  } catch (error) {
    console.error('Signout API error:', error)
    
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}