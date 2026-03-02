# GCP Agent Builder 설정 가이드

10년차 변리사 수준의 전문 상표 분석을 위한 GCP Agent Builder 설정 방법입니다.

## 1. GCP 프로젝트 설정

### 1.1 GCP 프로젝트 생성
```bash
# GCP CLI 설치 후
gcloud auth login
gcloud projects create your-trademark-analyzer-project
gcloud config set project your-trademark-analyzer-project
```

### 1.2 필요한 API 활성화
```bash
# Discovery Engine API 활성화
gcloud services enable discoveryengine.googleapis.com

# Cloud Resource Manager API 활성화
gcloud services enable cloudresourcemanager.googleapis.com

# Vertex AI API 활성화  
gcloud services enable aiplatform.googleapis.com
```

## 2. Agent Builder 앱 생성

### 2.1 Discovery Engine 콘솔 접근
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택: `your-trademark-analyzer-project`
3. Discovery Engine > Agent Builder로 이동

### 2.2 검색 앱 생성
1. **Create App** 클릭
2. **Search** 선택
3. 앱 설정:
   - **App name**: `trademark-legal-analyzer`
   - **Location**: `global` (또는 원하는 지역)
   - **Industry**: `Legal`

### 2.3 데이터 스토어 생성
1. **Create Data Store** 클릭
2. **Cloud Storage** 선택
3. 설정:
   - **Data store name**: `trademark-legal-documents`
   - **Cloud Storage path**: `gs://your-bucket/legal-docs/`

## 3. 법률 문서 준비 및 업로드

### 3.1 문서 구조화
```
legal-docs/
├── trademark-law/
│   ├── 상표법.pdf
│   ├── 상표법시행령.pdf
│   └── 상표법시행규칙.pdf
├── examination-guidelines/
│   ├── 상표심사기준.pdf
│   ├── 식별력심사기준.pdf
│   └── 유사상표심사기준.pdf
├── rejection-cases/
│   ├── 의견제출통지서_모음.pdf
│   ├── 거절이유통지서_분석.pdf
│   └── 거절사례_패턴분석.pdf
└── precedents/
    ├── 상표분쟁판례집.pdf
    ├── 심판결정문_모음.pdf
    └── 법원판례_정리.pdf
```

### 3.2 메타데이터 설정
각 문서에 다음과 같은 메타데이터를 설정:

```json
{
  "document_type": "상표법|심사기준|의견제출통지서|거절이유통지서|판례|심판결정문",
  "category": "식별력|등록요건|유사성판단|거절사유|상표분쟁|등록전략|대응방안",
  "date": "YYYY-MM-DD",
  "relevance_score": "1-10"
}
```

### 3.3 Cloud Storage 업로드
```bash
# 버킷 생성
gsutil mb gs://your-trademark-legal-docs

# 문서 업로드
gsutil -m cp -r legal-docs/ gs://your-trademark-legal-docs/
```

## 4. 서비스 계정 설정

### 4.1 서비스 계정 생성
```bash
# 서비스 계정 생성
gcloud iam service-accounts create trademark-analyzer \
    --description="Service account for trademark analysis" \
    --display-name="Trademark Analyzer"

# 필요한 권한 부여
gcloud projects add-iam-policy-binding your-trademark-analyzer-project \
    --member="serviceAccount:trademark-analyzer@your-trademark-analyzer-project.iam.gserviceaccount.com" \
    --role="roles/discoveryengine.admin"

gcloud projects add-iam-policy-binding your-trademark-analyzer-project \
    --member="serviceAccount:trademark-analyzer@your-trademark-analyzer-project.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### 4.2 서비스 계정 키 생성
```bash
# JSON 키 파일 생성
gcloud iam service-accounts keys create credentials.json \
    --iam-account=trademark-analyzer@your-trademark-analyzer-project.iam.gserviceaccount.com

# Base64 인코딩 (환경변수용)
base64 -i credentials.json -o credentials-base64.txt
```

## 5. 환경 변수 설정

### 5.1 Vercel 환경 변수
Vercel 대시보드에서 다음 환경 변수를 설정:

```bash
# GCP 프로젝트 설정
GCP_PROJECT_ID=your-trademark-analyzer-project
GCP_AGENT_BUILDER_LOCATION=global
GCP_AGENT_BUILDER_APP_ID=trademark-legal-analyzer

# 서비스 계정 인증 (Base64 인코딩된 JSON)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=eyJAc...긴Base64문자열...fQ==
```

### 5.2 로컬 개발 환경
`.env.local` 파일에 추가:

```bash
# GCP Agent Builder 설정
GCP_PROJECT_ID=your-trademark-analyzer-project
GCP_AGENT_BUILDER_LOCATION=global
GCP_AGENT_BUILDER_APP_ID=trademark-legal-analyzer
GOOGLE_APPLICATION_CREDENTIALS_BASE64=eyJAc...긴Base64문자열...fQ==

# 선택사항: 로컬 테스트용 JSON 파일 경로
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

## 6. 데이터 인덱싱 및 튜닝

### 6.1 문서 인덱싱 상태 확인
Discovery Engine 콘솔에서:
1. 생성한 앱으로 이동
2. **Data** 탭에서 인덱싱 상태 확인
3. 모든 문서가 **Indexed** 상태인지 확인

### 6.2 검색 품질 튜닝
1. **Configurations** > **Search** 설정
2. **Snippets** 활성화
3. **Extractive Answers** 활성화
4. **Boost/Bury** 규칙 설정:
   - 상표법 조항: +50% boost
   - 최신 판례: +30% boost
   - 거절사례: +40% boost

### 6.3 필터 설정
검색 정확도 향상을 위한 필터 구성:
```json
{
  "facetSpecs": [
    {
      "facetKey": {
        "key": "document_type"
      },
      "maxValues": 10
    },
    {
      "facetKey": {
        "key": "category"
      },
      "maxValues": 15
    }
  ]
}
```

## 7. 테스트 및 검증

### 7.1 기본 연결 테스트
```typescript
// 테스트 코드 실행
import { createTrademarkRAGAgent } from '@/lib/gcp/agent-builder'

const agent = createTrademarkRAGAgent()
const results = await agent.searchLegalDocuments({
  query: "상표법 제33조 등록요건",
  topK: 5
})

console.log('RAG 테스트 결과:', results)
```

### 7.2 전문 분석 테스트
API 엔드포인트 테스트:
```bash
curl -X POST http://localhost:3000/api/trademark/expert-analysis \
  -H "Content-Type: application/json" \
  -d '{"searchId": "test-search-id"}'
```

## 8. 최적화 및 모니터링

### 8.1 성능 최적화
- **캐싱 전략**: 자주 검색되는 법률 조항 캐싱
- **청크 크기 조정**: 1000-1500 토큰으로 설정
- **병렬 처리**: 여러 RAG 쿼리 동시 실행

### 8.2 비용 최적화
- **쿼리 최적화**: 불필요한 API 호출 제거
- **결과 캐싱**: Redis/Upstash로 결과 캐싱
- **사용량 모니터링**: GCP Billing 알림 설정

### 8.3 품질 모니터링
- **검색 정확도**: 관련성 점수 모니터링
- **응답 시간**: 3초 이내 목표
- **에러율**: 5% 이하 유지

## 9. 보안 고려사항

### 9.1 액세스 제어
- 서비스 계정 최소 권한 원칙
- API 키 정기 로테이션
- VPC 방화벽 규칙 설정

### 9.2 데이터 보호
- 문서 암호화 저장
- 검색 로그 마스킹
- 개인정보 포함 문서 제외

## 10. 문제 해결

### 10.1 일반적인 오류
- **403 Forbidden**: 서비스 계정 권한 확인
- **404 Not Found**: App ID 및 Location 확인
- **타임아웃**: 청크 크기 및 쿼리 복잡도 조정

### 10.2 디버깅 방법
```typescript
// 디버그 모드 활성화
console.log('GCP Config:', {
  projectId: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_AGENT_BUILDER_LOCATION,
  appId: process.env.GCP_AGENT_BUILDER_APP_ID,
  hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
})
```

## 11. 성공 기준

전문 분석 시스템이 성공적으로 구축되면:
- ✅ 상표법 조항 정확한 인용 (90% 이상)
- ✅ 거절사례 패턴 분석 (관련도 80% 이상)
- ✅ 응답 시간 3초 이내
- ✅ 전문가 수준 분석 결과 제공
- ✅ 법률 근거 기반 권장사항 제시

이 가이드를 따라 설정하면 10년차 변리사 수준의 전문적인 상표 분석 시스템을 구축할 수 있습니다.