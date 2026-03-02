import { createServiceRoleClient } from "@/infrastructure/database/server";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { withRateLimit } from "@/infrastructure/security/rate-limit";
import { requireAdmin } from '@/infrastructure/auth/middleware/role-guard';

// Zod 스키마 정의 - RPA 실제 사용 패턴에 맞게 수정
const UpdateCustomerStatusSchema = z.object({
  customer_id: z.string().uuid("유효한 UUID 형식이 아닙니다."),
  status: z.string().min(1, "status는 필수입니다."),
  status_details: z.record(z.any()).optional(), // jsonb 컬럼
});

/**
 * RPA 서버에서 고객 상태를 업데이트하는 API 엔드포인트
 * trademark_application 테이블의 status, status_details, updated_at 필드를 업데이트
 * URL: PATCH /api/rpa/update-customer-status
 */
export async function PATCH(request: NextRequest) {
  // --- 1. Rate limiting 체크 (RPA 전용) ---
  const rateLimitResult = await withRateLimit(request, "rpa");
  if (rateLimitResult instanceof Response) {
    return rateLimitResult;
  }

  // --- 2. API 키 인증 ---
  const headersList = await headers();
  const apiKey = headersList.get("X-RPA-API-Key");

  // Check if request is from RPA server with API key
  const isRpaRequest = apiKey === process.env.RPA_API_KEY;

  // If not RPA request, require admin authentication
  if (!isRpaRequest) {
    const authError = await requireAdmin(true);
    if (authError) return authError;
  }

  try {
    // --- 3. 요청 데이터 파싱 및 검증 ---
    const body = await request.json();
    const validationResult = UpdateCustomerStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "입력 데이터가 올바르지 않습니다.", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { customer_id, status, status_details } = validationResult.data;

    // --- 4. RLS를 우회하는 서비스 역할 클라이언트 생성 ---
    const supabase = await createServiceRoleClient();

    // --- 5. 고객 상태 업데이트 ---
    const updateData: {
      status: string;
      updated_at: string;
      status_details?: Record<string, any>;
    } = {
      status,
      updated_at: new Date().toISOString(), // 서버 시간으로 자동 설정
    };

    // status_details가 제공된 경우에만 추가
    if (status_details) {
      updateData.status_details = status_details;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from("trademark_application")
      .update(updateData)
      .eq("id", customer_id)
      .select("id, status, status_details, updated_at")
      .single();

    if (updateError) {
      console.error("Customer status update error:", updateError);
      
      // 특정 오류 처리
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          { error: "해당 고객을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: "고객 상태를 업데이트할 수 없습니다.", 
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    // --- 6. 성공 응답 ---
    return NextResponse.json({
      success: true,
      message: "고객 상태가 성공적으로 업데이트되었습니다.",
      data: {
        customer_id: updatedApplication.id,
        status: updatedApplication.status,
        status_details: updatedApplication.status_details,
        updated_at: updatedApplication.updated_at,
      },
    });

  } catch (error) {
    console.error("API route critical error:", error);
    
    // JSON 파싱 오류 처리
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "잘못된 JSON 형식입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "서버에서 처리 중 심각한 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}