/**
 * LangGraph 노드들의 인덱스 파일 - OPTIMIZED
 * 
 * 🚀 워크플로우 최적화로 3개 핵심 노드만 유지 (comprehensive-analysis 제거)
 */

// 🚀 OPTIMIZED: Essential nodes only (3 nodes)
import { trademarkFinalAnalysisNode } from './trademark-final-analysis';
import { goodsClassifierNode } from './goods-classifier';
import { kiprisSearchNode } from './kipris-search';

// Re-export - Essential nodes only
export {
  trademarkFinalAnalysisNode,
  goodsClassifierNode,
  kiprisSearchNode
};

// 노드 함수 타입 정의
export type NodeFunction = (
  state: import('../types/state').TrademarkAnalysisState
) => Promise<import('../types/state').PartialTrademarkAnalysisState>;

// 🚀 OPTIMIZED: Simplified node map (3 essential nodes)
export const NODE_FUNCTIONS = {
  // 상품 분류 (entry point)
  goodsClassifier: goodsClassifierNode,
  
  // 최종 분석 (3-criteria evaluation with real KIPRIS data)
  trademarkFinalAnalysis: trademarkFinalAnalysisNode,
  
  // KIPRIS 검색
  kiprisSearch: kiprisSearchNode
} as const;

// 노드 이름 타입
export type NodeName = keyof typeof NODE_FUNCTIONS;