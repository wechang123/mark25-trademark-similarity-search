# ⚡ 마이그레이션 시스템 빠른 시작 가이드

> **👋 처음 오신 분들을 위한 5분 완성 가이드**

## 🎯 이 문서는 누구를 위한 것인가요?

- 🆕 **새로 팀에 합류한 개발자**
- 🔄 **기존 SQL 스크립트에서 마이그레이션으로 전환하려는 개발자**  
- ⚡ **빠르게 시작하고 싶은 모든 개발자**

## 🚀 30초만에 시작하기

### 1. 전체 마이그레이션 실행
```bash
npm run migrate
```

### 2. 현재 상태 확인
```bash
npm run migrate:status
```

**끝!** 🎉 이제 데이터베이스가 최신 상태입니다.

## 📁 폴더 구조 한 눈에 보기

```
migrations/
├── 📋 README.md                    # 전체 시스템 가이드
├── ⚡ QUICK_START.md               # 이 파일 (빠른 시작)
│
├── 🗄️ supabase/                   # PostgreSQL 데이터베이스
│   ├── 000_baseline_schema.ts     # 모든 테이블 생성
│   ├── 001_baseline_functions.ts  # 함수와 트리거
│   ├── 002_baseline_rls_policies.ts # 보안 정책
│   ├── 003_baseline_indexes.ts    # 성능 인덱스
│   └── 📖 README.md               # Supabase 상세 가이드
│
├── 🔴 upstash/                    # Redis 설정
│   ├── 001_rate_limiting_setup.ts # API 제한 설정
│   ├── 002_session_management.ts  # 세션 관리
│   └── 📖 README.md               # Redis 상세 가이드
│
├── 🛠️ utils/                      # 마이그레이션 엔진
│   ├── migration-runner.ts        # 핵심 실행 로직
│   └── 📖 README.md               # 엔진 상세 가이드
│
└── 🚀 scripts/                    # 실행 스크립트
    ├── run-migrations.ts           # CLI 인터페이스
    └── 📖 README.md               # CLI 상세 가이드
```

## 🎮 필수 명령어 치트시트

| 명령어 | 설명 | 언제 사용? |
|--------|------|----------|
| `npm run migrate` | 모든 마이그레이션 실행 | 🆕 새 환경 설정 시 |
| `npm run migrate:status` | 현재 상태 확인 | 🔍 실행 전 확인 |  
| `npm run migrate:supabase` | DB만 마이그레이션 | 🗄️ DB 변경사항만 적용 |
| `npm run migrate:upstash` | Redis만 마이그레이션 | 🔴 Redis 설정만 변경 |
| `npm run migrate:rollback 1` | 마지막 배치 롤백 | 🔄 문제 발생 시 복구 |

## 🆘 문제 발생 시 해결법

### ❌ "환경변수가 없습니다" 오류
```bash
Error: Supabase environment variables are missing
```
**해결**: `.env.local` 파일에 다음 변수들 추가
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_REST_URL=your_redis_url  
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### ❌ "tsx 명령어를 찾을 수 없습니다" 오류
```bash
Error: tsx: command not found
```
**해결**: 
```bash
npm install --save-dev tsx
```

### ❌ "마이그레이션이 실행되지 않습니다"
**해결 순서**:
1. `npm run migrate:status` 으로 현재 상태 확인
2. 네트워크 연결 확인
3. Supabase/Upstash 서비스 상태 확인  
4. 여전히 안되면 팀에 문의

## 🎓 학습 로드맵

### 🥇 Level 1: 사용자 (5분)
- [x] `npm run migrate` 실행 성공
- [x] `npm run migrate:status` 로 상태 확인
- [x] 기본 명령어 숙지

### 🥈 Level 2: 이해자 (30분)  
- [ ] `migrations/README.md` 읽기
- [ ] `migrations/supabase/README.md` 읽기
- [ ] 마이그레이션 파일 구조 이해

### 🥉 Level 3: 기여자 (2시간)
- [ ] 새 마이그레이션 파일 작성
- [ ] 롤백 함수 작성
- [ ] 테스트 실행

### 🏆 Level 4: 전문가 (1일)
- [ ] `migrations/utils/README.md` 읽기  
- [ ] 마이그레이션 엔진 코드 이해
- [ ] 커스터마이징 및 최적화

## 🔗 상황별 상세 가이드 링크

| 상황 | 읽어야 할 문서 |
|------|-------------|
| **Supabase 테이블 추가/수정** | [`migrations/supabase/README.md`](./supabase/README.md) |
| **Redis 캐시 설정 변경** | [`migrations/upstash/README.md`](./upstash/README.md) |
| **마이그레이션 시스템 커스터마이징** | [`migrations/utils/README.md`](./utils/README.md) |
| **CLI 명령어 추가/수정** | [`migrations/scripts/README.md`](./scripts/README.md) |
| **전체 시스템 이해** | [`migrations/README.md`](./README.md) |

## ✅ 체크리스트: 첫 실행 완료 확인

- [ ] `npm run migrate` 실행 성공 (에러 없음)
- [ ] `npm run migrate:status` 에서 "All migrations up to date" 확인
- [ ] Supabase 대시보드에서 11개 테이블 생성 확인
- [ ] Upstash 콘솔에서 Redis 키들 확인

## 💬 도움이 필요하다면

1. **🔍 먼저 확인**: 해당 폴더의 README.md 파일
2. **💬 팀 문의**: Slack #backend 채널  
3. **👨‍💻 페어 프로그래밍**: 시니어 개발자와 함께
4. **📖 이슈 검색**: GitHub Issues에서 유사한 문제 확인

## 🎯 핵심 철학

> **"복잡한 데이터베이스 관리를 간단한 명령어로"**

- ✅ **안전성**: 모든 변경사항은 롤백 가능
- ✅ **일관성**: 모든 환경에서 동일한 구조  
- ✅ **투명성**: 모든 변경사항이 코드로 기록
- ✅ **협업성**: 팀 전체가 동일한 도구 사용

---

**🚀 준비되셨나요? 이제 `npm run migrate`를 실행해보세요!**

더 자세한 내용이 필요하면 각 폴더의 README.md 파일을 참고하세요. 모든 것이 단계별로 친절하게 설명되어 있습니다! 📚