import { NextRequest, NextResponse } from "next/server";
import { recordWorkflowEvent } from "@/infrastructure/database/workflow-events";
import { createClient } from "@/infrastructure/database/server";

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🆕 새로운 권한 확인 방식: user.app_metadata에서 role 직접 접근
    const userRole = user.app_metadata?.role as string;

    if (!userRole || (userRole !== "admin" && userRole !== "manager")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 요청 데이터 파싱
    const { sessionId, stage, substep, status } = await request.json();

    if (!sessionId || !stage || !substep || !status) {
      return NextResponse.json(
        {
          error: "Missing required fields: sessionId, stage, substep, status",
        },
        { status: 400 }
      );
    }

    console.log(`🧪 [Test Event API] Creating test event:`, {
      sessionId,
      stage,
      substep,
      status,
    });

    // 테스트 이벤트 기록 및 발행
    await recordWorkflowEvent(
      sessionId,
      stage as any,
      substep,
      status as any,
      { isTest: true, testTimestamp: new Date().toISOString() },
      undefined,
      true // isDebugMode
    );

    return NextResponse.json({
      success: true,
      message: `Test event created: ${stage}/${substep} - ${status}`,
    });
  } catch (error) {
    console.error("[Test Event API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create test event" },
      { status: 500 }
    );
  }
}
