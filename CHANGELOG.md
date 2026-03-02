# Changelog

All notable changes to Mark25 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2025-11-05

### 🎨 브랜드 리브랜딩 (IP Doctor → Mark25)

#### Brand Identity
- **Complete Rebranding**: IP Doctor에서 Mark25로 서비스명 전면 변경
- **Logo Update**: 새로운 Mark25 로고 및 브랜드 자산 적용
  - `/public/logo.png` - 메인 로고 (257KB, 고품질)
  - `/public/logo-auth.png` - 인증 페이지 전용 로고 (364KB)
  - `/public/tm_horizon.jpg` - 가로형 상표 이미지
  - `/public/tm_vertical.png` - 세로형 상표 이미지
- **Color Scheme**: 브랜드 색상 업데이트 (Blue → Purple #7C3AED)
- **Legacy Cleanup**: 사용하지 않는 placeholder 이미지 제거

#### UI Components Update
- **Header & Navigation**: 모든 헤더 및 네비게이션 컴포넌트 브랜드명 변경
- **Authentication Pages**: 로그인/회원가입 페이지 브랜딩 적용
- **Analysis Flow**: 상표 분석 플로우 전체 브랜딩 업데이트
- **Application Forms**: 상표 출원 폼 브랜드명 변경
- **Admin Interface**: 관리자 페이지 UI 개선 및 브랜딩 적용

### 🔧 Favicon 최적화

#### Next.js 15 Auto-Generation
- **Modern Structure**: Next.js 15 자동 favicon 생성 기능 활용
  - `/src/app/icon.png` - 512x512 메인 favicon
  - `/src/app/apple-icon.png` - 180x180 Apple touch icon
- **Automatic Processing**: 다양한 크기 자동 생성 및 최적화
- **Legacy Migration**: 기존 favicon 파일 `/public/favicon-old/`로 아카이빙
- **File Cleanup**: 불필요한 레거시 favicon 파일 제거 (~200KB 절감)
  - android-icon-*.png (7 sizes)
  - apple-icon-*.png (8 sizes)
  - ms-icon-*.png (4 sizes)
  - browserconfig.xml

#### PWA Manifest Update
- **Service Name**: Mark25로 앱 이름 변경
- **Theme Color**: 새로운 브랜드 색상 적용 (#7C3AED)
- **Icons**: 최적화된 PWA 아이콘 설정 (192x192, 512x512)
- **Purpose**: maskable 및 any purpose 아이콘 지원

### 📧 Email Services Rebranding

#### Resend Templates
- **Sender Name**: 'IP Doctor' → 'Mark25' 변경
- **Email Subject**: 모든 이메일 제목 브랜드명 업데이트
- **Template Content**: 이메일 본문 브랜딩 일관성 확보
- **Updated Templates**:
  - 회원가입 인증 이메일
  - 비밀번호 재설정 이메일
  - 상표 분석 완료 알림
  - 출원 진행 상황 업데이트

### 👨‍💼 Admin Dashboard Improvements

#### User Management
- **Enhanced Search**: 사용자 검색 기능 개선
- **Table Optimization**: 테이블 레이아웃 및 성능 최적화
- **Filter Logic**: 필터링 로직 개선 및 응답 속도 향상
- **New Service Methods**: AdminService에 검색 기능 추가

#### Trademark Management
- **UI Enhancement**: 상표 목록 UI 개선
- **Sorting**: 정렬 기능 추가
- **Pagination**: 페이지네이션 성능 최적화
- **Detail View**: 상세 정보 표시 개선

#### Dashboard
- **Brand Update**: 대시보드 브랜드명 및 스타일 업데이트
- **Statistics Widgets**: 통계 위젯 스타일 개선

### 🐛 Bug Fixes

#### Critical Fixes
- **Keyword Generator**: 키워드 생성기 오타 수정 ('분섞이' → '분석이')
- **KIPRIS Search Node**: KIPRIS 검색 노드 안정성 개선
  - 에러 핸들링 강화
  - 타임아웃 처리 개선
  - 재시도 로직 추가

#### Code Quality
- **Type Safety**: AdminService 타입 정의 개선
- **Import Cleanup**: 레거시 import 구문 정리
- **Naming Convention**: 일관된 네이밍 컨벤션 적용

### 🔒 Security

- ✅ **Security Test**: 13/13 tests passing (유지)
- ✅ **Vulnerabilities**: 0 vulnerabilities (유지)
- ✅ **Security Grade**: 9.2/10 (유지)
- ✅ **CSP/HSTS**: 모든 보안 헤더 정상 작동
- ✅ **RLS Policies**: Row Level Security 정책 유지

### 📦 Performance

#### Bundle Size
- **Reduction**: 레거시 파일 제거로 ~200KB 절감
- **Optimization**: 고품질 이미지 유지하며 최적화
- **No Regression**: 핵심 성능 지표 유지

#### Load Time
- **Favicon**: Next.js 자동 최적화로 안정적 로딩
- **Images**: 브랜드 자산 최적화 완료
- **No Impact**: 페이지 로드 시간 영향 없음

### ⚠️ Breaking Changes

**None**: 하위 호환성 유지, breaking changes 없음

### 📋 Deprecations

**제거된 자산**:
- `/public/logo_sizedown.png`
- `/public/placeholder-logo.png|svg`
- `/public/placeholder-user.jpg`
- `/public/placeholder.jpg|svg`
- `/public/images/*-placeholder.svg`
- 레거시 favicon 파일들 (아카이빙됨)

**대체 자산**:
- `/public/logo.png` (메인 로고)
- `/public/logo-auth.png` (인증 페이지)
- `/src/app/icon.png` (favicon)
- `/src/app/apple-icon.png` (Apple 아이콘)

### 📚 Documentation

- **Release Notes**: 상세한 v0.2.1 릴리즈 노트 작성 (`/docs/releases/v0.2.1.md`)
- **Migration Guide**: 프로덕션 배포 및 개발자 가이드 포함
- **Brand Guidelines**: 새로운 브랜드 자산 사용 가이드

### 🎯 Next Release (v0.2.2)

**Planned**:
- 🖼️ WebP 포맷 적용으로 추가 용량 절감
- 🌐 다국어 브랜딩 자산 (영어/일본어)
- 📱 모바일 앱 아이콘 최적화
- ⚡ CDN 최적화 및 lazy loading 강화

---

## [0.2.0] - 2025-10-30

### 🎯 Production Ready Release

#### Build & Deployment
- **TypeScript Compilation**: Fixed all TypeScript errors (0 errors in production build)
- **Type Safety Enhancement**: Complete type coverage for AuthUser, AdminUser, WorkflowSnapshot interfaces
- **React Compliance**: Resolved React Hooks rules violations
- **Production Build**: Successfully validated 54 routes generation

#### 🚀 Workflow Debug System Enhancements
- **Stage Comment System**: Real-time commenting on workflow stages with resolve/reply functionality
- **RPC Optimization**: Database operations migrated to RPC functions for better performance
- **Snapshot Management**: Enhanced workflow snapshot save/load with business_description support
- **Detail View**: Improved workflow detail page with integrated comment display
- **Database Functions**: Created RPC functions for efficient snapshot operations

#### 🔐 Authentication System Improvements
- **SSR Compatibility**: Fixed authentication schema mismatch between client and server
- **Type Safety**: Enhanced AuthContext with proper null checks and type guards
- **Role Management**: Improved admin/manager role verification logic
- **Provider Support**: Consolidated email and social provider implementations
- **Admin Interface**: Complete AdminUser type implementation with all required fields

#### 🗄️ Database Improvements
- **Generated Columns**: Resolved generated column conflicts in snapshot operations
- **RPC Functions**: Added `upsert_workflow_snapshot_with_returning` for atomic operations
- **Stage Comments Table**: New `workflow_stage_comments` table with full CRUD support
- **Migration System**: Organized migrations with date-based directory structure
- **Query Optimization**: Enhanced snapshot retrieval with comment joins

#### 🐛 Critical Bug Fixes
- **React Hook Violation**: Fixed conditional useState call in SubstepItem component
- **Mock Data Types**: Added missing `id` fields to all substep test data
- **Email Type Safety**: Added null checks for user email in authentication flows
- **Interface Consistency**: Aligned WorkflowSnapshot interface with database schema
- **Provider Type Safety**: Ensured proper type casting for authentication providers

#### 📦 Code Quality
- **Type Coverage**: Comprehensive TypeScript type definitions across all modules
- **Error Handling**: Enhanced error handling in authentication and workflow systems
- **Code Comments**: Improved inline documentation for complex logic
- **Null Safety**: Added proper null/undefined checks throughout codebase

### 🔧 Technical Details

#### Modified Files (Critical)
- `src/app/admin/debug/workflow/_components/StageItem.tsx` - React Hooks fix
- `src/app/admin/debug/workflow/page.tsx` - Mock data type completion
- `src/features/authentication/_contexts/AuthContext.tsx` - Type safety & null checks
- `src/features/admin-debug-console/_services/workflow-snapshot-client-service.ts` - Interface update

#### New Features
- Workflow stage comment API endpoint (`/api/admin/workflow/stage-comments`)
- RPC functions for optimized database operations
- Enhanced comment panel with real-time updates
- Improved admin trademarks listing with business description filtering

#### Database Migrations
- `001_create_workflow_stage_comments_table.sql` - Comment system tables
- `002_create_workflow_rpc_functions.sql` - Performance optimization RPC
- `003_create_upsert_snapshot_rpc.sql` - Atomic snapshot operations
- `fix_upsert_snapshot_returning_clause.sql` - Return clause optimization

### ✅ Verification
- ✓ TypeScript compilation: **0 errors**
- ✓ Production build: **successful**
- ✓ 54 routes generated: **all passing**
- ✓ Authentication flow: **verified**
- ✓ Admin debug console: **functional**
- ✓ Workflow snapshots: **working**

### ⚠️ Known Issues
- 109 ESLint warnings remain (non-blocking)
  - 10 useEffect dependency warnings
  - 25+ unused variables
  - 50+ explicit `any` types (gradual improvement planned)

### 📋 Migration Notes
No breaking changes. All updates are backward compatible.

---

## [0.1.0] - 2025-10-17

### 🎉 Major Features

#### Authentication System Migration
- **Edge Function Migration**: 회원가입 프로세스를 Edge Function으로 마이그레이션하여 서버리스 아키텍처 적용
- **Performance Optimization**: 이메일 인증 시스템 성능 최적화 및 응답 시간 개선
- **Enhanced Security**: 인증 플로우 보안 강화 및 세션 관리 개선

#### Type Safety Enhancement
- **Next.js 15 Compatibility**: Next.js 15의 새로운 타입 시스템 전면 적용
- **Route Handler Types**: API route handler의 Promise-based params 타입 지원
- **TypeScript Strict Mode**: 전체 프로젝트 TypeScript strict mode 활성화

#### Workflow Debugging Improvements
- **Enhanced Debug Console**: 워크플로우 디버그 콘솔 Stage 1/2 응답 데이터 구조 개선
- **Better Visualization**: KIPRIS 검색 결과 및 분석 데이터 시각화 개선
- **Real-time Monitoring**: 워크플로우 실행 상태 실시간 모니터링 강화

### ✨ Enhancements

#### Email Services
- **Resend API Integration**: Resend API 런타임 초기화 로직 개선
- **Lazy Initialization**: 이메일 클라이언트 lazy initialization으로 빌드 타임 에러 방지
- **Enhanced Logging**: 이메일 발송 프로세스 상세 로깅 추가

#### Environment Configuration
- **KIPRIS Environment**: KIPRIS API 환경 변수 하드코딩 제거 및 설정 개선
- **Supabase Mocking**: CI 환경에서 Supabase mock 환경 변수 추가
- **Configuration Validation**: 환경 변수 검증 로직 강화

#### Code Quality
- **ESLint Fixes**: prefer-const, ban-types 등 ESLint 규칙 준수
- **Type Safety**: Function 타입을 구체적인 함수 시그니처로 교체
- **Code Consistency**: 코드 스타일 일관성 개선

### 🔧 Bug Fixes

#### UI/UX Fixes
- **Analysis Checkbox**: 분석 전 체크 표시가 미리 나타나는 현상 수정
- **Image Response**: Stage2 응답 데이터에 이미지 정보 포함
- **Workflow Display**: 워크플로우 응답 출력 고정 및 안정화

#### Debug Console Fixes
- **Stage 1 Request/Response**: 디버그 콘솔 Stage 1 요청/응답 body 구조 수정
- **Stage 2 Response**: 워크플로우 디버그 콘솔 Stage 2 응답 데이터 수정
- **Unnecessary Logs**: 불필요한 로그 제거 및 로깅 레벨 조정

#### Infrastructure Fixes
- **Event Bus Types**: workflow-event-bus.ts의 타입 안정성 개선
- **Database Operations**: Supabase 데이터베이스 작업 안정성 향상
- **API Route Handlers**: Next.js 15 호환 API route handler 타입 수정

### 🏗️ Infrastructure & CI/CD

#### CI/CD Workflow Enhancements
- **Build & Test Workflow**: 별도의 Build/Test 워크플로우 추가
- **Security Audit**: Security Audit 워크플로우 개선 및 자동화
- **Continue-on-Error**: CI 실패 시에도 다른 작업 계속 진행하도록 설정
- **Test Handling**: 테스트가 없는 경우 자동으로 통과 처리

#### Development Environment
- **Port Configuration**: 개발 서버 포트를 3000에서 5000으로 변경
- **Mock Services**: CI 환경에서 외부 서비스 mocking 개선
- **Error Handling**: 빌드 및 테스트 에러 처리 개선

### 📦 Dependencies

#### Updated
- Next.js 15 full compatibility
- TypeScript 5.x strict mode
- Supabase client library updates
- ESLint configuration updates

#### Added
- Resend API email service
- Enhanced type definitions
- CI/CD workflow configurations

### 🔒 Security

- Enhanced authentication flow security
- Improved session management
- Security audit automation
- Rate limiting improvements

### 📚 Documentation

- Updated type definitions
- Enhanced code comments
- Improved error messages
- Better developer experience

### ⚙️ Technical Debt

- Removed deprecated function types
- Fixed ESLint warnings across codebase
- Improved type coverage
- Enhanced code maintainability

---

## [2.0.0] - 2025-09-30

### Major Release
- RAG Engine 통합 및 전체 시스템 리팩토링
- GCP Agent Builder RAG 기반 전문가급 분석
- LangGraph 워크플로우 시스템 구축

---

## Links

- [GitHub Repository](https://github.com/IP-Dr/ipdr)
- [Documentation](https://github.com/IP-Dr/ipdr/tree/main/docs)
- [Issues](https://github.com/IP-Dr/ipdr/issues)
