import { NextRequest, NextResponse } from 'next/server';
import { createValidatedApiRoute } from '@/infrastructure/swagger/middleware/validation-middleware';
import { z } from 'zod';
import { openApiGenerator } from '@/infrastructure/swagger';
import { ApiStatsResponseSchema, SystemErrorSchema } from '@/infrastructure/swagger/schemas/system.schema';
import { requireManager } from '@/infrastructure/auth/middleware/role-guard';

export const GET = createValidatedApiRoute({
  path: '/api/openapi/stats',
  method: 'GET',
  summary: 'API 통계 정보 조회',
  description: '등록된 API 엔드포인트의 통계 정보를 제공합니다. 개발/디버그 목적으로 사용됩니다.',
  tags: ['System'],
  response: z.union([ApiStatsResponseSchema, SystemErrorSchema]),
  requiresAuth: false,
  errorResponses: {
    403: 'Forbidden - 접근 권한이 없습니다',
    500: 'Internal Server Error - 서버 오류'
  }
}, async (request: NextRequest) => {
  // Check for API key or manager/admin role
  if (process.env.NODE_ENV === 'production') {
    const apiKey = request.headers.get('x-api-key');
    const hasApiKey = apiKey === process.env.API_DOCS_KEY;

    // If no API key, require manager/admin authentication
    if (!hasApiKey) {
      const authError = await requireManager(true);
      if (authError) return authError;
    }
  }

  // API 통계 생성
  const stats = openApiGenerator.generateStats();
  
  // 추가 메타데이터
  const metadata = {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    description: 'IPDR API 통계 정보'
  };

  return NextResponse.json({
    success: true,
    data: {
      ...stats,
      metadata
    }
  });
});