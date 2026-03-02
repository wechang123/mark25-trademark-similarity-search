import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/database/server"
import { cookies } from "next/headers"
import { sendEmail } from "@/infrastructure/email/resend"
import { getNotificationEmailTemplate } from "@/infrastructure/email/templates"
import { createValidatedApiRoute } from '@/infrastructure/swagger/middleware/validation-middleware'
import { 
  PreBookingRequestSchema, 
  PreBookingResponseSchema 
} from '@/infrastructure/swagger/schemas/pre-booking.schema'

// Helper function to check if tables exist
async function checkDatabaseSetup(supabase: any) {
  try {
    // Try to query the service_pre_bookings table
    const { error } = await supabase.from("service_pre_bookings").select("id").limit(1)
    if (error) {
      console.log("Database setup check failed:", error.message)
      return false
    }
    console.log("✅ Database setup check passed")
    return true
  } catch (error) {
    console.error("Database setup check failed:", error)
    return false
  }
}

export const POST = createValidatedApiRoute({
  path: '/api/pre-booking',
  method: 'POST',
  summary: '서비스 출시 알림 사전 예약',
  description: '서비스 출시 전 사용자 이메일을 등록하여 출시 알림을 받을 수 있도록 합니다. 중복 이메일 방지 기능이 포함되어 있습니다.',
  tags: ['Pre-booking'],
  body: PreBookingRequestSchema,
  response: PreBookingResponseSchema,
  requiresAuth: false,
  errorResponses: {
    400: 'Bad Request - 필수 정보 누락 또는 잘못된 이메일 형식',
    409: 'Conflict - 이미 등록된 이메일',
    500: 'Internal Server Error - 서버 오류',
    503: 'Service Unavailable - 데이터베이스 설정 필요'
  }
}, async (request: NextRequest, { validatedBody }) => {
  console.log("📝 Service notification API called")

  try {
    if (!validatedBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          message: "요청 데이터가 올바르지 않습니다."
        },
        { status: 400 }
      )
    }

    const { source, email } = validatedBody;

    console.log("📋 Request data:", { source, email: "***" })

    // Supabase 클라이언트 생성
    let supabase: any = null
    let isDatabaseReady = false

    try {
      const cookieStore = await cookies()
      supabase = await createClient(cookieStore)
      isDatabaseReady = await checkDatabaseSetup(supabase)
    } catch (error) {
      console.error("❌ Supabase client creation failed:", error)
      isDatabaseReady = false
    }

    if (!isDatabaseReady || !supabase) {
      console.log("❌ Database not ready, returning setup required response")
      return NextResponse.json(
        {
          error: "데이터베이스가 설정되지 않았습니다. 관리자에게 문의해주세요.",
          setup_required: true,
          message: "서비스가 준비 중입니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 503 },
      )
    }

    // 중복 이메일 확인
    console.log("🔍 Checking for duplicate email...")
    const normalizedEmail = email.toLowerCase().trim()
    console.log("📧 Normalized email for check:", normalizedEmail.substring(0, 3) + "***")
    
    const { data: existingNotification, error: checkError } = await supabase
      .from("service_pre_bookings")
      .select("id, email, created_at")
      .eq("email", normalizedEmail)
      .maybeSingle() // maybeSingle() 사용으로 0개 또는 1개 결과 허용

    console.log("🔍 Duplicate check result:", {
      found: !!existingNotification,
      error: checkError?.message,
      errorCode: checkError?.code
    })

    if (checkError) {
      console.error("Database check error:", checkError)
      console.error("Error details:", JSON.stringify(checkError, null, 2))
      return NextResponse.json(
        {
          error: "데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
          setup_required: true,
          debug_info: process.env.NODE_ENV === 'development' ? {
            code: checkError.code,
            message: checkError.message
          } : undefined
        },
        { status: 500 },
      )
    }

    if (existingNotification) {
      console.log("📧 Existing notification found:", existingNotification.id)

      // 중복 이메일인 경우 에러 응답 반환 (이메일 재발송 안함)
      return NextResponse.json(
        {
          success: false,
          existing: true,
          error: "이미 해당 이메일로 출시 알림 신청이 완료되었습니다.",
          message: "이미 해당 이메일로 서비스 출시 알림 신청이 완료되었습니다.",
        },
        { status: 409 }
      )
    }

    // 데이터베이스에 저장
    console.log("💾 Saving to database...")
    
    // INSERT할 데이터 로깅
    const insertData = {
      source,
      email: email.toLowerCase().trim(),
      status: "active",
    }
    
    console.log("📋 INSERT data:", {
      ...insertData,
      email: "***"
    })
    
    const { data: notification, error: insertError } = await supabase
      .from("service_pre_bookings")
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error("❌ Database insert error:", insertError)
      console.error("❌ Error code:", insertError.code)
      console.error("❌ Error message:", insertError.message)
      console.error("❌ Error details:", JSON.stringify(insertError, null, 2))

      if (insertError.code === "23505") {
        if (insertError.message.includes("email")) {
          return NextResponse.json({ error: "이미 해당 이메일로 출시 알림 신청이 완료되었습니다." }, { status: 409 })
        }
      }

      return NextResponse.json(
        { 
          error: "데이터베이스 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
          debug_info: process.env.NODE_ENV === 'development' ? {
            code: insertError.code,
            message: insertError.message,
            hint: insertError.hint
          } : undefined
        },
        { status: 500 },
      )
    }

    console.log("✅ Notification saved to database:", notification.id)

    // 이메일 발송 (안전하게 처리)
    console.log("📧 Attempting to send email...")
    let emailSent = false
    let emailError: string | null = null

    try {
      // 환경 변수 확인
      const resendApiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.FROM_EMAIL

      console.log("🔧 Email config check:")
      console.log("RESEND_API_KEY exists:", !!resendApiKey)
      console.log("FROM_EMAIL:", fromEmail)

      if (!resendApiKey || !fromEmail) {
        throw new Error("이메일 설정이 완료되지 않았습니다.")
      }

      const emailTemplate = getNotificationEmailTemplate({
        email: notification.email,
        notificationId: notification.id,
        createdAt: notification.created_at,
      })

      console.log("📧 Email template generated, sending...")

      const emailResult = await sendEmail({
        to: notification.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      })

      emailSent = emailResult.success
      console.log("✅ Email sent successfully:", emailResult.messageId)
    } catch (error) {
      console.error("❌ Email sending failed:", error)
      emailError = error instanceof Error ? error.message : "이메일 발송에 실패했습니다."
    }

    // 성공 응답 반환
    const response = {
      success: true as const,
      booking: {
        id: notification.id as string,
        created_at: notification.created_at as string,
      },
      email_sent: emailSent,
      email_error: emailError || undefined,
    }

    console.log("✅ API response prepared")

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("❌ Service notification API error:", error)

    // Return proper JSON error response
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        setup_required: false,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
});
