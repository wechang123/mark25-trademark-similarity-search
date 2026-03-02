# LangGraph 기반 상표 분석 시스템 고도화 프로젝트

**작성자**: 20년차 시니어 개발자  
**대상**: Claude Code AI  
**프로젝트 목적**: 기존 상표 분석 워크플로우를 LangGraph.js 기반 상태 중심 아키텍처로 전환하여 안정성과 예측 가능성 극대화

---

## 🎯 프로젝트 개요

현재 운영 중인 상표 분석 시스템(`/app/trademark-analysis`)의 핵심 문제점을 해결하고, PRD v1.1 및 TRD v1.1 요구사항을 100% 만족하는 고도화된 시스템을 구축하는 것이 목표입니다.

> **⚠️ [매우 중요] 개발 범위 제한 경고 ⚠️**``
>
> **본 문서는 기존 UI에서 "상표 분석" 기능과 관련된 부분만을 수정하고 개선하기 위한 것입니다. `layout.tsx`, `Header`, `Footer` 등 공통 UI 컴포넌트나 다른 페이지의 기능은 절대로 수정해서는 안 됩니다. 오직 상표 분석 워크플로우와 관련된 API 및 프론트엔드 로직만 수정해주세요.**

**🎯 최종 목표**: 사용자가 상표명과 사업 설명을 입력하면, **LangGraph 기반 상태 머신**이 전문가처럼 대화하고, 모든 분석 과정을 안정적으로 오케스트레이션하여 완전한 분석 결과를 제공합니다.

### 핵심 문제 진단
1. **상태 관리 불안정성**: 현재 시스템은 상태가 분산되어 있어 대화 중단 시 복구가 어려움
2. **워크플로우 예측 불가능성**: AI 에이전트의 동작이 일관되지 않아 사용자 경험 저하
3. **확장성 한계**: 새로운 분석 도구나 단계 추가 시 복잡성 급증

### 해결 방안: LangGraph 도입
- **상태 중심 설계**: 모든 워크플로우 상태를 중앙 집중식으로 관리
- **예측 가능한 흐름**: 명시적 노드와 엣지를 통한 확정적 실행 경로
- **강력한 복구 메커니즘**: 언제든 중단된 지점부터 재개 가능

---

## 📋 핵심 요구사항 (PRD/TRD 기반)

### 1. 사용자 경험 요구사항
- **대화형 정보 수집**: 각 질문의 목적을 명시하며 체계적 정보 수집
- **전문가급 분석**: 3채널 분석(KIPRIS + 인터넷 + 법률 RAG) 통합
- **실시간 상태 피드백**: 분석 진행 상황의 투명한 공유
- **중단/재개 지원**: 언제든 안전한 중단 및 정확한 지점에서 재개

### 2. 기술적 요구사항
- **성능**: 전체 분석 시간 3분 이내, API 응답 500ms 이하
- **정확도**: AI 분석과 실제 심사 결과 일치율 90% 달성
- **안정성**: 네트워크 오류, API 장애 상황에서도 우아한 처리
- **보안**: 기존 9.2/10 보안 등급 유지

---

## 🏗️ 구현 계획

### Phase 1: 상태 설계 및 노드 구현

#### 1.1 중앙 상태(State) 정의
```typescript
// /lib/langgraph/state.ts
export interface TrademarkAnalysisState {
  // 세션 관리
  sessionId: string;
  userId: string;
  createdAt: string;
  
  // 분석 대상 정보
  initialInput: {
    type: 'text' | 'image' | 'combined';
    trademarkName?: string;
    imageUrl?: string;
    businessDescription?: string;
  };
  
  // 대화 진행 상태
  conversationHistory: LangChainMessage[];
  informationChecklist: {
    productCategory: boolean;
    targetMarket: boolean;
    competitorInfo: boolean;
    designStory?: boolean; // optional for higher accuracy
  };
  
  // 분석 결과
  analysisResults?: {
    kipris: KiprisSearchResult;
    internet: InternetReputationResult;
    legal: LegalReviewResult;
  };
  
  // 중요 이슈 처리
  criticalIssues?: CriticalIssue[];
  userConfirmations?: UserConfirmation[];
  
  // 최종 산출물
  finalReport?: StructuredAnalysisReport;
  dbSaveStatus?: 'pending' | 'success' | 'error';
  
  // 메타 정보
  currentStep: 'INITIAL' | 'COLLECTING' | 'CONFIRMING' | 'ANALYZING' | 'COMPLETE' | 'ERROR';
  lastActivity: string;
}
```

#### 1.2 핵심 노드 구현

**A. 정보 수집 노드** (`/lib/langgraph/nodes/information-collector.ts`)
```typescript
/**
 * 사용자에게 필요한 정보를 체계적으로 수집하는 노드
 * - 체크리스트 기반으로 누락된 정보 식별
 * - 각 질문의 목적을 명확히 설명
 * - 사용자 친화적 언어로 질문 생성
 */
export async function informationCollectorNode(
  state: TrademarkAnalysisState
): Promise<Partial<TrademarkAnalysisState>> {
  // 1. 현재 정보 완성도 평가
  const missingInfo = analyzeMissingInformation(state.informationChecklist);
  
  if (missingInfo.length === 0) {
    // 정보 수집 완료 - 분석 단계로 진행
    return {
      currentStep: 'ANALYZING',
      conversationHistory: [...state.conversationHistory, {
        role: 'assistant',
        content: generateAnalysisStartMessage(state)
      }]
    };
  }
  
  // 2. 다음 질문 생성 (목적 포함)
  const nextQuestion = generateNextQuestion(missingInfo[0]);
  
  return {
    currentStep: 'COLLECTING',
    conversationHistory: [...state.conversationHistory, {
      role: 'assistant',
      content: nextQuestion.fullMessage, // 목적 + 질문
      metadata: { questionType: nextQuestion.type, purpose: nextQuestion.purpose }
    }]
  };
}
```

**B. 3채널 분석 노드** (`/lib/langgraph/nodes/analysis-engine.ts`)
```typescript
/**
 * KIPRIS, 인터넷 검색, 법률 RAG를 병렬로 실행하는 핵심 분석 엔진
 * - 기존 분석 도구들의 로직을 재활용
 * - 실패 시 fallback 메커니즘 포함
 * - 진행 상황 실시간 업데이트
 */
export async function analysisEngineNode(
  state: TrademarkAnalysisState
): Promise<Partial<TrademarkAnalysisState>> {
  
  try {
    // 병렬 분석 실행 (기존 도구 재활용)
    const analysisPromises = [
      executeKiprisSearch(state.initialInput, state.conversationHistory),
      executeInternetSearch(state.initialInput),
      executeLegalReview(state.initialInput, state.conversationHistory)
    ];
    
    const [kiprisResult, internetResult, legalResult] = await Promise.allSettled(analysisPromises);
    
    // 2. 중요 이슈 감지
    const criticalIssues = detectCriticalIssues({
      kipris: kiprisResult,
      internet: internetResult,
      legal: legalResult
    });
    
    if (criticalIssues.length > 0) {
      return {
        currentStep: 'CONFIRMING',
        criticalIssues,
        conversationHistory: [...state.conversationHistory, {
          role: 'assistant',
          content: generateCriticalIssueMessage(criticalIssues[0])
        }]
      };
    }
    
    // 3. 정상 분석 완료
    return {
      analysisResults: {
        kipris: extractSuccessResult(kiprisResult),
        internet: extractSuccessResult(internetResult),
        legal: extractSuccessResult(legalResult)
      },
      currentStep: 'ANALYZING' // 다음 노드로 계속 진행
    };
    
  } catch (error) {
    return {
      currentStep: 'ERROR',
      conversationHistory: [...state.conversationHistory, {
        role: 'assistant',
        content: generateErrorRecoveryMessage(error)
      }]
    };
  }
}
```

**C. 보고서 종합 노드** (`/lib/langgraph/nodes/report-synthesizer.ts`)
```typescript
/**
 * 3채널 분석 결과를 전문가급 최종 보고서로 종합
 * - Gemini 2.5 Pro를 활용한 고품질 종합 분석
 * - 구조화된 JSON 형식으로 출력 (RPA 연동 최적화)
 * - 사용자 확인 사항 반영
 */
export async function reportSynthesizerNode(
  state: TrademarkAnalysisState
): Promise<Partial<TrademarkAnalysisState>> {
  
  // 1. 종합 분석 실행
  const synthesisPrompt = buildSynthesisPrompt({
    analysisResults: state.analysisResults,
    userConfirmations: state.userConfirmations,
    initialInput: state.initialInput
  });
  
  const finalReport = await generateFinalReport(synthesisPrompt);
  
  // 2. 보고서 품질 검증
  const validationResult = validateReportQuality(finalReport);
  if (!validationResult.isValid) {
    // 품질 기준 미달 시 재생성
    return await retryReportGeneration(state, validationResult.issues);
  }
  
  return {
    finalReport,
    currentStep: 'COMPLETE',
    conversationHistory: [...state.conversationHistory, {
      role: 'assistant',
      content: generateReportCompletionMessage(finalReport)
    }]
  };
}
```

### Phase 2: LangGraph 워크플로우 구성

#### 2.1 그래프 정의 (`/lib/langgraph/trademark-workflow.ts`)
```typescript
import { StateGraph, END } from "@langchain/langgraph";
import { TrademarkAnalysisState } from "./state";

// 1. 워크플로우 그래프 생성
export function createTrademarkAnalysisWorkflow() {
  const workflow = new StateGraph<TrademarkAnalysisState>({
    channels: {
      sessionId: { default: () => generateSessionId() },
      currentStep: { default: () => 'INITIAL' },
      conversationHistory: { default: () => [] },
      informationChecklist: { default: () => ({
        productCategory: false,
        targetMarket: false,
        competitorInfo: false
      })},
      // ... 기타 상태 필드들
    }
  });

  // 2. 노드 등록
  workflow.addNode("collect_info", informationCollectorNode);
  workflow.addNode("analyze", analysisEngineNode);
  workflow.addNode("handle_issues", criticalIssueHandlerNode);
  workflow.addNode("synthesize", reportSynthesizerNode);
  workflow.addNode("save_db", databaseSaverNode);

  // 3. 조건부 라우팅 함수
  const routeBasedOnStep = (state: TrademarkAnalysisState) => {
    switch (state.currentStep) {
      case 'INITIAL':
      case 'COLLECTING':
        return 'collect_info';
      case 'ANALYZING':
        return 'analyze';
      case 'CONFIRMING':
        return 'handle_issues';
      case 'COMPLETE':
        return 'save_db';
      default:
        return END;
    }
  };

  // 4. 흐름 연결
  workflow.setEntryPoint("collect_info");
  
  workflow.addConditionalEdges(
    "collect_info",
    (state) => state.currentStep === 'ANALYZING' ? 'analyze' : 'collect_info'
  );
  
  workflow.addConditionalEdges(
    "analyze", 
    (state) => state.currentStep === 'CONFIRMING' ? 'handle_issues' : 'synthesize'
  );
  
  workflow.addEdge("handle_issues", "analyze"); // 이슈 해결 후 분석 재개
  workflow.addEdge("synthesize", "save_db");
  workflow.addEdge("save_db", END);

  return workflow.compile();
}
```

### Phase 3: API 통합 (`/app/api/analysis/chat/route.ts`)

#### 3.1 LangGraph 실행 API 구현
```typescript
import { createTrademarkAnalysisWorkflow } from "@/lib/langgraph/trademark-workflow";
import { TrademarkAnalysisState } from "@/lib/langgraph/state";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, input, history } = await request.json();
    
    // 1. 보안 검증 (기존 보안 표준 유지)
    const validationResult = await validateRequest(request);
    if (!validationResult.isValid) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    
    // 2. 상태 로드 또는 초기화
    const currentState = sessionId 
      ? await loadStateFromDatabase(sessionId)
      : await initializeNewSession(input);
    
    // 3. 사용자 입력으로 상태 업데이트
    const updatedState = updateStateWithUserInput(currentState, input, history);
    
    // 4. LangGraph 실행
    const workflow = createTrademarkAnalysisWorkflow();
    const finalState = await workflow.invoke(updatedState);
    
    // 5. 상태 영속화
    await saveStateToDatabase(finalState);
    
    // 6. 사용자 응답 생성
    const response = buildUserResponse(finalState);
    
    return NextResponse.json(response);
    
  } catch (error) {
    // 7. 에러 처리 및 복구
    return handleErrorGracefully(error);
  }
}
```

---

## 🛡️ 보안 및 품질 기준

### 보안 요구사항 (현재 9.2/10 등급 유지)
- **입력 검증**: 모든 사용자 입력에 대해 Zod 스키마 검증 적용
- **레이트 리미팅**: Upstash Redis 기반 요청 제한 유지
- **데이터 보호**: 상표 이미지 및 분석 결과의 사용자별 접근 제어
- **API 보안**: 기존 보안 헤더 및 인증 체계 완전 유지

### 성능 기준
- **API 응답**: 평균 500ms 이하 (AI 분석 제외)
- **전체 분석**: 최대 3분 이내 완료
- **상태 저장**: 실시간 상태 업데이트로 중단 위험 최소화

### 품질 기준
- **분석 정확도**: 실제 심사 결과와 90% 일치율 달성
- **사용자 경험**: 질문 목적 명시로 이해도 향상
- **안정성**: 외부 API 장애 상황에서도 우아한 처리

---

## 📝 구현 우선순위

### 1단계 (필수): 핵심 인프라
- [ ] 상태 설계 및 타입 정의
- [ ] 기본 노드 구현 (정보 수집, 분석, 종합)
- [ ] LangGraph 워크플로우 구성
- [ ] API 통합 및 테스트

### 2단계 (중요): 고급 기능
- [ ] 중요 이슈 처리 노드 구현
- [ ] 상태 영속화 및 복구 메커니즘
- [ ] 에러 처리 및 fallback 로직
- [ ] 성능 최적화

### 3단계 (개선): 사용자 경험
- [ ] 실시간 진행 상황 피드백
- [ ] 분석 결과 품질 향상
- [ ] 사용자 확인 프로세스 정교화

---

## ⚠️ 중요 제약사항

1. **기존 UI 보존**: `layout.tsx`, `Header`, `Footer` 등 공통 컴포넌트는 절대 수정 금지
2. **보안 등급 유지**: 현재 9.2/10 보안 등급 절대 하락 불허
3. **하위 호환성**: 기존 분석 결과 형식과의 완전 호환성 보장
4. **데이터 무결성**: 진행 중인 분석 세션의 안전한 마이그레이션

---

## 🎯 성공 기준

### 기술적 성공 지표
- [ ] 모든 분석 단계에서 상태 기반 중단/재개 가능
- [ ] 외부 API 장애 시에도 시스템 안정성 유지
- [ ] 기존 대비 50% 향상된 워크플로우 예측 가능성

### 비즈니스 성공 지표
- [ ] 분석 완료율 95% 이상 달성
- [ ] 사용자 만족도 조사에서 "분석 과정의 명확성" 4.5/5.0 이상
- [ ] 출원 신청 전환율 30% 달성

이 프로젝트는 단순한 기술적 개선이 아닌, 사용자에게 전문 변리사와 대화하는 듯한 경험을 제공하는 혁신적 플랫폼으로의 진화를 목표로 합니다. LangGraph의 강력한 상태 관리 능력을 활용하여 예측 가능하고 안정적인 AI 상표 분석 서비스를 구축해주시기 바랍니다.