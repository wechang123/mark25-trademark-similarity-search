import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabaseClient } from '@/infrastructure/database/server'
import { z } from 'zod'
import { 
  recordGoodsClassificationEvent, 
  updateSessionProgress 
} from '@/infrastructure/database/workflow-events'
import { createWorkflowRunner } from '@/infrastructure/langgraph/trademark-workflow'
import { workflowEventBus } from '@/infrastructure/events/workflow-event-bus'

// 입력 데이터 검증 스키마
const debugAnalysisSchema = z.object({
  trademarkName: z.string().min(1, '상표명을 입력해주세요'),
  trademarkType: z.enum(['text', 'image', 'combined']),
  businessDescription: z.string().min(1, '비즈니스 설명을 입력해주세요'),
  is_debug_mode: z.boolean().optional(),
  debug_user_id: z.string().optional(),
  hasImage: z.boolean().optional(),
  imageFile: z.any().optional(),
  similarGroupCodes: z.array(z.string()).optional(),
  extractedProducts: z.array(z.string()).optional(),
  businessDescriptionKeywords: z.array(z.string()).optional(),
  user_id: z.string().optional(),
  simplified: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 🆕 새로운 권한 확인 방식: user.app_metadata에서 role 직접 접근
    const userRole = user.app_metadata?.role as string;

    if (!userRole || (userRole !== "admin" && userRole !== "manager")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    const body = await request.json()
    const validatedData = debugAnalysisSchema.parse(body)
    
    // analysis_sessions 테이블에 디버그 세션 생성
    const { data: session, error: sessionError } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .insert({
        user_id: user.id,
        trademark_name: validatedData.trademarkName,
        trademark_type: validatedData.trademarkType,
        business_description: validatedData.businessDescription,
        status: 'active',
        progress: 0,
        is_debug_mode: true,
        debug_user_id: user.id,
        debug_notes: `Debug analysis started by ${user.email}`,
        product_classification_codes: [],
        similar_group_codes: validatedData.similarGroupCodes || [],
        designated_products: validatedData.extractedProducts || []
      })
      .select()
      .single()
    
    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json({ error: 'Failed to create debug session' }, { status: 500 })
    }
    
    // stage1_trademark_input 테이블 사용 제거 - analysis_sessions로 통일
    
    // 초기 워크플로우 이벤트 기록 (디버그 모드로)
    await recordGoodsClassificationEvent(
      session.id,
      'extract_query',
      'processing',
      {
        query: validatedData.businessDescription
      },
      true // isDebugMode
    )
    
    // 세션 진행 상태 업데이트
    await updateSessionProgress(session.id, {
      current_stage: 'goods_classification',
      current_substep: 'extract_query',
      progress: 10,
      status: 'processing'
    })
    
    // 초기 API 호출 로그 기록
    await supabase
      .schema('trademark_analysis')
      .from('api_call_logs')
      .insert({
        session_id: session.id,
        stage: 'goods_classifier',
        api_type: 'gemini',
        request_timestamp: new Date().toISOString(),
        request_data: {
          action: 'debug_analysis_start',
          trademark_name: validatedData.trademarkName,
          business_description: validatedData.businessDescription
        },
        tokens_used: 0,
        cost_estimate: 0
      })
    
    // LangGraph 워크플로우 직접 실행 (백그라운드에서 진행)
    // 기존의 fetch 호출 대신 직접 워크플로우를 실행
    const runWorkflow = async () => {
      const startTime = Date.now()
      console.log('🚀 [Admin Debug] Starting workflow execution:', {
        sessionId: session.id,
        userId: user.id,
        timestamp: new Date().toISOString(),
        input: {
          trademarkName: validatedData.trademarkName,
          businessDescriptionLength: validatedData.businessDescription.length,
          hasImage: validatedData.hasImage,
          similarGroupCodes: validatedData.similarGroupCodes?.length || 0
        }
      })
      
      try {
        // 워크플로우 러너 생성
        console.log('🔧 [Admin Debug] Creating workflow runner with debug mode enabled')
        const runner = createWorkflowRunner({
          maxRetries: 10,
          timeoutMs: 300000, // 5 minutes
          enableFallback: true,
          parallelAnalysis: false,
          expertAnalysisEnabled: true
        })
        
        // 워크플로우 실행 (디버그 모드 활성화)
        console.log('▶️ [Admin Debug] Executing workflow analyze method')
        const result = await runner.analyze({
          sessionId: session.id,
          userId: user.id,
          trademarkName: validatedData.trademarkName,
          trademarkType: validatedData.trademarkType,
          businessDescription: validatedData.businessDescription,
          analysisType: 'comprehensive',
          hasImage: validatedData.hasImage,
          imageFile: validatedData.imageFile,
          similarGroupCodes: validatedData.similarGroupCodes,
          extractedProducts: validatedData.extractedProducts,
          businessDescriptionKeywords: validatedData.businessDescriptionKeywords,
          isDebugMode: true
        })
        
        const executionTime = Date.now() - startTime
        console.log('🎯 [Admin Debug] Workflow completed:', {
          sessionId: session.id,
          success: result.currentStep === 'COMPLETE',
          finalReport: result.finalReport ? 'Generated' : 'Not generated',
          executionTimeMs: executionTime,
          executionTimeSeconds: (executionTime / 1000).toFixed(2)
        })
        
        // 최종 상태 업데이트
        console.log('📊 [Admin Debug] Updating final session progress to completed')
        await updateSessionProgress(session.id, {
          current_stage: 'final_analysis',
          current_substep: undefined,
          progress: 100,
          status: result.currentStep === 'COMPLETE' ? 'completed' : 'failed',
          workflow_metadata: {
            executionTime: executionTime,
            completedAt: new Date().toISOString()
          }
        })
        
      } catch (error) {
        const executionTime = Date.now() - startTime
        console.error('🔴 [Admin Debug] Workflow execution error:', {
          sessionId: session.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          executionTimeMs: executionTime,
          timestamp: new Date().toISOString()
        })
        
        // 에러 상태 업데이트
        console.log('📊 [Admin Debug] Updating session progress to error state')
        await updateSessionProgress(session.id, {
          current_stage: 'final_analysis',
          current_substep: undefined,
          progress: 0,
          status: 'failed',
          workflow_metadata: {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            failedAt: new Date().toISOString()
          }
        })
        
        // 에러 이벤트 기록 (디버그 모드로)
        console.log('📝 [Admin Debug] Recording error event')
        await recordGoodsClassificationEvent(
          session.id,
          'extract_query',
          'failed',
          {
            query: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          },
          true // isDebugMode
        )
      }
    }
    
    // 백그라운드에서 워크플로우 실행 (SSE 연결 확립을 위한 충분한 지연)
    console.log('⏱️ [Admin Debug] Scheduling workflow execution with 1000ms delay for SSE setup')
    setTimeout(() => {
      console.log('⏰ [Admin Debug] Delay complete, starting workflow execution')
      console.log('📊 [Admin Debug] EventBus info:', {
        activeListeners: workflowEventBus.getActiveListenerCount(),
        sessionInfo: workflowEventBus.getActiveSessionInfo(),
        bufferedEvents: workflowEventBus.getBufferedEvents(session.id).length
      })
      runWorkflow().catch(error => {
        console.error('💥 [Admin Debug] Failed to start LangGraph workflow:', error)
      })
    }, 1000) // 1초 지연으로 SSE 연결이 확실히 설정되도록 함
    
    // 관리자 활동 로그 기록
    await supabase
      .schema('user_management')
      .from('admin_activity_logs')
      .insert({
        user_id: user.id,
        user_role: userRole,
        action: 'create',
        target_table: 'debug_analysis_session',
        target_id: session.id,
        metadata: {
          endpoint: '/api/admin/workflow/execute',
          session_id: session.id,
          stage1_id: session.id, // analysis_sessions ID 사용
          trademark_name: validatedData.trademarkName
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
    
    return NextResponse.json({
      sessionId: session.id,
      stage1Id: session.id, // analysis_sessions ID를 stage1Id로 사용
      message: 'Debug analysis started successfully',
      streamUrl: `/api/admin/workflow/stream/${session.id}`
    })
    
  } catch (error) {
    console.error('Error starting debug analysis:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to start debug analysis' },
      { status: 500 }
    )
  }
}