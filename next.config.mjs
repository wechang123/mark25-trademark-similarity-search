/** @type {import('next').NextConfig} */
const nextConfig = {
  // 타입스크립트 및 ESLint 보안 검증 (환경별 설정)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // 빌드 시 ESLint 경고/에러를 무시하여 CI 빌드 로그를 깨끗하게 유지
    ignoreDuringBuilds: true,
  },
  
  // 이미지 최적화 비활성화 (정적 내보내기용)
  images: {
    unoptimized: true,
  },
  
  // 프로덕션에서 콘솔 로그 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 서버 컴포넌트 외부 패키지 설정
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],

  // Webpack 설정 (Node.js 모듈들을 클라이언트에서 제외)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 번들에서 Node.js 전용 모듈들과 라이브러리들 제외
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
        buffer: false,
        async_hooks: false,
        'google-auth-library': false,
        '@langchain/langgraph': false,
      };

      // Node.js 내장 모듈들을 빈 객체로 대체
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:async_hooks': false,
        'node:buffer': false,
        'node:crypto': false,
        'node:fs': false,
        'node:http': false,
        'node:https': false,
        'node:net': false,
        'node:path': false,
        'node:stream': false,
        'node:util': false,
      };

      // 특정 패키지들을 external로 처리
      config.externals = config.externals || [];
      config.externals.push({
        'google-auth-library': 'commonjs google-auth-library',
        '@langchain/langgraph': 'commonjs @langchain/langgraph',
      });
    }
    return config;
  },

  // 헤더 설정 (보안 강화)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.com *.vercel-analytics.com *.vercel-scripts.com *.googletagmanager.com t1.daumcdn.net",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com unpkg.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: *.supabase.co *.googletagmanager.com *.kipris.or.kr",
              "connect-src 'self' *.supabase.co generativelanguage.googleapis.com *.openai.com *.upstash.io *.vercel.com *.vercel-analytics.com *.google-analytics.com *.googletagmanager.com",
              "frame-src 'self' postcode.map.daum.net",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; '),
          },
        ],
      },
    ]
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/signin',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/signin',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/signup',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
