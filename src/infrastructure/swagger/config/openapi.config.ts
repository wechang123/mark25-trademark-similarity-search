import { OpenAPISpec } from '../types/swagger.types';

/**
 * OpenAPI 3.0 기본 설정
 */
export const openApiConfig: Omit<OpenAPISpec, 'paths'> = {
  openapi: '3.0.0',
  info: {
    title: 'IPDR API Documentation',
    version: '1.0.0',
    description: `
# IPDR - 상표 검색 및 분석 플랫폼 API

IPDR 플랫폼의 모든 API 엔드포인트에 대한 상세한 명세입니다.

## 주요 기능
- 🔍 상표 검색 및 분석
- 🔐 사용자 인증 및 관리
- 📄 상표 출원 지원
- 🤖 AI 기반 분석 서비스
- 📊 경쟁사 분석

## 인증
대부분의 API는 Bearer JWT 토큰 인증이 필요합니다.
로그인 후 받은 토큰을 Header에 포함해주세요:
\`Authorization: Bearer <your-token>\`
    `,
    contact: {
      name: 'IPDR Support',
      email: 'support@ipdr.com'
    }
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
    }
  ],
  tags: [
    { 
      name: 'Authentication', 
      description: '사용자 인증 관련 API - 회원가입, 로그인, 로그아웃 등' 
    },
    { 
      name: 'Trademark Search', 
      description: '상표 검색 관련 API - KIPRIS 검색, 키워드 검색 등' 
    },
    { 
      name: 'AI Analysis', 
      description: 'AI 분석 관련 API - 거절사유 분석, 전문가 분석 등' 
    },
    { 
      name: 'Application', 
      description: '상표 출원 관련 API - 출원서 작성, 제출 등' 
    },
    { 
      name: 'Dashboard', 
      description: '대시보드 및 사용자 데이터 API' 
    },
    { 
      name: 'System', 
      description: '시스템 관련 API - 상태 확인, 설정 등' 
    },
    { 
      name: 'Testing', 
      description: 'API 테스트 및 검증 엔드포인트' 
    },
    { 
      name: 'Debug', 
      description: '개발/디버그 전용 API (개발 환경에서만 사용)' 
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer 토큰 인증. 로그인 후 받은 토큰을 사용하세요.'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key 인증 (특정 시스템 API용)'
      }
    },
    schemas: {}
  }
};

/**
 * 환경별 서버 설정 조정
 */
export const getServerConfig = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const env = process.env.NODE_ENV;
  
  const servers = [
    {
      url: baseUrl,
      description: env === 'production' ? 'Production Server' : 'Development Server'
    }
  ];

  // 스테이징 서버가 있다면 추가
  if (process.env.STAGING_URL) {
    servers.unshift({
      url: process.env.STAGING_URL,
      description: 'Staging Server'
    });
  }

  return servers;
};