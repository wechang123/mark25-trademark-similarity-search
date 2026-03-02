import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 입력값 검증
    const { email } = resetPasswordSchema.parse(body)
    
    const supabase = await createClient()
    
    // 비밀번호 재설정 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5000'}/reset-password`
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json(
        { error: '비밀번호 재설정 이메일 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.'
    })

  } catch (error) {
    console.error('Reset password API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '비밀번호 재설정 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}