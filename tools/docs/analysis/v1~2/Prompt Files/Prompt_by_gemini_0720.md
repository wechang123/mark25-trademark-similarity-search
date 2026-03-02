### \#\# Claude Code를 위한 개선된 프롬프트 (`Prompt_by_gemini_0720_v2.md`)

안녕하세요\! 지금부터 현재 분산된 상표 분석 시스템을 **LangGraph.js 기반 상태 중심 워크플로우**로 혁신하는 작업을 시작하겠습니다.

> **⚠️ [매우 중요] 개발 범위 제한 경고 ⚠️**``
>
> **본 문서는 기존 UI에서 "상표 분석" 기능과 관련된 부분만을 수정하고 개선하기 위한 것입니다. `layout.tsx`, `Header`, `Footer` 등 공통 UI 컴포넌트나 다른 페이지의 기능은 절대로 수정해서는 안 됩니다. 오직 상표 분석 워크플로우와 관련된 API 및 프론트엔드 로직만 수정해주세요.**

**🎯 최종 목표**: 사용자가 상표명과 사업 설명을 입력하면, **LangGraph 기반 상태 머신**이 전문가처럼 대화하고, 모든 분석 과정을 안정적으로 오케스트레이션하여 완전한 분석 결과를 제공합니다.

-----

### \#\# Phase 1: LangGraph 노드(Node) 구현 (`/lib/langgraph/nodes/`)

**목표**: 기존의 완성도 높은 기능들을 LangGraph의 '노드(Node)' 즉, 재사용 가능한 작업 단위로 변환합니다. 기존 `Tool` 클래스를 래핑하여 각 노드의 역할을 명확히 합니다.

**A. 사용자 질문 노드** (`ask-user-node.ts`)

```typescript
// 기존 AskUserTool의 로직을 사용하여, State를 기반으로 다음 질문을 생성하는 함수
import { State } from "../state"; // State 타입 정의 필요

export async function askUserNode(state: State): Promise<Partial<State>> {
  const { checklist, conversationHistory } = state;
  const nextQuestion = determineNextQuestion(checklist, conversationHistory);
  
  // PRD 요구사항: 질문의 목적을 함께 전달
  const why = getReasonForQuestion(nextQuestion);
  const fullQuestion = `${why} ${nextQuestion.question}`;
  
  return {
    conversationHistory: state.conversationHistory.concat({
      role: 'assistant',
      content: fullQuestion,
      type: 'question' // 상태 구분을 위한 타입 추가
    })
  };
}
```

**B. 3채널 분석 노드** (`run-analysis-node.ts`)

```typescript
// 기존 KiprisSearchTool, InternetReputationTool, LegalReviewTool을 병렬로 실행
import { State } from "../state";
// 각 Tool 로직 재활용

export async function runAnalysisNode(state: State): Promise<Partial<State>> {
  const { userInput, conversationHistory } = state;
  
  // 3가지 분석을 병렬로 실행하여 시간 단축
  const [kiprisResult, internetResult, legalResult] = await Promise.all([
    runKiprisSearch(userInput, conversationHistory),
    runInternetSearch(userInput),
    runLegalReview(userInput, conversationHistory)
  ]);
  
  return {
    analysisResults: {
      kipris: kiprisResult,
      internet: internetResult,
      legal: legalResult
    }
  };
}
```

**C. 보고서 종합 노드** (`synthesize-report-node.ts`)

```typescript
import { State } from "../state";

export async function synthesizeReportNode(state: State): Promise<Partial<State>> {
  const { analysisResults } = state;
  // Gemini 2.5 Pro를 호출하여 3채널 분석 결과를 최종 JSON 보고서로 종합
  const finalReport = await generateFinalReport(analysisResults);
  return { finalReport };
}
```

**D. DB 저장 노드** (`save-to-db-node.ts`)

```typescript
// 기존 SupabaseSaveTool 로직 재활용
import { State } from "../state";

export async function saveToDbNode(state: State): Promise<Partial<State>> {
  const { finalReport, sessionId } = state;
  const dbResponse = await saveReportToSupabase(sessionId, finalReport);
  return { dbSaveStatus: dbResponse.success ? 'SUCCESS' : 'ERROR' };
}
```

-----

### \#\# Phase 2: LangGraph 그래프 및 상태(State) 정의 (`/lib/langgraph/trademark-graph.ts`)

**목표**: Phase 1에서 만든 노드들을 연결하고, 전체 워크플로우를 제어할 '상태 머신' 즉, 그래프를 구축합니다.

**A. 상태(State) 객체 정의**

```typescript
// /lib/langgraph/state.ts
export type AgentState = {
  sessionId: string;
  initialInput: Record<string, any>;
  conversationHistory: any[];
  checklist: Record<string, boolean>;
  analysisResults?: {
    kipris: any;
    internet: any;
    legal: any;
  };
  finalReport?: Record<string, any>;
  dbSaveStatus?: 'SUCCESS' | 'ERROR';
};
```

**B. 그래프(Graph) 구축**

```typescript
// /lib/langgraph/trademark-graph.ts
import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
// Phase 1에서 만든 모든 노드 함수 import

// 1. 그래프와 상태 정의
const workflow = new StateGraph<AgentState>({
  channels: {
    // ... AgentState의 각 필드를 정의
  },
});

// 2. 노드 추가
workflow.addNode("askUser", askUserNode);
workflow.addNode("runAnalysis", runAnalysisNode);
workflow.addNode("synthesizeReport", synthesizeReportNode);
workflow.addNode("saveToDb", saveToDbNode);

// 3. 조건부 엣지(Edge)로 흐름 제어
const checkInfoCompleteness = (state: AgentState) => {
  const isComplete = Object.values(state.checklist).every(Boolean);
  return isComplete ? "startAnalysis" : "gatherInfo";
};

// 4. 진입점(Entry Point) 및 엣지 연결
workflow.setEntryPoint("checkInfo");
workflow.addConditionalEdges("checkInfo", checkInfoCompleteness, {
  gatherInfo: "askUser",
  startAnalysis: "runAnalysis",
});

// 5. 일반 엣지 연결
workflow.addEdge("askUser", "checkInfo"); // 질문 후 다시 정보 체크로 루프
workflow.addEdge("runAnalysis", "synthesizeReport");
workflow.addEdge("synthesizeReport", "saveToDb");
workflow.addEdge("saveToDb", END); // 그래프 종료

// 6. 그래프 컴파일
export const app = workflow.compile();
```

-----

### \#\# Phase 3: LangGraph 실행 API 구현 (`/app/api/analysis/chat/route.ts`)

**목표**: 기존 API를 수정하여, LangChain 에이전트를 직접 호출하는 대신 LangGraph의 상태를 업데이트하고 실행하는 역할을 하도록 변경합니다.

```typescript
import { app } from "@/lib/langgraph/trademark-graph"; // 컴파일된 그래프 import
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, input, history } = body;

  // 1. Supabase에서 sessionId를 기반으로 이전 상태(State)를 불러옴
  const currentState = await loadStateFromDb(sessionId);

  // 2. 현재 입력으로 상태 업데이트
  const updatedState = updateStateWithNewInput(currentState, input, history);

  // 3. LangGraph 실행
  // app.stream() 또는 app.invoke()를 사용하여 그래프를 실행하고 최종 상태를 받음
  const finalState = await app.invoke(updatedState);

  // 4. 최종 상태를 기반으로 사용자에게 보낼 응답 생성
  const response = createResponseFromState(finalState);
  
  // 5. 최종 상태를 다시 DB에 저장하여 대화가 이어지도록 함
  await saveStateToDb(sessionId, finalState);

  return NextResponse.json(response);
}
```

**🎯 최종 목표**: PRD/TRD v1.1 요구사항을 100% 충족하는 **안정적이고 예측 가능한 LangGraph 기반** 대화형 AI 상표 분석 시스템 구현. 기존 시스템의 전문가급 분석 품질을 유지하면서, **'전문가와 대화하는 듯한' 사용자 경험**을 제공.