/**
 * LangGraph 기반 상표 분석 워크플로우
 * 
 * 이 모듈은 상표 분석의 전체 워크플로우를 정의하고 관리합니다.
 * 상태 중심 설계로 예측 가능하고 안정적인 실행을 보장합니다.
 */

import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { 
  TrademarkAnalysisState, 
  PartialTrademarkAnalysisState,
  WorkflowConfig,
  AnalysisResults 
} from './types/state';
import { 
  createInitialState,
  validateState,
  cleanupState,
  getStateSummary 
} from './types/state-utils';
// 🚀 OPTIMIZED: Import essential nodes for trademark analysis
import {
  goodsClassifierNode,
  kiprisSearchNode,  // Required for real data analysis
  // askUserNode, // 🚨 DISABLED: askUser node removed
  trademarkFinalAnalysisNode
  // reportSynthesizerNode, // 🚨 DISABLED: node removed
  // databaseSaverNode // 🚨 DISABLED: node removed
} from './nodes';

/**
 * UUID v4 생성 함수
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 워크플로우 로깅 유틸리티
 */
class WorkflowLogger {
  private sessionId: string;
  private startTime: number;
  private stepCount: number = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }

  logStep(nodeName: string, state: any, message?: string) {
    this.stepCount++;
    const elapsed = Date.now() - this.startTime;
    const timestamp = new Date().toISOString();
    
    console.log(`🔄 [WORKFLOW-${this.sessionId.slice(0, 8)}] Step ${this.stepCount}: ${nodeName} (${elapsed}ms)`);
    if (message) {
      console.log(`   📝 ${message}`);
    }
    console.log(`   📊 State: ${state.currentStep} | Progress: ${state.analysisProgress || 0}%`);
    
    // 상태 요약 로깅
    if (state.kiprisResults?.length > 0) {
      console.log(`   🔍 KIPRIS Results: ${state.kiprisResults.length} items`);
    }
    if (state.legalAnalysis) {
      console.log(`   ⚖️ Legal Analysis: ${state.legalAnalysis.riskLevel || 'N/A'}`);
    }
    if (state.comprehensiveAnalysis) {
      console.log(`   🤖 AI Analysis: ${state.comprehensiveAnalysis.summary ? 'Completed' : 'Pending'}`);
    }
  }

  logError(nodeName: string, error: any) {
    const elapsed = Date.now() - this.startTime;
    console.error(`❌ [WORKFLOW-${this.sessionId.slice(0, 8)}] Error in ${nodeName} (${elapsed}ms):`, error);
  }

  logCompletion(state: any) {
    const elapsed = Date.now() - this.startTime;
    console.log(`✅ [WORKFLOW-${this.sessionId.slice(0, 8)}] Workflow completed in ${elapsed}ms`);
    console.log(`   📈 Final Progress: ${state.analysisProgress || 0}%`);
    console.log(`   🎯 Final Step: ${state.currentStep}`);
  }
}

/**
 * 기본 워크플로우 설정
 */
/**
 * 🚀 OPTIMIZED: Default workflow configuration
 * parallelAnalysis is kept for backward compatibility but functionality is now integrated into comprehensiveAnalysis
 */
const DEFAULT_CONFIG: WorkflowConfig = {
  maxRetries: 3,
  timeoutMs: 180000, // 3분
  enableFallback: true,
  parallelAnalysis: true, // 🚀 OPTIMIZED: Now integrated into comprehensiveAnalysis node
  expertAnalysisEnabled: true
};

/**
 * 워크플로우 라우팅 조건 함수들
 */
function shouldAskUser(state: TrademarkAnalysisState): string {
  const logger = new WorkflowLogger(state.sessionId);
  
  // 🚨 DISABLED: askUser node bypassed - proceed to kiprisSearch
  logger.logStep('ROUTING', state, 'askUser bypassed → kiprisSearch');
  return 'kiprisSearch';
}

function shouldProceedToAnalysis(state: TrademarkAnalysisState): string {
  const logger = new WorkflowLogger(state.sessionId);
  
  // 🚨 DISABLED: askUser node removed - proceed to trademarkFinalAnalysis
  logger.logStep('ROUTING', state, 'Proceeding to trademarkFinalAnalysis');
  return 'trademarkFinalAnalysis';
}

// 🚀 OPTIMIZED: Removed unused routing functions:
// - shouldStartParallelAnalysis (parallel analysis integrated into comprehensiveAnalysis)
// - shouldContinueToComprehensiveAnalysis (removed complex conditional routing)
// - shouldProceedToSynthesis (direct connection to reportSynthesizer)
// - shouldHandleCriticalIssues (critical issue handling integrated into askUser)

// 🚀 OPTIMIZED: parallelAnalysisNode removed - functionality integrated into comprehensiveAnalysisNode

// 🚀 OPTIMIZED: Removed parallel analysis utility functions:
// - mergeChannelResults (integrated into comprehensiveAnalysisNode)
// - extractChannelResult (integrated into comprehensiveAnalysisNode)
// - removeDuplicateMessages (integrated into comprehensiveAnalysisNode)
// - calculateAnalysisProgress (simplified progress calculation)

// 🚀 OPTIMIZED: Removed remaining parallel analysis utility functions:
// - generateParallelAnalysisCompletionMessage (integrated message generation)
// - detectCriticalIssuesFromResults (critical issue detection integrated into nodes)

/**
 * 상표 분석 워크플로우 생성
 */
export function createTrademarkAnalysisWorkflow(config: Partial<WorkflowConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  console.log('🔧 [LangGraph] Creating OPTIMIZED trademark analysis workflow with config:', finalConfig);
  console.log('🔧 [LangGraph] Using trademark-final-analysis node with 3-criteria evaluation');

  // StateGraph 생성 - Annotation 기반 방식 사용
  const WorkflowStateAnnotation = Annotation.Root({
    sessionId: Annotation<string>({
      reducer: (x: string, y?: string) => y || x,
      default: () => ''
    }),
    userId: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    createdAt: Annotation<string>({
      reducer: (x: string, y?: string) => y || x,
      default: () => new Date().toISOString()
    }),
    lastActivity: Annotation<string>({
      reducer: (x: string, y?: string) => y || x,
      default: () => new Date().toISOString()
    }),
    initialInput: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => ({})
    }),
    conversationHistory: Annotation<any[]>({
      reducer: (x: any[], y?: any[]) => {
        if (!y) return x || [];
        return [...(x || []), ...(Array.isArray(y) ? y : [y])];
      },
      default: () => []
    }),
    informationChecklist: Annotation<any>({
      reducer: (x: any, y?: any) => ({ ...x, ...y }),
      default: () => ({ productCategory: false, targetMarket: false, competitorInfo: false })
    }),
    currentStep: Annotation<string>({
      reducer: (x: string, y?: string) => y || x,
      default: () => 'INITIAL'
    }),
    progress: Annotation<number>({
      reducer: (x: number, y?: number) => y !== undefined ? y : x,
      default: () => 0
    }),
    analysisResults: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => undefined
    }),
    finalReport: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => undefined
    }),
    errors: Annotation<any[]>({
      reducer: (x: any[], y?: any[]) => {
        if (!y) return x || [];
        return [...(x || []), ...(Array.isArray(y) ? y : [y])];
      },
      default: () => []
    }),
    currentQuestionType: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    currentSubStep: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    comprehensiveAnalysisResult: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => undefined
    }),
    classificationExpertResult: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => undefined
    }),
    rejectionPrediction: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => undefined
    }),
    // 🚨 OPTIMIZED: Keep only essential confirmation fields
    pendingConfirmations: Annotation<string[]>({
      reducer: (x: string[], y?: string[]) => {
        if (!y) return x || [];
        return [...(x || []), ...y];
      },
      default: () => []
    }),
    userConfirmations: Annotation<any[]>({
      reducer: (x: any[], y?: any[]) => {
        if (!y) return x || [];
        return [...(x || []), ...(Array.isArray(y) ? y : [y])];
      },
      default: () => []
    }),
    dbSaveStatus: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    dbRecordId: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    workflowShouldStop: Annotation<boolean | undefined>({
      reducer: (x?: boolean, y?: boolean) => y !== undefined ? y : x,
      default: () => undefined
    }),
    analysisStartTime: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    analysisEndTime: Annotation<string | undefined>({
      reducer: (x?: string, y?: string) => y || x,
      default: () => undefined
    }),
    totalExecutionTime: Annotation<number | undefined>({
      reducer: (x?: number, y?: number) => y !== undefined ? y : x,
      default: () => undefined
    }),
    retryCount: Annotation<number | undefined>({
      reducer: (x?: number, y?: number) => y !== undefined ? y : x,
      default: () => undefined
    }),
    fallbackMode: Annotation<boolean | undefined>({
      reducer: (x?: boolean, y?: boolean) => y !== undefined ? y : x,
      default: () => undefined
    }),
    // 🔥 NEW: goodsClassification field for goods-classifier node output
    goodsClassification: Annotation<any>({
      reducer: (x: any, y?: any) => y || x,
      default: () => undefined
    })
  });
  
  const workflow = new StateGraph(WorkflowStateAnnotation);
  
  // 🚀 OPTIMIZED: Add essential nodes for trademark analysis
  console.log('🔧 [LangGraph] OPTIMIZED: Adding essential nodes');
  workflow.addNode('goodsClassifier', goodsClassifierNode);
  // workflow.addNode('askUser', askUserNode); // 🚨 DISABLED: askUser node removed
  
  // Add KIPRIS search node (required for real data analysis)
  workflow.addNode('kiprisSearch', kiprisSearchNode);
  console.log('   ✅ Added KIPRIS search node for real data analysis');
  
  // Add trademark final analysis node (3-criteria evaluation)
  workflow.addNode('trademarkFinalAnalysis', trademarkFinalAnalysisNode);
  console.log('   ✅ Added trademark-final-analysis node (3-criteria scoring)');
  
  // workflow.addNode('reportSynthesizer', reportSynthesizerNode); // 🚨 DISABLED: node removed
  // workflow.addNode('databaseSaver', databaseSaverNode); // 🚨 DISABLED: node removed
  
  // 워크플로우 진입점 설정
  (workflow as any).setEntryPoint('goodsClassifier');
  
  // 🚀 OPTIMIZED: Fixed workflow: goodsClassifier -> kiprisSearch -> trademarkFinalAnalysis -> END
  console.log('🔧 [WORKFLOW-BUILDER] Setting up optimized workflow connections...');
  console.log('   📍 Using trademark-final-analysis with KIPRIS search (3 nodes)');
  
  // 1. 상품 분류 -> KIPRIS 검색
  (workflow as any).addEdge('goodsClassifier', 'kiprisSearch');
  console.log('   ✅ goodsClassifier → kiprisSearch');
  
  // 2. KIPRIS 검색 -> 최종 분석 (3-criteria evaluation)
  (workflow as any).addEdge('kiprisSearch', 'trademarkFinalAnalysis');
  console.log('   ✅ kiprisSearch → trademarkFinalAnalysis');
  
  // 3. 최종 분석 -> 종료
  (workflow as any).addEdge('trademarkFinalAnalysis', END);
  console.log('   ✅ trademarkFinalAnalysis → END');
  
  console.log('📊 [WORKFLOW-BUILDER] Node count: 3 (optimized with real data)');
  
  console.log('🚀 [WORKFLOW-BUILDER] Workflow connections established successfully');
  
  // 워크플로우 컴파일 - 기본 옵션으로 컴파일
  console.log('🔧 [WORKFLOW-BUILDER] Compiling optimized workflow...');
  const compiledWorkflow = workflow.compile();
  console.log('✅ [WORKFLOW-BUILDER] Optimized workflow compiled successfully');
  
  return compiledWorkflow;
}

// Default workflow export
export const defaultWorkflow = createTrademarkAnalysisWorkflow();

/**
 * 워크플로우 실행 래퍼 클래스
 */
export class TrademarkAnalysisWorkflowRunner {
  private workflow: any;
  private config: WorkflowConfig;
  private currentState: TrademarkAnalysisState | null = null;
  
  constructor(config: Partial<WorkflowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.workflow = createTrademarkAnalysisWorkflow(this.config);
  }
  
  async analyze(input: any): Promise<TrademarkAnalysisState> {
    const sessionId = input.sessionId || generateUUID();
    const startTime = Date.now();
    
    console.log(`🔍 [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Analysis started for "${input.trademarkName}"`);
    
    try {
      // 🚨 CRITICAL FIX: initialInput을 올바른 구조로 전달
      const initialInputData = {
        type: input.type || 'text',
        trademarkName: input.trademarkName || '',
        businessDescription: input.businessDescription || '',
        imageUrl: input.imageUrl,
        imageFile: input.imageFile,
        productClassificationCodes: input.productClassificationCodes,
        similarGroupCodes: input.similarGroupCodes,
        designatedProducts: input.designatedProducts,
      };
      
      console.log(`📝 [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Processed initialInputData:`, {
        trademarkName: initialInputData.trademarkName,
        businessDescription: initialInputData.businessDescription?.substring(0, 50) + '...',
        type: initialInputData.type,
      });
      
      // 초기 상태 생성
      const initialState = createInitialState({
        sessionId,
        userId: input.userId,
        initialInput: initialInputData
      });
      
      console.log(`🚀 [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Invoking workflow...`);
      console.log(`   📊 Initial state: ${initialState.currentStep}, progress: ${initialState.progress}%`);
      
      // 워크플로우 실행
      const result = await this.workflow.invoke(initialState);
      
      console.log(`   📊 Final state: ${result.currentStep}, progress: ${result.progress}%`);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Analysis completed successfully in ${executionTime}ms`);
      this.currentState = result; // 현재 상태 저장
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Analysis failed after ${executionTime}ms:`, error);
      throw error;
    }
  }
  
  async startNewAnalysis(sessionId: string, initialInput: any, userId?: string): Promise<TrademarkAnalysisState> {
    // 🚨 UUID 검증 및 생성 - 🔥 CRITICAL FIX: initialInput 구조 수정
    const validSessionId = sessionId || generateUUID();
    
    console.log('🚨 [CRITICAL FIX] startNewAnalysis called with:', {
      sessionId: validSessionId,
      initialInput,
      trademarkName: initialInput?.trademarkName,
      userId
    });
    
    return this.analyze({ 
      sessionId: validSessionId,
      userId,
      // 🚨 CRITICAL FIX: initialInput을 proper 구조로 전달  
      trademarkName: initialInput?.trademarkName,
      businessDescription: initialInput?.businessDescription,
      imageUrl: initialInput?.imageUrl,
      imageFile: initialInput?.imageFile,
      productClassificationCodes: initialInput?.productClassificationCodes,
      similarGroupCodes: initialInput?.similarGroupCodes,
      designatedProducts: initialInput?.designatedProducts,
      type: initialInput?.type || 'text',
      // 🔧 Stage1 ID 추가 - DB 저장에 필요
      stage1Id: initialInput?.stage1Id
    });
  }
  
  async resumeAnalysis(currentState: TrademarkAnalysisState, userInput: any): Promise<TrademarkAnalysisState> {
    const sessionId = currentState.sessionId;
    const startTime = Date.now();
    
    console.log(`🔄 [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Resume analysis started`);
    console.log(`   📝 User input:`, { type: userInput?.type, content: userInput?.content?.substring(0, 50) + '...' });
    console.log(`   📊 Current state: ${currentState.currentStep}, progress: ${currentState.progress}%`);
    
    try {
      let updatedState = { ...currentState };

      // 🚨 DISABLED: response-processor removed - using simple state merge
      console.log(`   ⚠️ [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Using simplified state merge (response-processor removed)`);
      // 기존 로직: 단순 병합
      updatedState = {
        ...currentState,
        ...userInput,
        lastActivity: new Date().toISOString(),
        conversationHistory: [
          ...currentState.conversationHistory,
          ...(userInput?.conversationHistory || [])
        ]
      };
      
      console.log(`   🚀 [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Invoking workflow with updated state...`);
      // 워크플로우 재실행
      const result = await this.workflow.invoke(updatedState);
      
      const executionTime = Date.now() - startTime;
      console.log(`   ✅ [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Resume completed in ${executionTime}ms`);
      console.log(`   📊 Final state: ${result.currentStep}, progress: ${result.progress}%`);
      
      this.currentState = result; // 현재 상태 저장
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [WORKFLOW-RUNNER-${sessionId.slice(0, 8)}] Resume failed after ${executionTime}ms:`, error);
      throw error;
    }
  }
  
  async getWorkflowState(sessionId: string): Promise<TrademarkAnalysisState | null> {
    // 실제 구현에서는 Redis나 데이터베이스에서 상태를 조회
    // 현재는 임시 구현
    return null;
  }
  
  async saveWorkflowState(state: TrademarkAnalysisState): Promise<void> {
    // 실제 구현에서는 Redis나 데이터베이스에 상태를 저장
    console.log('💾 [WorkflowRunner] Saving workflow state:', state.sessionId);
  }
  
  getCurrentState(): TrademarkAnalysisState | null {
    return this.currentState;
  }
}

// 호환성을 위한 함수
export function createWorkflowRunner(config: Partial<WorkflowConfig> = {}) {
  return new TrademarkAnalysisWorkflowRunner(config);
}
