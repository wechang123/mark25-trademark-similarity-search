# GCP Vertex AI Search 설정 요약 (PDF 자료 통합)

이 문서는 상표법 및 특허청 심사 기준 PDF 파일을 GCP Vertex AI Search에 통합하기 위한 설정 과정을 요약합니다.

## 1. GCP 프로젝트 및 API 활성화

1.  **GCP 프로젝트 준비:** GCP에 로그인하여 기존 프로젝트를 사용하거나 새 프로젝트를 생성하고, 결제 계정이 연결되어 있는지 확인합니다.
2.  **필요한 API 활성화:** GCP 콘솔에서 다음 API를 검색하여 "사용 설정"합니다.
    *   **Vertex AI API**
    *   **Cloud Storage API**

## 2. Cloud Storage 버킷 생성 및 PDF 파일 업로드

1.  **Cloud Storage 버킷 생성:** GCP Cloud Storage 메뉴에서 새 버킷을 생성합니다. (예: `ipdr-knowledge-base`)
2.  **PDF 파일 업로드:** 생성된 버킷에 가지고 계신 **상표법, 특허청 심사 기준 PDF 파일들을 모두 업로드**합니다.

## 3. Vertex AI Search 앱 및 데이터 스토어 생성

1.  **Vertex AI Search 접속:** GCP 콘솔에서 "Vertex AI"를 검색하여 이동한 후, 좌측 메뉴에서 "Search and Conversation"을 선택합니다.
2.  **새 앱 생성:** "Apps" 메뉴에서 "새 앱"을 만들고 **"Search"** 유형을 선택합니다.
3.  **데이터 스토어 생성:** "데이터 스토어" 섹션에서 "새 데이터 스토어 만들기"를 클릭합니다.
    *   **데이터 소스 선택:** **"Cloud Storage"**를 선택합니다.
    *   **버킷 연결:** PDF 파일들을 업로드했던 Cloud Storage 버킷을 지정합니다.
    *   **데이터 종류:** **"비정형 문서 (PDF, HTML, TXT 등)"**를 선택합니다.
    *   **동기화 빈도:** **"주기적 (Periodic)"**을 선택하고, 법률 업데이트 주기를 고려하여 **가능한 가장 긴 주기** (예: 매월, 3개월마다, 6개월마다)로 설정합니다.
    *   데이터 스토어 이름을 지정하고 생성을 완료합니다. (예: `trademark-law-datastore`)
    *   **참고:** Vertex AI가 PDF 파일들을 자동으로 색인하는 데 시간이 소요될 수 있습니다.

## 4. GCP 서비스 계정 생성 및 인증 설정

Next.js 애플리케이션이 GCP 리소스에 안전하게 접근하기 위한 서비스 계정 설정입니다.

1.  **서비스 계정 생성:**
    *   GCP 콘솔에서 "IAM 및 관리자" > "서비스 계정" 메뉴로 이동합니다.
    *   "서비스 계정 만들기"를 클릭하고 이름을 지정합니다. (예: `ipdr-vertex-ai-accessor`)
    *   **역할 부여:** **"Vertex AI 사용자"** 역할을 부여하고 완료합니다.
2.  **서비스 계정 키(JSON) 생성:**
    *   생성된 서비스 계정의 "작업" 메뉴에서 "키 관리" > "키 추가" > "새 키 만들기"를 선택합니다.
    *   **JSON** 유형으로 키를 생성하여 파일을 다운로드합니다. **이 파일은 매우 중요하므로 안전하게 보관해야 합니다.**
3.  **환경 변수 설정:**
    *   다운로드한 JSON 키 파일의 내용을 **Base64로 인코딩**합니다. (예: `cat [다운로드된_키_파일.json] | base64`)
    *   인코딩된 문자열을 Next.js 프로젝트의 `.env.local` 파일에 다음 환경 변수로 추가합니다.
        ```
        GOOGLE_APPLICATION_CREDENTIALS_BASE64="[인코딩된_JSON_문자열]"
        ```
    *   또한, 다음 GCP 관련 환경 변수들도 `.env.local` 파일에 추가하고 본인의 GCP 환경에 맞게 값을 채워 넣습니다.
        ```
        GCP_PROJECT_ID="[YOUR_GCP_PROJECT_ID]"
        GCP_AGENT_BUILDER_LOCATION="global" # 또는 데이터 스토어 위치
        GCP_AGENT_BUILDER_APP_ID="[YOUR_VERTEX_AI_APP_ID]" # Vertex AI Search 앱 ID
        ```

이 과정을 통해 GCP Vertex AI Search에 상표법 및 특허청 심사 기준 PDF 파일들이 성공적으로 통합되고, Next.js 애플리케이션에서 이를 호출할 준비가 완료됩니다.
