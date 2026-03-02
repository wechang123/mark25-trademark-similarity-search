'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Swagger UI CSS 임포트
import 'swagger-ui-react/swagger-ui.css';

// Swagger UI를 dynamic import로 로드 (SSR 방지 + React 19 호환성 개선)
const SwaggerUI = dynamic(
  () => import('swagger-ui-react').then(mod => {
    // React 19 호환성을 위한 래퍼 컴포넌트
    const SwaggerUIWrapper = (props: any) => {
      // StrictMode 경고 억제를 위한 error boundary
      useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
          if (
            args[0]?.includes?.('UNSAFE_componentWillReceiveProps') ||
            args[0]?.includes?.('OperationContainer')
          ) {
            return; // React 19 호환성 경고 무시
          }
          originalError.apply(console, args);
        };

        return () => {
          console.error = originalError;
        };
      }, []);

      return mod.default(props);
    };
    
    return { default: SwaggerUIWrapper };
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>API 문서를 불러오는 중...</span>
        </div>
      </div>
    )
  }
);

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOpenApiSpec = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/openapi.json', {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store' // 항상 최신 API 스펙 가져오기
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSpec(data);
    } catch (err) {
      console.error('Failed to fetch OpenAPI spec:', err);
      setError(
        err instanceof Error 
          ? `API 명세를 불러오는데 실패했습니다: ${err.message}`
          : 'API 명세를 불러오는데 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenApiSpec();
  }, [fetchOpenApiSpec]);

  const handleRetry = useCallback(() => {
    fetchOpenApiSpec();
  }, [fetchOpenApiSpec]);

  // Swagger UI 설정을 메모이제이션
  const swaggerConfig = useMemo(() => ({
    spec,
    tryItOutEnabled: process.env.NODE_ENV === 'development',
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    docExpansion: 'list' as const,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    showExtensions: true,
    showCommonExtensions: true,
    // React 19 호환성을 위한 추가 설정
    deepLinking: true,
    displayOperationId: false,
    requestInterceptor: (request: any) => {
      // 요청 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('Swagger UI Request:', request);
      }
      return request;
    }
  }), [spec]);

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              문서 로드 실패
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                다시 시도
              </button>
              <a
                href="/api/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-blue-500 hover:text-blue-700 text-sm"
              >
                OpenAPI JSON 직접 확인
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading || !spec) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">API 문서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 성공 상태 - Swagger UI 렌더링
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white py-4 px-6 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">IPDR API Documentation</h1>
          <p className="text-blue-100 mt-1">상표 검색 및 분석 플랫폼 API 명세</p>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="swagger-ui-wrapper">
        <SwaggerUI {...swaggerConfig} />
      </div>

      {/* 커스텀 스타일 */}
      <style jsx global>{`
        .swagger-ui-wrapper .swagger-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .swagger-ui-wrapper .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui-wrapper .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui-wrapper .swagger-ui .info .title {
          font-size: 2rem;
          color: #2563eb;
        }
        
        .swagger-ui-wrapper .swagger-ui .scheme-container {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .swagger-ui-wrapper .swagger-ui .opblock.opblock-post {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .swagger-ui-wrapper .swagger-ui .opblock.opblock-get {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .swagger-ui-wrapper .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }

        .swagger-ui-wrapper .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        
        /* 다크모드에서 잘 보이도록 조정 */
        @media (prefers-color-scheme: dark) {
          .swagger-ui-wrapper .swagger-ui {
            filter: invert(1) hue-rotate(180deg);
          }
          
          .swagger-ui-wrapper .swagger-ui img {
            filter: invert(1) hue-rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}

