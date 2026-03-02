import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const { email, password, name, phone, marketingAgreed } = await req.json()

    // Service Role Client (RLS 우회)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: '서버 설정 오류가 발생했습니다.' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 입력값 검증
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: '이메일과 비밀번호를 입력해주세요.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: '올바른 이메일 형식을 입력해주세요.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: '비밀번호는 8자 이상이어야 합니다.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 비밀번호 특수문자 검증
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    if (!hasSpecial) {
      return new Response(
        JSON.stringify({ error: '비밀번호는 특수문자를 포함해야 합니다.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('🔍 [Edge Function] Checking duplicate email:', email)

    // 이메일 중복 체크 (Service Role로 RLS 우회)
    const { data: existing, error: checkError } = await supabase
      .schema('user_management')
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    console.log('🔍 [Edge Function] Duplicate check result:', { existing, checkError })

    if (checkError) {
      console.error('Duplicate check error:', checkError)
    }

    if (existing) {
      console.log('❌ [Edge Function] Email already exists!')
      return new Response(
        JSON.stringify({ error: '이미 사용 중인 이메일입니다.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ [Edge Function] Email available, creating user...')

    // 회원가입
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,  // 이메일 인증 필수 (인증 메일 발송)
      user_metadata: {
        name: name || '',
        phone: phone || '',
        marketing_agreed: marketingAgreed || false
      },
      app_metadata: {
        role: 'user',
        provider: 'email'
      }
    })

    if (error) {
      console.error('❌ [Edge Function] Signup error:', error)

      // Supabase Auth 에러 메시지 매핑
      const errorMap: Record<string, string> = {
        'User already registered': '이미 가입된 이메일입니다.',
        'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다.',
        'Email not confirmed': '이메일 인증이 필요합니다.',
        'Too many requests': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
      }

      const errorMessage = errorMap[error.message] || error.message

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('✅ [Edge Function] User created successfully:', data.user?.id)

    // 이메일 인증 링크 생성
    console.log('📧 [Edge Function] Generating email verification link...')
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
    })

    if (linkError) {
      console.error('❌ [Edge Function] Link generation error:', linkError)
      // 사용자는 생성되었지만 이메일 발송 실패
      return new Response(
        JSON.stringify({
          success: true,
          requiresVerification: true,
          message: '회원가입이 완료되었습니다. 이메일 발송 중 오류가 발생했습니다.'
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      )
    }

    console.log('✅ [Edge Function] Verification link generated')

    // Resend로 이메일 발송
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('❌ [Edge Function] RESEND_API_KEY not found')
      return new Response(
        JSON.stringify({
          success: true,
          requiresVerification: true,
          message: '회원가입이 완료되었습니다. 이메일 발송 설정 오류가 발생했습니다.'
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      )
    }

    console.log('📧 [Edge Function] Sending email via Resend...')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">이메일 인증</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">안녕하세요,</p>
            <p style="font-size: 16px; margin-bottom: 30px;">
              IP-Dr 회원가입을 완료하려면 아래 버튼을 클릭하여 이메일 주소를 인증해주세요.
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${linkData.properties.action_link}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 16px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                이메일 인증하기
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:
            </p>
            <p style="font-size: 12px; color: #999; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${linkData.properties.action_link}
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              본 이메일은 IP-Dr 회원가입 요청에 의해 발송되었습니다.<br>
              요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'IP-Dr <noreply@ip-dr.com>',
          to: [email],
          subject: '[IP-Dr] 이메일 인증을 완료해주세요',
          html: emailHtml,
        }),
      })

      const resendData = await resendResponse.json()
      console.log('📧 [Edge Function] Resend response:', resendData)

      if (!resendResponse.ok) {
        console.error('❌ [Edge Function] Email sending failed:', resendData)
        return new Response(
          JSON.stringify({
            success: true,
            requiresVerification: true,
            message: '회원가입이 완료되었습니다. 이메일 발송 중 오류가 발생했습니다.'
          }),
          {
            status: 200,
            headers: corsHeaders
          }
        )
      }

      console.log('✅ [Edge Function] Email sent successfully!')

    } catch (emailError) {
      console.error('❌ [Edge Function] Email sending error:', emailError)
      return new Response(
        JSON.stringify({
          success: true,
          requiresVerification: true,
          message: '회원가입이 완료되었습니다. 이메일 발송 중 오류가 발생했습니다.'
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      )
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        requiresVerification: true,
        message: '회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.'
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    )

  } catch (error) {
    console.error('❌ [Edge Function] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: '회원가입 중 오류가 발생했습니다.' }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
