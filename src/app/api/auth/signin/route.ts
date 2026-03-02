import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/database/server'
import { z } from 'zod'

const signinSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  rememberMe: z.boolean().optional()
})

function getErrorMessage(error: string): string {
  const errorMap: { [key: string]: string } = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
    'Email not confirmed': '이메일 인증이 필요합니다.',
    'Too many requests': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
  }

  return errorMap[error] || '로그인 중 오류가 발생했습니다.'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 입력값 검증
    const validatedData = signinSchema.parse(body)
    
    const supabase = await createServerSupabaseClient()

    // 로그인 처리
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    })

    if (authError) {
      console.error('Auth signin error:', authError)
      return NextResponse.json(
        { error: getErrorMessage(authError.message) },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '로그인에 실패했습니다.' },
        { status: 401 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.'
    })

  } catch (error) {
    console.error('Signin API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}