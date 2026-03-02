# Infrastructure & Shared Layer Migration Summary

## Overview
이 문서는 IPDR MVP1 프로젝트의 인프라스트럭처 및 공유 레이어 마이그레이션 진행 상황을 요약합니다.

## Completed Tasks

### Phase 1: Infrastructure Layer Creation ✅
새로운 인프라스트럭처 레이어가 생성되었습니다:

```
infrastructure/
├── ai/              # AI 서비스 (Gemini, OpenAI, GCP)
├── auth/            # 인증 프로바이더
├── database/        # Supabase 클라이언트 & 서버
├── email/           # Resend 이메일 서비스
├── external/        # 외부 API (KIPRIS)
├── langgraph/       # LangGraph 워크플로우
└── security/        # 보안 (Rate limiting, validation)
```

#### 이동된 파일들:
- `lib/supabase/*` → `infrastructure/database/`
- `lib/auth/*` → `infrastructure/auth/` 
- `lib/security/*` → `infrastructure/security/`
- `lib/email/*` → `infrastructure/email/`
- `lib/gcp/*`, `lib/gemini/*` → `infrastructure/ai/`
- `lib/langgraph/*` → `infrastructure/langgraph/`
- `lib/kipris*.ts` → `infrastructure/external/`

### Phase 2: Shared Layer Creation ✅
공통 유틸리티 및 타입을 위한 공유 레이어가 생성되었습니다:

```
shared/
├── constants/       # 글로벌 상수 (Nice classification 등)
├── types/           # 글로벌 TypeScript 타입
├── utils/           # 순수 유틸리티 함수들
└── hooks/           # 공유 React 훅
```

#### 이동된 파일들:
- `utils/nice-classification.ts` → `shared/constants/`
- `lib/utils.ts` → `shared/utils/`
- `hooks/*` → `shared/hooks/`
- `types/*` → `shared/types/`
- `lib/mock-data.ts`, `lib/mock-api.ts`, `lib/analytics.ts` → `shared/utils/`

#### 분류 유틸리티 통합:
- 중복된 Nice 분류 로직을 `shared/constants/nice-classification.ts`에 통합
- `shared/utils/classification-utils.ts`에 공통 분류 함수들 생성
- 도메인별 분류 유틸리티는 공통 함수를 재사용하도록 업데이트

### Phase 3: Domain Dependencies Update (진행중 🔄)
도메인의 import 경로를 새로운 구조로 업데이트:

#### 완료된 업데이트:
- `domains/trademark-analysis/ai-analysis/nodes/database-saver.ts`
- `domains/authentication/components/AuthButton.tsx`  
- `domains/authentication/services/providers/email.ts`
- `domains/trademark-analysis/shared/utils/classification-utils.ts`

#### tsconfig.json 업데이트:
새로운 path alias 추가:
```json
"@/infrastructure/*": ["./infrastructure/*"],
"@/shared/*": ["./shared/*"]
```

## Current State

### 업데이트 필요한 파일들:
app/ 폴더의 여러 API 라우트와 페이지 컴포넌트들이 아직 기존 `@/lib/`, `@/utils/supabase` import를 사용하고 있습니다:

- `app/api/*/route.ts` 파일들
- `app/results/results-page-content.tsx`
- 기타 컴포넌트 파일들

### 테스트 파일 재조직 (대기중):
`__tests__/` 디렉토리는 새로운 도메인 구조를 반영하도록 재조직이 필요합니다.

## Benefits Achieved

1. **명확한 관심사 분리**: 비즈니스 로직 vs 기술적 인프라스트럭처
2. **코드 중복 제거**: 분류 유틸리티 통합으로 중복 코드 제거
3. **일관된 import 패턴**: 새로운 인프라스트럭처와 공유 레이어 사용
4. **더 나은 유지보수성**: 관련 코드들이 논리적으로 그룹화됨
5. **새 개발자 온보딩 개선**: 더 직관적인 폴더 구조

## Next Steps

1. **Phase 3 완료**: 나머지 domain과 app 파일들의 import 경로 업데이트
2. **Phase 4**: `__tests__/` 디렉토리를 새로운 구조에 맞게 재조직
3. **검증**: `npm run build` 및 테스트 실행으로 모든 변경사항 검증
4. **정리**: 사용하지 않는 기존 `lib/`, `utils/`, `hooks/`, `types/` 디렉토리 제거

## 마이그레이션 가이드

### 새로운 Import 패턴:

**Before:**
```typescript
import { createClient } from '@/lib/supabase/client'
import { niceClassificationMap } from '@/utils/nice-classification'
import { useTrademarkSearch } from '@/hooks/useTrademarkSearch'
```

**After:**
```typescript
import { createClient } from '@/infrastructure/database/client'
import { niceClassificationMap } from '@/shared/constants/nice-classification'
import { useTrademarkSearch } from '@/shared/hooks/useTrademarkSearch'
```

### 분류 유틸리티 사용:
```typescript
import { 
  getNiceClassification,
  extractIndustryFromDescription 
} from '@/shared/utils/classification-utils'
```