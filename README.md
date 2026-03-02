# AI 상표 이미지 유사도 검색 + 등록 가능성 분석 시스템

> 대규모 상표 이미지 데이터(303,978건)를 기반으로, 업로드한 상표와의 유사도를 검색하고 AI로 등록 가능성을 자동 평가하는 서비스입니다.

## 프로젝트 소개

이 프로젝트는 상표 출원 전 사전 검토 시간을 줄이기 위해 만든 AI 기반 검색/분석 시스템입니다.

- 입력: 사용자 상표 이미지(선택적으로 사업 설명)
- 처리: DINOv2 임베딩 기반 유사 이미지 검색 + KIPRIS 공식 데이터 결합 + Gemini Vision 분석
- 출력: 유사 상표 Top 20, 등록 가능성 점수(0~100), 위험도(높음/중간/낮음), 판단 근거

### 저장소 구성

- 메인 서비스(Next.js): `IP-Dr/mark25` (private)
- 벡터 검색 서버(Python): `IP-Dr/mark25_vectorDB` (private)

> 현재 두 저장소는 private입니다. 본 문서는 채용 포트폴리오 공개용으로 아키텍처/핵심 구현을 정리한 버전입니다.

## 아키텍처 다이어그램 (ASCII)

```text
[User]
  └─ 상표 이미지 업로드
      ▼
[Next.js Web App]
  - UI: /admin/debug/similar-image-search
  - API: /api/admin/similar-image-search/search
      ▼
[Flask Vector Server :3001]
  - POST /api/search
  - DINOv2-large -> 1024-dim embedding
  - 303,978 vectors cosine similarity (O(n) full scan)
  - Top 50 추출 -> 상표번호 중복 제거 -> Top 20 반환
      ▼
[KIPRIS OpenAPI]
  - 상표번호별 서지정보 조회
  - 출원인/출원일/등록상태/상품분류/유사군코드/썸네일
      ▼
[Next.js Image Proxy]
  - /api/admin/kipris-image-proxy
  - KIPRIS 이미지 CORS 우회
      ▼
[Gemini 2.5 Pro Vision]
  - /api/analysis/vision-registrability
  - 결과 화면 스크린샷 분석
  - registrability score + risk level + reasoning
      ▼
[Result UI]
  - 유사 상표 목록 + AI 등록 가능성 판단 카드
```

## 기술 스택 뱃지

### Web / Frontend

![Next.js](https://img.shields.io/badge/Next.js-15.5.6-000000?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)

### Backend / AI

![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-API-000000?style=for-the-badge&logo=flask)
![PyTorch](https://img.shields.io/badge/PyTorch-2.1-EE4C2C?style=for-the-badge&logo=pytorch)
![DINOv2](https://img.shields.io/badge/DINOv2-large-blue?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Gemini-2.5_Pro_Vision-4285F4?style=for-the-badge&logo=google)

### Database / Infra

![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase)
![pgvector](https://img.shields.io/badge/pgvector-HNSW-336791?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel)
![Google Cloud Run](https://img.shields.io/badge/Cloud_Run-Serverless-4285F4?style=for-the-badge&logo=googlecloud)

## 핵심 기능

### 1) 유사 상표 이미지 검색

- 사용자 이미지를 DINOv2-large로 1024차원 벡터화
- `filtered_embeddings.npy`의 303,978개 벡터와 코사인 유사도 계산
- 상위 50개를 뽑은 뒤 상표번호 기준 중복 제거
- 최종 상위 20개 결과 반환

### 2) KIPRIS(특허청) 연동

- 검색 결과의 상표번호로 KIPRIS API 병렬 조회
- 출원인, 출원일, 등록 상태, 상품분류, 유사군코드 등 서지정보 결합
- KIPRIS 이미지 URL은 Next.js 프록시를 통해 브라우저에 안전하게 전달

### 3) AI 등록 가능성 자동 분석

- 검색 완료 화면을 자동 스크린샷
- Gemini 2.5 Pro Vision이 결과를 종합 분석
- 출력 형식:
  - 등록 가능성 점수(`0~100`)
  - 위험도(`high` / `medium` / `low`)
  - 판단 근거 `3~5`개

## 실행 방법

### 1) 벡터 검색 서버 실행 (먼저)

```bash
cd ~/ipdr_mvp1
npm run vector:install

EMBEDDINGS_PATH=~/ipdr_mvp1/vectorDB/filtered_embeddings.npy \
FILENAMES_PATH=~/ipdr_mvp1/vectorDB/filtered_filenames.json \
npm run vector:dev
# -> http://localhost:3001
# 처음 실행 시 DINOv2 모델을 다운로드할 수 있어 인터넷 연결이 필요할 수 있음
```

### 2) Next.js 앱 실행

```bash
cd ~/ipdr_mvp1
npm install
npm run dev
# -> http://localhost:5001
```

### 3) 데모 페이지 접속

```text
http://localhost:5001/admin/debug/similar-image-search
```

## 필요한 환경변수

`ipdr_mvp1/.env.local` 기준:

```env
KIPRIS_SEARCH_API_KEY=<KIPRIS OpenAPI 키>
GEMINI_API_KEY=<Google AI Studio API 키>
LOCAL_VECTOR_SEARCH_URL=http://localhost:3001
```

벡터 서버 실행 시:

```env
EMBEDDINGS_PATH=~/ipdr_mvp1/vectorDB/filtered_embeddings.npy
FILENAMES_PATH=~/ipdr_mvp1/vectorDB/filtered_filenames.json
```

## 데이터 규모 및 성능

- 벡터 데이터: `303,978`개 상표 이미지 임베딩
- 벡터 차원: `1024` (DINOv2-large), 실험 옵션 `1536` (DINOv2-giant)
- 파일 크기:
  - `filtered_embeddings.npy` 약 `594MB`
  - `filtered_filenames.json` 약 `18MB`
- 연도 범위: `1973~2025` (특히 2023~2025 데이터 비중 높음)
- 현재 검색 방식: `O(n)` 전수 코사인 유사도 계산
- 현재 체감 응답: 약 `1~2분` (로컬 실행 기준)

### 개선 계획

- Supabase `pgvector + HNSW` 인덱스로 ANN 검색 전환
- 응답 시간 단축 및 대용량 처리 안정성 개선
- Cloud Run 기반 임베딩 서비스로 운영 자동화

## GitHub 레포지토리 안내

- 메인 서비스: [IP-Dr/mark25](https://github.com/IP-Dr/mark25) (private)
- 벡터 서버: [IP-Dr/mark25_vectorDB](https://github.com/IP-Dr/mark25_vectorDB) (private)
- 공개 포트폴리오 게시용(예정): [wechang123/ai-trademark-portfolio](https://github.com/wechang123/ai-trademark-portfolio)

> 채용 목적 공유 시 private 코드 접근이 필요한 경우, 데모 영상/스크린샷/코드 워크스루 문서로 대체 제공 가능합니다.
> 현재 `ipdr_mvp1` 저장소에는 `vectorDB/app.py`가 포함되어 있어, private `mark25_vectorDB` 없이도 로컬에서 유사검색 데모를 실행할 수 있습니다.

## 핵심 파일 맵

### `mark25` (Next.js)

- `src/app/admin/debug/similar-image-search/page.tsx`: 검색 UI + 결과 표시 + 자동 분석 트리거
- `src/app/api/admin/similar-image-search/search/route.ts`: Flask 검색 호출 + KIPRIS 조회 + 결과 통합
- `src/app/api/admin/kipris-image-proxy/route.ts`: KIPRIS 이미지 CORS 프록시
- `src/app/api/analysis/vision-registrability/route.ts`: Gemini Vision 분석 API
- `src/infrastructure/external/server-kipris-api.ts`: KIPRIS XML 파싱 유틸
- `vectorDB/scripts/process_new_kipris_batch.py`: 신규 KIPRIS 배치 임베딩 스크립트

### `mark25_vectorDB` (Python Flask)

- `app.py`: 벡터 검색 API 서버 (`POST /api/search`)
- `src/ml/integrated_search.py`: 임베딩/유사도 계산 통합 로직
- `src/ml/dinov2_model.py`: DINOv2-large / giant 래퍼
- `src/ml/text_extractor.py`: OCR 텍스트 추출
- `src/ml/text_remover.py`: 텍스트 제거(inpaint)
- `src/ml/shape_analyzer.py`: 도형 특징 분석
- `src/utils/deduplication.py`: 상표번호 기준 중복 제거

### `ipdr_mvp1/vectorDB` (공개 실행용)

- `vectorDB/app.py`: 공개 저장소에서 바로 실행 가능한 로컬 벡터 검색 서버
- `vectorDB/filtered_embeddings.npy`: 303,978개 임베딩 벡터 데이터
- `vectorDB/filtered_filenames.json`: 벡터-파일명 매핑 데이터

## 데모 스크린샷 (추가 예정)

```text
TODO:
- docs/images/upload-screen.png
- docs/images/search-results.png
- docs/images/ai-registrability-card.png
```

## 참고

- 본 시스템의 AI 분석 결과는 출원 의사결정을 돕는 참고 정보이며, 법률 자문을 대체하지 않습니다.
