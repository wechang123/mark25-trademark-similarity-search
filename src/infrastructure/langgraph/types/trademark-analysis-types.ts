// Trademark Analysis Types with Legal Article References

export interface ArticleViolation {
  clauseNumber: number;
  clauseText: string;
  description: string;
  violated: boolean;
  reason: string;
}

export interface Article34FamousnessViolation extends ArticleViolation {
  searchResults?: string;
  conflictingBrand?: string;
}

export interface ConflictingTrademark {
  name: string;
  applicationNumber: string;
  similarityType: '칭호' | '외관' | '관념' | '칭호/외관' | '칭호/관념' | '외관/관념' | '칭호/외관/관념';
  riskLevel: '높음' | '중간' | '낮음';
  similarGroupCodes?: string[];
}

export interface LegalAnalysisResult {
  registrationPossibility: number;
  
  // 지정상품 적합성
  designatedGoodsCompatibility: {
    score: number;
    summary: string;
    currentCodes: string[];
    recommendedAdditionalCodes: string[];
    analysis: string;
  };
  
  // 식별력 (제33조)
  distinctiveness: {
    score: number;
    summary: string;
    article33Violations: ArticleViolation[];
    analysis: string;
  };
  
  // 선등록 (제34조 1항 7호, 제35조 1항)
  priorTrademarkSimilarity: {
    score: number;
    summary: string;
    article34_1_7_violated: boolean;
    article35_1_violated: boolean;
    conflictingTrademarks: ConflictingTrademark[];
    analysis: string;
  };
  
  // 불등록사유 (제34조 1항 1-6호)
  nonRegistrableReasons: {
    hasViolations: boolean;
    summary: string;
    article34Violations: ArticleViolation[];
    analysis: string;
  };
  
  // 저명성 (제34조 1항 9-14호)
  famousnessCheck: {
    searchPerformed: boolean;
    summary: string;
    article34FamousnessViolations: Article34FamousnessViolation[];
    analysis: string;
  };
  
  // 최종 권고
  finalRecommendation: '등록 진행 권장' | '신중 검토 필요' | '등록 재검토 권장';
  detailedAdvice: string;
  legalRisks: string[];
  actionItems: string[];
}

// Database save format
export interface TrademarkFinalAnalysisDB {
  id: string;
  stage1_id: string;
  user_id: string;
  registration_possibility: number;
  
  // Compatibility
  designated_goods_compatibility_score: number;
  designated_goods_compatibility_reason: string;
  designated_goods: string[];
  designated_goods_summary: string;
  designated_goods_recommended: string[];
  
  // Distinctiveness
  distinctiveness_score: number;
  distinctiveness_reason: string;
  distinctiveness_summary: string;
  article_33_violations: ArticleViolation[];
  
  // Prior trademark
  prior_trademark_similarity_score: number;
  prior_trademark_similarity_reason: string;
  prior_trademark_summary: string;
  article_34_1_7_violation: boolean;
  article_35_1_violation: boolean;
  conflicting_trademarks: ConflictingTrademark[];
  
  // Non-registrable
  non_registrable_summary: string;
  article_34_1to6_violations: ArticleViolation[];
  
  // Famousness
  famousness_summary: string;
  article_34_9to14_violations: Article34FamousnessViolation[];
  internet_search_results: Record<string, any>;
  
  // Final
  final_recommendation: string;
  detailed_advice: string;
  legal_risks: string[];
  action_items: string[];
  
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}