import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/infrastructure/database/server";
import { WorkflowDetailResponse } from "@/features/admin-debug-console/_types/workflow.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is admin
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

    const { sessionId } = await params;

    // Fetch main session data from analysis_sessions
    const { data: session, error: sessionError } = await supabase
      .schema("trademark_analysis")
      .from("analysis_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session fetch error:", sessionError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch API call logs
    const { data: apiCalls } = await supabase
      .schema("trademark_analysis")
      .from("api_call_logs")
      .select("*")
      .eq("session_id", sessionId)
      .order("request_timestamp", { ascending: true });

    // Fetch data processing logs
    const { data: dataProcessing } = await supabase
      .schema("trademark_analysis")
      .from("data_processing_logs")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    // Fetch workflow checkpoints
    const { data: checkpoints } = await supabase
      .schema("public")
      .from("workflow_checkpoints")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    // Fetch KIPRIS searches
    const { data: kiprisSearches } = await supabase
      .schema("public")
      .from("kipris_searches")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    // Fetch final results from trademark_analysis schema
    const { data: finalResult } = await supabase
      .schema("trademark_analysis")
      .from("trademark_final_analysis")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    // Log admin access
    await supabase
      .schema("user_management")
      .from("admin_activity_logs")
      .insert({
        user_id: user.id,
        user_role: userRole,
        action: "read",
        target_table: "workflow_monitoring",
        target_id: sessionId,
        metadata: {
          endpoint: "/api/admin/workflow",
          session_id: sessionId,
        },
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
      });

    // Construct response
    const response: WorkflowDetailResponse = {
      session: {
        id: session.id,
        user_id: session.user_id,
        trademark_name: session.trademark_name,
        trademark_type: session.trademark_type,
        business_description: session.business_description,
        status: session.status,
        progress: session.progress || 0,
        product_classification_codes: session.product_classification_codes,
        similar_group_codes: session.similar_group_codes,
        designated_products: session.designated_products,
        created_at: session.created_at,
        updated_at: session.updated_at,
        completed_at: session.completed_at,
        stage2_started_at: session.updated_at,
        stage2_completed_at: session.completed_at,
        stage3_started_at: session.updated_at,
        stage3_completed_at: session.completed_at,
      },
      apiCalls: apiCalls || [],
      dataProcessing: dataProcessing || [],
      checkpoints: checkpoints || [],
      kiprisSearches: kiprisSearches || [],
      finalResult: finalResult || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching workflow data:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow data" },
      { status: 500 }
    );
  }
}
