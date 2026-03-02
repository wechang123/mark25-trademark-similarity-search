# IP-DR 인증 시스템 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 사이트 URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 인증 제공자 활성화
NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true
NEXT_PUBLIC_AUTH_KAKAO_ENABLED=false
NEXT_PUBLIC_AUTH_NAVER_ENABLED=false
```

### 2. 데이터베이스 설정

Supabase SQL Editor에서 다음 순서로 실행:

1. `scripts/auth/01-create-auth-tables.sql`
2. `scripts/auth/02-setup-rls-policies.sql`
3. `scripts/auth/03-create-auth-functions.sql`
4. `scripts/auth/04-setup-environment.sql`

### 3. 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000/signin` 접속하여 테스트

## 📋 구현된 기능

### Phase 1: 이메일 인증 ✅
- [x] 회원가입/로그인
- [x] 이메일 중복 확인
- [x] 비밀번호 강도 검증
- [x] 프로필 관리
- [x] 세션 관리 (JWT + Refresh Token)
- [x] 비밀번호 재설정

### Phase 2: 소셜 로그인 UI ✅
- [x] 카카오 로그인 UI (기능은 사업자등록 후 활성화)
- [x] 네이버 로그인 UI (기능은 사업자등록 후 활성화)
- [x] Feature Toggle 시스템

### 보안 기능 ✅
- [x] Row Level Security (RLS)
- [x] CSRF 보호
- [x] 입력값 검증 (Zod)
- [x] 인증 로그 기록

## 🔧 주요 컴포넌트

### API 엔드포인트
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/signin` - 로그인
- `POST /api/auth/signout` - 로그아웃
- `GET /api/auth/user` - 사용자 정보 조회
- `PUT /api/auth/user` - 프로필 수정
- `POST /api/auth/reset-password` - 비밀번호 재설정

### UI 컴포넌트
- `UnifiedAuthForm` - 통합 인증 폼
- `SocialButtons` - 소셜 로그인 버튼
- `/signin`, `/signup` - 인증 페이지

### Provider 시스템
- `EmailAuthProvider` - 이메일 인증
- `KakaoAuthProvider` - 카카오 로그인 (Phase 2)
- `NaverAuthProvider` - 네이버 로그인 (Phase 2)

## 🛠️ 설정 방법

### Supabase Auth 설정

1. **Supabase Dashboard > Authentication > Settings**
2. **Site URL**: `http://localhost:3000` (개발) / 실제 도메인 (프로덕션)
3. **Redirect URLs**: 
   - `http://localhost:3000/api/auth/callback`
   - `http://localhost:3000/signin`

### 소셜 로그인 설정 (Phase 2)

#### 카카오 로그인
1. [Kakao Developers](https://developers.kakao.com/) 앱 등록
2. **사업자 등록증** 필요
3. 환경변수 설정:
   ```env
   NEXT_PUBLIC_AUTH_KAKAO_ENABLED=true
   KAKAO_CLIENT_ID=your_client_id
   KAKAO_CLIENT_SECRET=your_client_secret
   ```

#### 네이버 로그인
1. [NAVER Developers](https://developers.naver.com/) 앱 등록
2. **사업자 등록증** 필요
3. 환경변수 설정:
   ```env
   NEXT_PUBLIC_AUTH_NAVER_ENABLED=true
   NAVER_CLIENT_ID=your_client_id
   NAVER_CLIENT_SECRET=your_client_secret
   ```

## 🔍 테스트

### 회원가입 테스트
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "테스트 사용자"
  }'
```

### 로그인 테스트
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

## 🚨 문제 해결

### 일반적인 오류

1. **"Supabase environment variables are missing"**
   - `.env.local` 파일의 Supabase 설정 확인

2. **"인증이 필요합니다"**
   - 세션 만료 → 다시 로그인

3. **"이메일 인증이 필요합니다"**
   - Supabase에서 이메일 확인 설정 체크

### 개발 도구

```bash
# 빌드 테스트
npm run build

# 린트 검사
npm run lint

# 타입 체크
npx tsc --noEmit
```

## 📊 성능 지표

### 목표 성능 (PRD 기준)
- 로그인 응답시간: < 2초
- 회원가입 완료시간: < 3초
- 이메일 전송시간: < 5초
- 페이지 로드시간: < 1초
- 동시 사용자: 1,000명

### 모니터링
- Supabase Dashboard에서 API 사용량 확인
- Vercel Analytics로 페이지 성능 모니터링

## 🔄 다음 단계

### Phase 2: 소셜 로그인 실제 구현
1. 사업자 등록증 발급
2. 카카오/네이버 개발자 등록
3. OAuth 플로우 구현
4. 계정 연동 기능

### Phase 3: 고급 기능
1. 구글 로그인 추가
2. 2FA (이중 인증)
3. 소셜 계정 연동 관리
4. 관리자 대시보드

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. [설정 가이드](./SETUP.md)
2. [데이터베이스 스키마](./README.md)
3. [Supabase 문서](https://supabase.com/docs)
4. [Next.js 문서](https://nextjs.org/docs)