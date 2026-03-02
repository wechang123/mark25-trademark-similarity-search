# 🗄️ IPDR 마이그레이션 시스템

현재 운영 중인 데이터베이스 구조를 기반으로 한 TypeScript 마이그레이션 시스템입니다.

> **⚡ 빠르게 시작하고 싶다면** → [`QUICK_START.md`](./QUICK_START.md) 먼저 읽어보세요!  
> **🔰 처음 보는 개발자라면** → 각 폴더의 README.md 파일을 차례대로 읽어보세요!

## 📁 구조

```
migrations/
├── supabase/           # Supabase PostgreSQL 마이그레이션
│   ├── 000_baseline_schema.ts      # 현재 DB 스키마 베이스라인
│   ├── 001_baseline_functions.ts   # 함수 및 트리거
│   ├── 002_baseline_rls_policies.ts # RLS 정책
│   └── 003_baseline_indexes.ts     # 성능 인덱스
├── upstash/            # Upstash Redis 설정
│   ├── 001_rate_limiting_setup.ts  # Rate limiting 설정
│   └── 002_session_management.ts   # 세션 관리 설정
├── utils/              # 마이그레이션 유틸리티
│   └── migration-runner.ts         # 실행 엔진
└── scripts/            # 실행 스크립트
    └── run-migrations.ts           # CLI 인터페이스
```

## 🚀 사용법

### 기본 명령어

```bash
# 모든 마이그레이션 실행
npm run migrate

# 마이그레이션 상태 확인
npm run migrate:status

# Supabase만 실행
npm run migrate:supabase

# Upstash Redis만 실행
npm run migrate:upstash

# 롤백 (배치 번호 지정)
npm run migrate:rollback 2

# 데이터베이스 리셋
npm run db:reset
```

### 개발 워크플로우

1. **새 환경 설정**
   ```bash
   npm run migrate
   ```

2. **스키마 변경 후 테스트**
   ```bash
   npm run migrate:status
   npm run migrate:supabase
   ```

3. **문제 시 롤백**
   ```bash
   npm run migrate:rollback 1
   ```

## 📊 현재 데이터베이스 상태

### Supabase Tables (11개)
- `trademark_searches` - 상표 검색 및 분석 (32 컬럼)
- `profiles` - 사용자 프로필 (auth.users 확장)
- `social_accounts` - 소셜 로그인 연동
- `auth_logs` - 인증 보안 로그
- `analysis_waitlist` - 분석 대기열
- `service_pre_bookings` - 서비스 사전 예약
- `kipris_search_results` - KIPRIS 검색 결과
- `ai_analysis_results` - AI 분석 결과
- `similar_trademarks` - 유사 상표 목록
- `product_classifications` - 상품 분류 (72K 레코드)
- `trademark_applications` - 상표 출원 신청 (35 컬럼)

### Redis Key Patterns
- `rate_limit:{endpoint}:{ip}` - API 요청 제한
- `session:{session_id}` - 사용자 세션
- `analysis:{session_id}` - 분석 세션 (LangGraph)
- `cache:{namespace}:{key}` - 다양한 캐시 데이터
- `config:{section}` - 시스템 설정

## 🔧 마이그레이션 작성 가이드

### Supabase 마이그레이션

```typescript
import type { MigrationFile } from '../utils/migration-runner'

const migration: MigrationFile = {
  id: '004_add_new_column',
  name: 'Add New Column',
  description: 'Adds new column to trademark_searches',
  timestamp: '2024-01-01T04:00:00Z',

  async run(supabase) {
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE trademark_searches ADD COLUMN new_field TEXT;`
    })
  },

  async rollback(supabase) {
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE trademark_searches DROP COLUMN new_field;`
    })
  }
}

export default migration
```

### Redis 설정 마이그레이션

```typescript
import type { MigrationFile } from '../utils/migration-runner'

const migration: MigrationFile = {
  id: '003_new_cache_config',
  name: 'New Cache Configuration',
  description: 'Adds new cache namespace configuration',
  timestamp: '2024-01-01T02:00:00Z',

  async run(redis) {
    const config = { /* new configuration */ }
    await redis.set('config:new_feature', JSON.stringify(config))
  },

  async rollback(redis) {
    await redis.del('config:new_feature')
  }
}

export default migration
```

## 🏗️ 베이스라인 마이그레이션

현재 프로덕션 데이터베이스 상태를 그대로 복제하는 베이스라인 마이그레이션이 포함되어 있습니다:

- **000_baseline_schema.ts** - 모든 테이블과 제약조건
- **001_baseline_functions.ts** - 저장 프로시저와 트리거
- **002_baseline_rls_policies.ts** - Row Level Security 정책
- **003_baseline_indexes.ts** - 성능 최적화 인덱스

## 🔐 보안 고려사항

1. **RLS 정책** - 모든 테이블에 적절한 보안 정책 적용
2. **함수 권한** - `SECURITY DEFINER`로 안전한 함수 실행
3. **인덱스 보안** - 개인정보 컬럼 인덱싱 최소화
4. **Redis 설정** - Rate limiting과 세션 보안 강화

## 📈 성능 모니터링

마이그레이션 실행 후 다음을 확인하세요:

1. **쿼리 성능** - 새 인덱스 적용 확인
2. **Redis 연결** - Rate limiting 동작 확인
3. **RLS 정책** - 보안 정책 작동 확인
4. **함수 실행** - 트리거와 저장 프로시저 테스트

## 🚨 주의사항

1. **프로덕션 실행 전** 반드시 스테이징에서 테스트
2. **백업 필수** 마이그레이션 전 데이터베이스 백업
3. **롤백 준비** 문제 시 즉시 롤백할 수 있도록 준비
4. **순서 엄수** 마이그레이션은 반드시 순서대로 실행

## 🔄 기존 `/scripts` 폴더와의 차이점

### 기존 방식 (비추천)
- SQL 파일들을 수동으로 실행
- 실행 기록 없음
- 롤백 불가능
- 환경별 차이 관리 어려움

### 새로운 방식 (권장)
- TypeScript 기반 마이그레이션
- 실행 기록 자동 추적
- 롤백 지원
- 환경별 설정 관리
- IDE 자동완성 지원

---

💡 **Tip**: 새로운 마이그레이션 시스템을 사용하고, 기존 `/scripts` 폴더는 참조용으로만 활용하세요!