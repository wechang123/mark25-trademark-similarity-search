/**
 * Stage 1 API: 상표 기본 정보 저장
 * 
 * TrademarkSelectionFlow에서 사용자가 입력한 상표 정보를 데이터베이스에 저장
 * analysis_sessions 테이블 사용 (stage1_trademark_input 대체)
 * 이후 Stage 2에서 이 데이터를 참조하여 LangGraph 분석 수행
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, createServiceRoleClient } from '@/infrastructure/database/server';

// 입력 데이터 검증 스키마
const Stage1InputSchema = z.object({
  trademarkName: z.string().min(1, '상표명은 필수입니다'),
  trademarkType: z.enum(['text', 'image', 'combined']),
  businessDescription: z.string().min(1, '사업 설명은 필수입니다'),
  productServices: z.array(z.string()).default([]),
  targetMarket: z.string().default(''),
  businessModel: z.string().default(''),
  trademarkImageUrl: z.string().nullable().default(null),
  similarGroupCodes: z.array(z.string()).default([])  // LangGraph에서 처리하므로 빈 배열 허용
});

// 응답 데이터 스키마
const Stage1ResponseSchema = z.object({
  success: z.boolean(),
  stage1Id: z.string(),
  message: z.string(),
  data: z.object({
    id: z.string(),
    trademarkName: z.string(),
    trademarkType: z.string(),
    businessDescription: z.string(),
    productServices: z.array(z.string()),
    trademarkImageUrl: z.string().nullable(),
    createdAt: z.string()
  })
});

export async function POST(request: NextRequest) {
  console.log('📝 [Stage1 API] Starting Stage 1 data save...');
  
  try {
    // 요청 데이터 검증
    const body = await request.json();
    const validatedInput = Stage1InputSchema.parse(body);
    
    console.log('✅ [Stage1 API] Input validated:', {
      trademarkName: validatedInput.trademarkName,
      trademarkType: validatedInput.trademarkType,
      similarGroupCodesCount: validatedInput.similarGroupCodes.length
    });

    // 🔧 현재 사용자 가져오기 (RLS 정책 준수)
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('⚠️ [Stage1 API] No authenticated user found, proceeding without user_id');
    }
    
    console.log('✅ [Stage1 API] User authenticated:', { userId: user?.id?.slice(0, 8) || 'anonymous' });
    
    // 🎯 가장 연관성 높은 유사군 코드 1개 선택 (첫 번째 = 가장 관련성 높음)
    const selectedSimilarCode = validatedInput.similarGroupCodes[0];
    console.log('🎯 [Stage1 API] Selected most relevant similar group code:', selectedSimilarCode);
    
    // analysis_sessions 테이블에 데이터 저장 (stage1_trademark_input 대체)
    const insertData = {
      trademark_name: validatedInput.trademarkName,
      trademark_type: validatedInput.trademarkType,
      image_url: validatedInput.trademarkImageUrl, // trademark_image_url -> image_url
      business_description: validatedInput.businessDescription,
      product_services: validatedInput.productServices,
      similar_group_codes: validatedInput.similarGroupCodes,
      selected_similar_code: selectedSimilarCode, // 🎯 선택된 유사군 코드 저장
      user_id: user?.id || null, // 🔧 RLS 정책 준수
      status: 'pending', // 초기 상태
      progress: 0 // 초기 진행률
    };
    
    console.log('📝 [Stage1 API] Insert data prepared for analysis_sessions:', insertData);
    
    const { data: stage1Data, error: stage1Error } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .insert(insertData)
      .select('*')
      .single();

    if (stage1Error) {
      console.error('❌ [Stage1 API] Database insert error details:', {
        error: stage1Error,
        errorMessage: stage1Error?.message,
        errorCode: stage1Error?.code,
        errorDetails: stage1Error?.details,
        hint: stage1Error?.hint,
        insertData
      });
      return NextResponse.json({
        success: false,
        error: stage1Error.message || stage1Error?.details || 'Stage 1 데이터 저장 실패',
        errorCode: stage1Error?.code,
        errorDetails: stage1Error?.details
      }, { status: 500 });
    }

    if (!stage1Data) {
      console.error('❌ [Stage1 API] No data returned from insert');
      return NextResponse.json({
        success: false,
        error: 'Stage 1 데이터 저장 결과를 받을 수 없습니다'
      }, { status: 500 });
    }

    const responseData = {
      success: true,
      stage1Id: stage1Data.id, // sessionId로도 사용됨
      message: 'Stage 1 데이터가 성공적으로 저장되었습니다',
      data: {
        id: stage1Data.id,
        trademarkName: stage1Data.trademark_name,
        trademarkType: stage1Data.trademark_type,
        businessDescription: stage1Data.business_description,
        productServices: stage1Data.product_services || [],
        trademarkImageUrl: stage1Data.image_url, // image_url 필드 사용
        similarGroupCodes: stage1Data.similar_group_codes || [],
        selectedSimilarCode: stage1Data.selected_similar_code,
        createdAt: stage1Data.created_at
      }
    };

    // 응답 검증 (개발 시에만)
    if (process.env.NODE_ENV === 'development') {
      try {
        Stage1ResponseSchema.parse(responseData);
      } catch (validationError) {
        console.warn('⚠️ [Stage1 API] Response validation failed:', validationError);
      }
    }

    console.log('✅ [Stage1 API] Stage 1 data saved successfully:', {
      stage1Id: stage1Data.id,
      trademarkName: stage1Data.trademark_name,
      similarGroupCodesCount: (stage1Data.similar_group_codes || []).length
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ [Stage1 API] Unexpected error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Stage 1 데이터 조회 (GET 요청)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stage1Id = searchParams.get('stage1Id');
  
  if (!stage1Id) {
    return NextResponse.json({
      success: false,
      error: 'stage1Id parameter is required'
    }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();
    
    const { data: stage1Data, error } = await supabase
      .schema('trademark_analysis')
      .from('analysis_sessions')
      .select('*')
      .eq('id', stage1Id)
      .single();

    if (error || !stage1Data) {
      return NextResponse.json({
        success: false,
        error: 'Stage 1 데이터를 찾을 수 없습니다'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: stage1Data.id,
        trademarkName: stage1Data.trademark_name,
        trademarkType: stage1Data.trademark_type,
        trademarkImageUrl: stage1Data.image_url, // image_url 필드 사용
        businessDescription: stage1Data.business_description,
        productServices: stage1Data.product_services || [],
        similarGroupCodes: stage1Data.similar_group_codes || [],
        selectedSimilarCode: stage1Data.selected_similar_code,
        createdAt: stage1Data.created_at
      }
    });

  } catch (error) {
    console.error('❌ [Stage1 API] GET request error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}