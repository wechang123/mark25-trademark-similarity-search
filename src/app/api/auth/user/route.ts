import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/database/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').optional(),
  phone: z.string().optional(),
  marketing_agreed: z.boolean().optional()
})

// 사용자 프로필 조회
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .schema('user_management')
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: '프로필 정보를 가져올 수 없습니다.' },
        { status: 500 }
      )
    }

    // Get role from auth app_metadata
    const userRole = user.app_metadata?.role || 'user'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: profile.name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        marketing_agreed: profile.marketing_agreed,
        role: userRole,
        email_verified: user.email_confirmed_at !== null,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Get user API error:', error)
    
    return NextResponse.json(
      { error: '사용자 정보를 가져올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 입력값 검증
    const validatedData = updateProfileSchema.parse(body)
    
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 프로필 업데이트
    const { data: updatedProfile, error: updateError } = await supabase
      .schema('user_management')
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        avatar_url: updatedProfile.avatar_url,
        marketing_agreed: updatedProfile.marketing_agreed,
        role: updatedProfile.role,
        email_verified: user.email_confirmed_at !== null,
        created_at: user.created_at
      },
      message: '프로필이 업데이트되었습니다.'
    })

  } catch (error) {
    console.error('Update user API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '프로필 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}