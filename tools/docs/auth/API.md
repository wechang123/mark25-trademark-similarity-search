# IP-DR 인증 API 문서

## 개요

IP-DR 인증 시스템의 REST API 엔드포인트 문서입니다.

## 인증 방식

- **Session-based**: Supabase Auth 쿠키
- **Token**: JWT + Refresh Token
- **Header**: `Authorization: Bearer <token>` (선택적)

## API 엔드포인트

### 1. 회원가입

**POST** `/api/auth/signup`

새 사용자 계정을 생성합니다.

#### 요청
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "marketingAgreed": true
}
```

#### 응답
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "user",
    "email_verified": false,
    "created_at": "2025-07-12T00:00:00Z"
  },
  "requiresVerification": true,
  "message": "이메일 인증이 필요합니다. 인증 메일을 확인해주세요."
}
```

#### 오류 응답
```json
{
  "success": false,
  "error": "이미 사용 중인 이메일입니다."
}
```

### 2. 로그인

**POST** `/api/auth/signin`

사용자 로그인을 처리합니다.

#### 요청
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "rememberMe": true
}
```

#### 응답
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "user",
    "email_verified": true,
    "created_at": "2025-07-12T00:00:00Z"
  },
  "message": "로그인이 완료되었습니다."
}
```

### 3. 로그아웃

**POST** `/api/auth/signout`

사용자 로그아웃을 처리합니다.

#### 요청
```json
{}
```

#### 응답
```json
{
  "success": true,
  "message": "로그아웃이 완료되었습니다."
}
```

### 4. 사용자 정보 조회

**GET** `/api/auth/user`

현재 로그인된 사용자의 정보를 조회합니다.

#### 요청
헤더: 인증 필요

#### 응답
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "avatar_url": null,
    "marketing_agreed": true,
    "role": "user",
    "email_verified": true,
    "created_at": "2025-07-12T00:00:00Z"
  }
}
```

### 5. 프로필 수정

**PUT** `/api/auth/user`

사용자 프로필 정보를 수정합니다.

#### 요청
헤더: 인증 필요

```json
{
  "name": "김길동",
  "phone": "010-5678-1234",
  "marketing_agreed": false
}
```

#### 응답
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "김길동",
    "phone": "010-5678-1234",
    "marketing_agreed": false,
    "role": "user",
    "email_verified": true,
    "created_at": "2025-07-12T00:00:00Z"
  },
  "message": "프로필이 업데이트되었습니다."
}
```

### 6. 비밀번호 재설정

**POST** `/api/auth/reset-password`

비밀번호 재설정 이메일을 발송합니다.

#### 요청
```json
{
  "email": "user@example.com"
}
```

#### 응답
```json
{
  "success": true,
  "message": "비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요."
}
```

### 7. 인증 콜백

**GET** `/api/auth/callback`

Supabase Auth 콜백을 처리합니다.

#### 요청
Query Parameters:
- `code`: 인증 코드
- `next`: 리다이렉트 URL (선택적)

#### 응답
자동 리다이렉트

## 오류 코드

| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 (입력값 오류) |
| 401 | 인증 필요 또는 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 데이터 (이메일 등) |
| 500 | 서버 내부 오류 |
| 503 | 서비스 비활성화 |

## 입력값 검증

### 이메일
- 형식: RFC 5322 표준
- 예시: `user@example.com`

### 비밀번호
- 최소 8자
- 대문자, 소문자, 숫자, 특수문자 각 1개 이상
- 예시: `Password123!`

### 이름
- 최소 1자
- 한글, 영문, 숫자 허용

### 전화번호
- 형식: `010-1234-5678` 또는 `01012345678`
- 선택적 필드

## Rate Limiting

- IP당 분당 10회 제한
- 초과 시 429 응답

## 보안 고려사항

### HTTPS 필수
프로덕션 환경에서는 반드시 HTTPS 사용

### CSRF 보호
Next.js의 기본 CSRF 보호 활성화

### SQL Injection 방지
Supabase ORM 사용으로 자동 방지

### XSS 방지
입력값 검증 및 출력 인코딩

## 예제 코드

### JavaScript (Fetch)
```javascript
// 회원가입
const signup = async (userData) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  
  return response.json()
}

// 로그인
const signin = async (credentials) => {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })
  
  return response.json()
}
```

### React Hook 예제
```javascript
import { useState } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const signin = async (credentials) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setUser(result.user)
      }
      
      return result
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, signin }
}
```

## 테스트

### cURL 예제
```bash
# 회원가입
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "테스트"
  }'

# 로그인
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### Postman Collection

API 테스트를 위한 Postman Collection을 다운로드할 수 있습니다:
- [IP-DR Auth API.postman_collection.json](./postman_collection.json)

## 변경 이력

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0 | 2025-07-12 | 초기 버전 (Phase 1) |
| 1.1 | TBD | 소셜 로그인 추가 (Phase 2) |
| 2.0 | TBD | 고급 기능 추가 (Phase 3) |