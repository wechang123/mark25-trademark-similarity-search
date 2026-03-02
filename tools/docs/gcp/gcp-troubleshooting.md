# GCP Agent Builder 연결 문제 해결 가이드

## 현재 문제: Invalid JWT Signature

### 증상
```
RAG 검색 실패: invalid_grant: Invalid JWT Signature.
```

### 원인
서비스 계정의 Private Key가 손상되었거나 올바르지 않습니다.

### 해결 방법

#### 1. 새로운 서비스 계정 키 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트: `gen-lang-client-0641392721` 선택
3. **IAM 및 관리자** > **서비스 계정** 이동
4. `ipdr-vertex-ai-accessor@gen-lang-client-0641392721.iam.gserviceaccount.com` 찾기
5. **작업** > **키 관리** 클릭
6. **키 추가** > **새 키 만들기** 선택
7. **JSON** 형식 선택 후 **만들기**
8. 다운로드된 JSON 파일 내용을 확인

#### 2. 서비스 계정 권한 확인

필요한 권한:
- **Discovery Engine Admin** 역할
- **Vertex AI User** 역할 (선택사항)

권한 추가 방법:
1. **IAM 및 관리자** > **IAM** 이동
2. 서비스 계정 찾기
3. **수정** 버튼 클릭
4. **역할 추가** 클릭
5. "Discovery Engine Admin" 검색 후 추가

#### 3. 환경 변수 업데이트

새로운 JSON 키로 Base64 인코딩:
```bash
# Linux/Mac
base64 -w 0 새로운키파일.json

# 결과를 .env.local의 GOOGLE_APPLICATION_CREDENTIALS_BASE64에 설정
```

#### 4. Agent Builder App 확인

1. [Discovery Engine Console](https://console.cloud.google.com/gen-app-builder) 접속
2. 앱 ID 확인: `trademark-legal-analyzer_1734179736814`
3. 앱이 존재하고 활성화되어 있는지 확인

### 임시 우회 방법

GCP 연결이 안 되더라도 시스템은 Rule-based 분석으로 작동합니다:

1. 기본 상표 검색: `/api/search`
2. 전문가 분석 (Rule-based): `/api/trademark/expert-analysis`

### 테스트 방법

1. 환경 변수 업데이트 후 개발 서버 재시작
2. http://localhost:3000/test/gcp 접속
3. 연결 테스트 실행

### 문의 사항

GCP 설정 관련 문제가 계속되면:
1. 프로젝트 소유자 권한 확인
2. 결제 계정 활성화 상태 확인
3. Discovery Engine API 활성화 확인