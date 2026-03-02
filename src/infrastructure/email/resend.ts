import { Resend } from "resend"

// 환경 변수 검증 (런타임에만 확인)
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL

// Resend 클라이언트 인스턴스 (lazy initialization)
let resendInstance: Resend | null = null

/**
 * Resend 클라이언트 인스턴스를 가져옵니다.
 * 런타임에만 초기화되므로 빌드 타임 에러를 방지합니다.
 */
function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY가 설정되지 않았습니다. 환경 변수를 확인해주세요.")
  }

  if (!resendInstance) {
    console.log("📧 Initializing Resend client...")
    console.log("RESEND_API_KEY exists:", !!RESEND_API_KEY)
    console.log("FROM_EMAIL:", FROM_EMAIL)
    resendInstance = new Resend(RESEND_API_KEY)
  }

  return resendInstance
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    // 환경 변수 확인
    if (!FROM_EMAIL) {
      throw new Error("FROM_EMAIL이 설정되지 않았습니다. 환경 변수를 확인해주세요.")
    }

    console.log("📧 Sending email...")
    console.log("To:", to)
    console.log("From:", FROM_EMAIL)
    console.log("Subject:", subject)

    // FROM_EMAIL 형식 검증 추가
    if (!FROM_EMAIL.includes("@resend.dev") && !FROM_EMAIL.includes("onboarding@resend.dev")) {
      console.warn("⚠️ Warning: Using non-Resend domain. Make sure it's verified in Resend dashboard.")
    }

    // 런타임에 Resend 클라이언트 가져오기
    const resend = getResendClient()

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    })

    console.log("📧 Resend API response:", result)

    if (result.error) {
      console.error("❌ Resend API error:", result.error)
      throw new Error(`Resend API error: ${result.error.message}`)
    }

    console.log("✅ Email sent successfully:", result.data?.id)

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    console.error("❌ Email sending failed:", error)

    // 더 자세한 에러 정보 로깅
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    throw error
  }
}

// 이메일 발송 테스트 함수
export async function testEmailConnection() {
  try {
    console.log("🧪 Testing email connection...")

    const testResult = await sendEmail({
      to: "test@example.com",
      subject: "Test Email from Mark25",
      html: "<p>This is a test email from Mark25 service</p>",
      text: "This is a test email from Mark25 service",
    })

    console.log("✅ Email test successful:", testResult)
    return testResult
  } catch (error) {
    console.error("❌ Email test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
