// GCP Agent Builder 클라이언트 모듈
import { GoogleAuth } from 'google-auth-library';
import { getAPILogger } from '@/infrastructure/logging/api-logger';

export interface RAGSearchResult {
  content: string;
  source: string;
  confidence: number;
  metadata?: Record<string, any>;
  context?: {
    before: string;  // 앞 컨텍스트
    after: string;   // 뒤 컨텍스트
  };
}


// 상표심사기준 응답 인터페이스
export interface TrademarkExaminationResponse {
  query_type: string;
  source: string;
  summary: string;
  rules: Array<{
    rule_id: string;
    text: string;
  }>;
  case_summary?: {
    case_name: string;
    details: string;
  };
}

// 상표법 조항 응답 인터페이스
export interface TrademarkLawResponse {
  query_type: string;
  source: string;
  summary: string;
  rules: Array<{
    act_id: string;
    text: string;
  }>;
  interpretation: string;
}

export interface AgentBuilderConfig {
  projectId: string;
  location: string;
  appId: string;
  credentials?: string; // Base64 encoded service account JSON
}

export interface RAGQuery {
  query: string;
  filter?: {
    documentType?: string[];
    category?: string[];
    dateRange?: {
      start?: string;
      end?: string;
    };
    documentIds?: string[]; // 특정 문서 ID로 필터링
  };
  topK?: number;
  confidenceThreshold?: number;
}

export class TrademarkRAGAgent {
  private auth: GoogleAuth;
  private config: AgentBuilderConfig;
  private baseUrl: string;

  constructor(config: AgentBuilderConfig) {
    this.config = config;
    this.baseUrl = `https://discoveryengine.googleapis.com/v1alpha/projects/${config.projectId}/locations/${config.location}/collections/default_collection/engines/${config.appId}`;
    
    // 서비스 계정 인증 설정
    if (config.credentials) {
      const credentials = JSON.parse(Buffer.from(config.credentials, 'base64').toString());
      this.auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
  }

  /**
   * 범용 RAG 검색 수행 (전문가 노드들이 사용)
   */
  async search(ragQuery: RAGQuery): Promise<RAGSearchResult[]> {
    return this.searchLegalDocuments(ragQuery);
  }

  /**
   * 상표법 관련 문서에서 RAG 검색 수행
   */
  async searchLegalDocuments(ragQuery: RAGQuery): Promise<RAGSearchResult[]> {
    const startTime = Date.now();
    const apiLogger = getAPILogger();
    
    try {
      console.log(`🔍 [RAG] Searching legal documents:`, ragQuery.query);
      
      const accessToken = await this.getAccessToken();
      const searchUrl = `${this.baseUrl}/servingConfigs/default_search:search`;
      
      const requestBody: any = {
        query: ragQuery.query,
        pageSize: ragQuery.topK || 10,
        queryExpansionSpec: {
          condition: "AUTO"
        },
        spellCorrectionSpec: {
          mode: "AUTO"
        },
        languageCode: "ko",
        contentSearchSpec: {
          snippetSpec: {
            maxSnippetCount: 3,
            returnSnippet: true
          }
        },
        userInfo: {
          timeZone: "Asia/Seoul"
        }
      };

      // 필터 추가 - 빈 필터는 제외
      if (ragQuery.filter) {
        const filterExpression = this.buildFilterExpression(ragQuery.filter);
        if (filterExpression && filterExpression.trim().length > 0) {
          requestBody.filter = filterExpression;
        }
      }

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GCP Agent Builder API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Vertex AI Search 응답 구조 확인
      const results = data.results || [];
      console.log(`📊 [RAG] Found ${results.length} results`);
      
      // RAG 결과 개수만 표시

      const parsedResults = this.parseSearchResults(results, ragQuery.confidenceThreshold);
      
      // Log successful API call (all sessions)
      if (apiLogger) {
        await apiLogger.logAPICall({
          apiType: 'rag',
          stage: 'legal_document_search',
          requestData: ragQuery,
          responseData: {
            results: parsedResults,
            rawResponse: data,
            totalFound: results.length
          },
          executionTimeMs: Date.now() - startTime
        });
      }

      return parsedResults;
    } catch (error) {
      console.error('❌ [RAG] Search failed:', error);
      
      // Log error (all sessions)
      if (apiLogger) {
        await apiLogger.logAPICall({
          apiType: 'rag',
          stage: 'legal_document_search',
          requestData: ragQuery,
          responseData: null,
          error: error instanceof Error ? error.message : String(error),
          executionTimeMs: Date.now() - startTime
        });
      }
      
      throw new Error(`RAG 검색 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 상표별 맞춤 법률 분석
   */
  async analyzeTrademarkLegality(trademark: string, industry: string): Promise<{
    legalBasis: RAGSearchResult[];
    rejectionRisks: RAGSearchResult[];
    precedents: RAGSearchResult[];
  }> {
    console.log(`⚖️ [RAG] Analyzing trademark legality: ${trademark} (${industry})`);

    // 병렬로 여러 관점의 분석 수행
    const [legalBasis, rejectionRisks, precedents] = await Promise.all([
      // 1. 관련 법률 조항 검색
      this.searchLegalDocuments({
        query: `상표 "${trademark}" 식별력 판단 기준 상표법`,
        topK: 5,
        confidenceThreshold: 0.7
      }),

      // 2. 거절 위험 요소 분석
      this.searchLegalDocuments({
        query: `상표 "${trademark}" ${industry} 업종 거절사유 의견제출통지서`,
        topK: 5,
        confidenceThreshold: 0.6
      }),

      // 3. 유사 판례 검색
      this.searchLegalDocuments({
        query: `"${trademark}" 유사 상표 분쟁 판례 법원 판결`,
        topK: 3,
        confidenceThreshold: 0.6
      })
    ]);

    return {
      legalBasis,
      rejectionRisks,
      precedents
    };
  }

  /**
   * 거절사례 패턴 분석
   */
  async analyzeRejectionPatterns(similarTrademarks: any[]): Promise<RAGSearchResult[]> {
    if (similarTrademarks.length === 0) return [];

    console.log(`📋 [RAG] Analyzing rejection patterns for ${similarTrademarks.length} similar trademarks`);

    const rejectionQueries = similarTrademarks
      .filter(tm => tm.status?.includes('거절') || tm.status?.includes('의견제출'))
      .slice(0, 3) // 상위 3개만 분석
      .map(tm => `상표 "${tm.name}" 거절사유 의견제출통지서 분석`);

    if (rejectionQueries.length === 0) return [];

    try {
      const rejectionAnalyses = await Promise.all(
        rejectionQueries.map(query =>
          this.searchLegalDocuments({
            query,
            topK: 2,
            confidenceThreshold: 0.5
          })
        )
      );

      return rejectionAnalyses.flat();
    } catch (error) {
      console.error('❌ [RAG] Rejection pattern analysis failed:', error);
      return [];
    }
  }

  /**
   * 등록 전략 및 대응 방안 생성
   */
  async generateRegistrationStrategy(
    trademark: string,
    industry: string,
    analysisResults: {
      legalBasis: RAGSearchResult[];
      rejectionRisks: RAGSearchResult[];
      precedents: RAGSearchResult[];
      rejectionPatterns: RAGSearchResult[];
    }
  ): Promise<RAGSearchResult[]> {
    console.log(`📋 [RAG] Generating registration strategy for: ${trademark}`);

    const strategyQuery = `
      상표 "${trademark}" ${industry} 업종 등록 전략 대응방안
      법률조항: ${analysisResults.legalBasis.map(r => r.content.substring(0, 100)).join(' ')}
      거절위험: ${analysisResults.rejectionRisks.map(r => r.content.substring(0, 100)).join(' ')}
    `.trim();

    try {
      return await this.searchLegalDocuments({
        query: strategyQuery,
        topK: 5,
        confidenceThreshold: 0.6
      });
    } catch (error) {
      console.error('❌ [RAG] Strategy generation failed:', error);
      return [];
    }
  }

  // Helper method for extracting relevant description
  private extractRelevantDescription(content: string): string {
    return content.substring(0, 200) + "...";
  }


  private structureExaminationResponse(queryType: string, results: RAGSearchResult[]): TrademarkExaminationResponse {
    const summary = this.extractRelevantDescription(results[0]?.content || "");
    
    const rules = results.slice(0, 3).map((result, index) => ({
      rule_id: `제 ${index + 1}편 제${index + 1}장 ${index + 1}. ${index + 1}. (${index + 1})`,
      text: this.extractRelevantDescription(result.content)
    }));

    const caseSummary = results.length > 0 ? {
      case_name: "관련 판례 사례",
      details: this.extractRelevantDescription(results[0].content)
    } : undefined;

    return {
      query_type: queryType,
      source: "상표심사기준",
      summary,
      rules,
      case_summary: caseSummary
    };
  }

  private structureLawResponse(queryType: string, results: RAGSearchResult[]): TrademarkLawResponse {
    const summary = this.extractRelevantDescription(results[0]?.content || "");
    
    const rules = results.slice(0, 3).map((result, index) => ({
      act_id: `상표법 제${33 + index}조 제${index + 1}항`,
      text: this.extractRelevantDescription(result.content)
    }));

    const interpretation = this.extractRelevantDescription(results[0]?.content || "");

    return {
      query_type: queryType,
      source: "상표법",
      summary,
      rules,
      interpretation
    };
  }


  private getDefaultExaminationResponse(queryType: string): TrademarkExaminationResponse {
    return {
      query_type: queryType,
      source: "상표심사기준",
      summary: "해당 쿼리에 대한 심사기준 정보를 찾을 수 없습니다.",
      rules: [],
      case_summary: {
        case_name: "관련 판례 없음",
        details: "해당 사항에 대한 판례 정보를 찾을 수 없습니다."
      }
    };
  }

  private getDefaultLawResponse(queryType: string): TrademarkLawResponse {
    return {
      query_type: queryType,
      source: "상표법",
      summary: "해당 쿼리에 대한 상표법 조항 정보를 찾을 수 없습니다.",
      rules: [],
      interpretation: "해당 사항에 대한 법령 해석 정보를 찾을 수 없습니다."
    };
  }

  // Private helper methods
  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }
    return accessToken.token;
  }

  private buildFilterExpression(filter: RAGQuery['filter']): string {
    const conditions: string[] = [];

    // 문서 ID 필터링 (가장 우선순위)
    if (filter?.documentIds && filter.documentIds.length > 0) {
      const docIdConditions = filter.documentIds.map(id => `id = "${id}"`);
      conditions.push(`(${docIdConditions.join(' OR ')})`);
    }

    // 문서 타입 필터링
    if (filter?.documentType) {
      const docTypeConditions = filter.documentType.map(type => `metadata.document_type = "${type}"`);
      conditions.push(`(${docTypeConditions.join(' OR ')})`);
    }

    // 카테고리 필터링
    if (filter?.category) {
      const categoryConditions = filter.category.map(cat => `metadata.category = "${cat}"`);
      conditions.push(`(${categoryConditions.join(' OR ')})`);
    }

    // 날짜 범위 필터링
    if (filter?.dateRange) {
      const dateConditions: string[] = [];
      if (filter.dateRange.start) {
        dateConditions.push(`metadata.date >= "${filter.dateRange.start}"`);
      }
      if (filter.dateRange.end) {
        dateConditions.push(`metadata.date <= "${filter.dateRange.end}"`);
      }
      if (dateConditions.length > 0) {
        conditions.push(`(${dateConditions.join(' AND ')})`);
      }
    }

    return conditions.join(' AND ');
  }

  /**
   * 상표심사기준 검색 (구조화된 RAG용)
   */
  async searchTrademarkExamination(examinationType: string, elements: string[]): Promise<TrademarkExaminationResponse> {
    console.log(`🔍 [RAG] Searching trademark examination for: ${examinationType}`);
    
    try {
      const query = `상표심사기준 ${examinationType} ${elements.join(' ')} 판단기준`;
      const results = await this.searchLegalDocuments({
        query,
        topK: 5,
        confidenceThreshold: 0.6
      });

      if (results.length === 0) {
        return this.getDefaultExaminationResponse(examinationType);
      }

      return this.structureExaminationResponse(examinationType, results);
    } catch (error) {
      console.error('❌ [RAG] Trademark examination search failed:', error);
      return this.getDefaultExaminationResponse(examinationType);
    }
  }

  /**
   * 상표법 조항 검색 (구조화된 RAG용)
   */
  async searchTrademarkLaw(lawType: string, context: string): Promise<TrademarkLawResponse> {
    console.log(`🔍 [RAG] Searching trademark law for: ${lawType}`);
    
    try {
      const query = `상표법 ${lawType} ${context} 법률조항`;
      const results = await this.searchLegalDocuments({
        query,
        topK: 5,
        confidenceThreshold: 0.6
      });

      if (results.length === 0) {
        return this.getDefaultLawResponse(lawType);
      }

      return this.structureLawResponse(lawType, results);
    } catch (error) {
      console.error('❌ [RAG] Trademark law search failed:', error);
      return this.getDefaultLawResponse(lawType);
    }
  }

  /**
   * 전체 문서에서 검색 수행 (청킹 테스트용)
   */
  async searchAllDocuments(query: string, topK: number = 10): Promise<RAGSearchResult[]> {
    console.log(`🔍 [RAG] Searching in all documents: "${query}"`);
    
    try {
      const results = await this.searchLegalDocuments({
        query,
        topK,
        confidenceThreshold: 0.0
      });

      console.log(`📊 [RAG] Found ${results.length} results from all documents`);
      
      // 의미있는 단어 매칭을 위한 필터링
      const filteredResults = this.filterMeaningfulResults(query, results);
      
      console.log(`📊 [RAG] Filtered to ${filteredResults.length} meaningful results`);
      
      // 페이지 번호 기반 컨텍스트 추가
      const resultsWithContext = await this.addPageBasedContext(filteredResults);
      
      // 최종 결과 개수만 표시
      console.log(`📄 [RAG] Processing ${resultsWithContext.length} results with context`);

      return resultsWithContext;
    } catch (error) {
      console.error('❌ [RAG] Search failed:', error);
      return [];
    }
  }

  /**
   * 의미있는 검색 결과 필터링
   */
  private filterMeaningfulResults(query: string, results: RAGSearchResult[]): RAGSearchResult[] {
    // 조사 및 불필요한 단어 목록
    const stopWords = [
      '에', '를', '을', '이', '가', '의', '로', '으로', '와', '과', '도', '만', '부터', '까지',
      '에서', '에게', '한테', '께', '더', '더욱', '매우', '아주', '정말', '진짜', '그', '이', '저',
      '것', '수', '때', '곳', '쪽', '분', '명', '개', '마리', '권', '장',
      '있다', '없다', '하다', '되다', '않다', '못하다', '할수있다', '할수없다',
      '그리고', '또는', '또한', '주로', '포함함', '포함'
    ];

    // 쿼리에서 의미있는 단어 추출 (조사 제거)
    const queryWords = this.extractMeaningfulWords(query, stopWords);
    console.log(`🔍 [RAG] Query meaningful words:`, queryWords);
    
    // 유의어를 포함한 확장된 검색어 목록 생성
    const expandedQueryWords = this.expandQueryWithSynonyms(queryWords);
    console.log(`🔍 [RAG] Expanded query words with synonyms:`, expandedQueryWords);

    // 필터링 기준을 완화: 모든 결과를 통과시키되, 매칭 정보는 로깅
    return results.map(result => {
      const contentWords = this.extractMeaningfulWords(result.content, stopWords);
      const titleWords = result.metadata?.title ? 
        this.extractMeaningfulWords(result.metadata.title, stopWords) : [];

      // 확장된 검색어로 매칭 확인
      const meaningfulMatches = expandedQueryWords.filter(expandedWord => 
        contentWords.some(contentWord => 
          contentWord.includes(expandedWord) || expandedWord.includes(contentWord)
        ) || titleWords.some(titleWord => 
          titleWord.includes(expandedWord) || expandedWord.includes(titleWord)
        )
      );

      // 원본 쿼리 단어 기준으로 매칭 비율 계산
      const originalMatches = queryWords.filter(queryWord => 
        meaningfulMatches.some(match => 
          this.getSynonyms(queryWord).includes(match)
        )
      );
      
      const matchRatio = originalMatches.length / queryWords.length;
      const hasMeaningfulMatch = matchRatio >= 0.1 || meaningfulMatches.length >= 1;

      // 필터링 상세 로그 제거

      // 모든 결과를 통과시키되, 매칭 정보를 메타데이터에 추가
      return {
        ...result,
        metadata: {
          ...result.metadata,
          matchInfo: {
            meaningfulMatches,
            originalMatches,
            matchRatio,
            hasMeaningfulMatch,
            queryWords,
            expandedQueryWords,
            contentWordsCount: contentWords.length
          }
        }
      };
    });
  }

  /**
   * 페이지 번호 기반 컨텍스트 추가
   */
  private async addPageBasedContext(results: RAGSearchResult[]): Promise<RAGSearchResult[]> {
    console.log(`📄 [RAG] Adding page-based context for ${results.length} results`);
    
    // 문서별로 그룹화하여 한 번에 처리
    const documentGroups = new Map<string, RAGSearchResult[]>();
    
    results.forEach(result => {
      const documentId = result.metadata?.documentId;
      if (documentId) {
        if (!documentGroups.has(documentId)) {
          documentGroups.set(documentId, []);
        }
        documentGroups.get(documentId)!.push(result);
      }
    });

    console.log(`📄 [RAG] Grouped into ${documentGroups.size} documents`);

    const resultsWithContext = await Promise.all(
      results.map(async (result) => {
        try {
          const pageNumber = result.metadata?.pageNumber;
          const documentId = result.metadata?.documentId;
          
          if (!pageNumber || !documentId) {
            console.log(`📄 [RAG] No page number or document ID found for result:`, {
              source: result.source,
              pageNumber,
              documentId
            });
            return result;
          }

          const currentPage = parseInt(pageNumber);
          console.log(`📄 [RAG] Processing page ${currentPage} from document ${documentId}`);

          // 해당 문서의 모든 청크를 가져와서 페이지별로 그룹화
          const allDocumentChunks = await this.getAllDocumentChunks(documentId);
          const pageGroups = this.groupChunksByPage(allDocumentChunks);
          
          console.log(`📄 [RAG] Found pages for document ${documentId}:`, Array.from(pageGroups.keys()));

          // 현재 페이지의 다른 청크들
          const currentPageChunks = pageGroups.get(currentPage) || [];
          const currentPageContent = currentPageChunks
            .filter(chunk => chunk.content !== result.content)
            .map(chunk => chunk.content)
            .join('\n\n');
          
          // 이전 페이지와 다음 페이지 내용
          const beforePageContent = pageGroups.get(currentPage - 1)?.map(chunk => chunk.content).join('\n\n') || '';
          const afterPageContent = pageGroups.get(currentPage + 1)?.map(chunk => chunk.content).join('\n\n') || '';

          // 현재 페이지의 다른 청크들이 있으면 메인 컨텐츠에 추가
          let enhancedContent = result.content;
          if (currentPageContent) {
            enhancedContent = `${result.content}\n\n--- 같은 페이지의 다른 청크들 ---\n\n${currentPageContent}`;
          }

          return {
            ...result,
            content: enhancedContent,
            context: {
              before: beforePageContent,
              after: afterPageContent
            }
          };
        } catch (error) {
          console.error(`❌ [RAG] Error adding context for result:`, error);
          return result;
        }
      })
    );

    return resultsWithContext;
  }

  /**
   * 문서의 모든 청크 가져오기
   */
  private async getAllDocumentChunks(documentId: string): Promise<RAGSearchResult[]> {
    try {
      console.log(`📄 [RAG] Getting all chunks for document ${documentId}`);
      
      // 문서 ID를 포함한 쿼리로 검색하여 해당 문서의 모든 결과를 가져옴
      const results = await this.searchLegalDocuments({
        query: documentId, // 문서 ID로 검색
        topK: 200, // 충분한 결과를 가져와서 필터링
        confidenceThreshold: 0.0
      });

      console.log(`📄 [RAG] Found ${results.length} total results for document ${documentId}`);

      // 해당 문서의 결과만 필터링
      const documentResults = results.filter(result => 
        result.metadata?.documentId === documentId
      );

      console.log(`📄 [RAG] Filtered to ${documentResults.length} results for document ${documentId}`);
      return documentResults;
    } catch (error) {
      console.error(`❌ [RAG] Error getting document chunks:`, error);
      return [];
    }
  }

  /**
   * 청크들을 페이지별로 그룹화
   */
  private groupChunksByPage(chunks: RAGSearchResult[]): Map<number, RAGSearchResult[]> {
    const pageGroups = new Map<number, RAGSearchResult[]>();
    
    chunks.forEach(chunk => {
      const pageNumber = chunk.metadata?.pageNumber;
      if (pageNumber) {
        const page = parseInt(pageNumber);
        if (!pageGroups.has(page)) {
          pageGroups.set(page, []);
        }
        pageGroups.get(page)!.push(chunk);
      }
    });

    console.log(`📄 [RAG] Grouped chunks into ${pageGroups.size} pages`);
    return pageGroups;
  }

  /**
   * 특정 페이지의 내용 검색 (기존 메서드 - 호환성을 위해 유지)
   */
  private async searchPageContent(documentId: string, pageNumber: number): Promise<string | null> {
    if (pageNumber < 1) {
      console.log(`📄 [RAG] Page ${pageNumber} is invalid (less than 1)`);
      return null;
    }

    try {
      console.log(`📄 [RAG] Searching page ${pageNumber} from document ${documentId}`);
      
      // 문서 ID를 포함한 쿼리로 검색하여 해당 문서의 결과를 가져옴
      const results = await this.searchLegalDocuments({
        query: documentId, // 문서 ID로 검색
        topK: 100, // 충분한 결과를 가져와서 필터링
        confidenceThreshold: 0.0
      });

      console.log(`📄 [RAG] Found ${results.length} total results for document ${documentId}`);

      // 해당 문서의 해당 페이지 결과만 필터링
      const pageResults = results.filter(result => 
        result.metadata?.documentId === documentId && 
        result.metadata?.pageNumber === pageNumber.toString()
      );

      console.log(`📄 [RAG] Filtered to ${pageResults.length} results for page ${pageNumber}`);

      if (pageResults.length > 0) {
        // 모든 청크의 내용을 합쳐서 반환
        const allContent = pageResults.map(result => result.content).join('\n\n');
        console.log(`📄 [RAG] Found content for page ${pageNumber} (${pageResults.length} chunks): ${allContent.substring(0, 100)}...`);
        return allContent;
      } else {
        console.log(`📄 [RAG] No content found for page ${pageNumber}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ [RAG] Error searching page ${pageNumber}:`, error);
      return null;
    }
  }

  /**
   * 의미있는 단어 추출 (조사 및 불필요한 단어 제거)
   */
  private extractMeaningfulWords(text: string, stopWords: string[]): string[] {
    // 한글, 영문, 숫자만 추출하고 나머지는 공백으로 변환
    const cleanedText = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ');
    
    // 공백으로 분리하고 빈 문자열 제거
    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
    
    // 조사 및 불필요한 단어 제거
    const meaningfulWords = words.filter(word => {
      const lowerWord = word.toLowerCase();
      return !stopWords.includes(lowerWord) && 
             !stopWords.includes(word) && 
             word.length >= 2; // 2글자 이상만 포함
    });

    return meaningfulWords;
  }

  /**
   * 단어의 유의어 목록 반환
   */
  private getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      // 비디오 관련
      '비디오': ['영상', '동영상', 'video', '영상물', '동영상물'],
      '영상': ['비디오', '동영상', 'video', '영상물'],
      '동영상': ['비디오', '영상', 'video', '영상물'],
      
      // 소프트웨어 관련
      '소프트웨어': ['프로그램', '앱', '애플리케이션', 'software', '프로그램'],
      '프로그램': ['소프트웨어', '앱', '애플리케이션', 'software'],
      '앱': ['소프트웨어', '프로그램', '애플리케이션', 'application'],
      
      // 상표 관련
      '상표': ['trademark', '브랜드', '로고', '마크'],
      'trademark': ['상표', '브랜드', '로고', '마크'],
      '브랜드': ['상표', 'trademark', '로고', '마크'],
      
      // 등록 관련
      '등록': ['registration', '등록', '등기'],
      'registration': ['등록', '등기'],
      
      // 심사 관련
      '심사': ['examination', '심사', '검토', '검토'],
      'examination': ['심사', '검토'],
      
      // 관련 관련
      '관련': ['related', '관련', '연관', '관계'],
      'related': ['관련', '연관', '관계']
    };

    const lowerWord = word.toLowerCase();
    return synonymMap[lowerWord] || synonymMap[word] || [word];
  }

  /**
   * 단어와 유의어들을 포함한 확장된 검색어 목록 생성
   */
  private expandQueryWithSynonyms(words: string[]): string[] {
    const expandedWords: string[] = [];
    
    words.forEach(word => {
      const synonyms = this.getSynonyms(word);
      expandedWords.push(...synonyms);
    });

    // 중복 제거
    return [...new Set(expandedWords)];
  }

  /**
   * 전체 문서 청킹 상태 확인
   */
  async checkAllDocumentsStatus(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    sampleResults: Array<{
      source: string;
      confidence: number;
      contentPreview: string;
    }>;
  }> {
    console.log(`🔍 [RAG] Checking all documents status...`);
    
    try {
      // 일반적인 쿼리로 전체 문서 상태 확인
      const results = await this.searchLegalDocuments({
        query: "상표법", // 일반적인 쿼리로 검색
        topK: 20, // 충분한 결과를 가져와서 문서 상태 확인
        confidenceThreshold: 0.0
      });

      console.log(`📊 [RAG] Found ${results.length} total results`);
      
      // 결과 정보 간소화

      // 샘플 결과 추출
      const sampleResults = results.slice(0, 5).map(result => ({
        source: result.source,
        confidence: result.confidence,
        contentPreview: result.content.substring(0, 100) + '...'
      }));

      return {
        totalDocuments: Math.min(results.length, 3), // 3개 문서로 제한
        totalChunks: results.length,
        sampleResults
      };
    } catch (error) {
      console.error(`❌ [RAG] Error checking documents status:`, error);
      return {
        totalDocuments: 0,
        totalChunks: 0,
        sampleResults: []
      };
    }
  }

  private parseSearchResults(
    results: any[],
    confidenceThreshold: number = 0.1
  ): RAGSearchResult[] {
    console.log(`🔍 [RAG] Parsing ${results.length} results`);
    
    const parsedResults = results
      .map((result, index) => {
        const document = result.document;
        const derivedData = document?.derivedStructData;
        
        // Vertex AI Search에서는 relevanceScore가 없으므로 기본값 사용
        const confidence = result.relevanceScore || 0.8;
        
        // 개별 결과 처리 로그 제거

        if (confidence < confidenceThreshold) return null;

        // snippets에서 컨텐츠 추출 (chunking config 사용 시)
        const snippet = derivedData?.snippets?.[0];
        const content = snippet?.snippet || 
                       derivedData?.title || 
                       '내용을 찾을 수 없습니다.';
        
        // 콘텐츠 미리보기 로그 제거

        return {
          content: content,
          source: derivedData?.link || document?.name || document?.id || 'Unknown',
          confidence,
          metadata: {
            title: derivedData?.title || 'Unknown Title',
            documentId: document?.id,
            canFetchRawContent: derivedData?.can_fetch_raw_content === 'true',
            link: derivedData?.link
          }
          // context는 나중에 페이지 번호 기반으로 추가됨
        };
      })
      .filter(result => result !== null)
      .sort((a, b) => b.confidence - a.confidence);
    
    return parsedResults;
  }
}

// 싱글톤 인스턴스 생성 함수 (기본 IPDR 앱용)
export function createTrademarkRAGAgent(): TrademarkRAGAgent {
  const config: AgentBuilderConfig = {
    projectId: process.env.GCP_PROJECT_ID!,
    location: process.env.GCP_AGENT_BUILDER_LOCATION || 'global',
    appId: process.env.GCP_AGENT_BUILDER_APP_ID!,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
  };

  if (!config.projectId || !config.appId) {
    throw new Error('GCP Agent Builder configuration is missing. Please set GCP_PROJECT_ID and GCP_AGENT_BUILDER_APP_ID environment variables.');
  }

  return new TrademarkRAGAgent(config);
}

// Laws-Manuals 앱용 RAG 에이전트 생성 함수
export function createLawsManualsRAGAgent(): TrademarkRAGAgent {
  const config: AgentBuilderConfig = {
    projectId: 'gen-lang-client-0641392721',
    location: 'global',
    appId: 'laws-manuals_1754232870418',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
  };

  if (!config.credentials) {
    throw new Error('GCP Agent Builder credentials are missing. Please set GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable.');
  }

  return new TrademarkRAGAgent(config);
}

// 커스텀 앱용 RAG 에이전트 생성 함수
export function createCustomRAGAgent(customConfig: {
  projectId: string;
  dataStoreId: string;
  location?: string;
}): TrademarkRAGAgent {
  const config: AgentBuilderConfig = {
    projectId: customConfig.projectId,
    location: customConfig.location || 'global',
    appId: customConfig.dataStoreId,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
  };

  if (!config.credentials) {
    throw new Error('GCP Agent Builder credentials are missing. Please set GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable.');
  }

  return new TrademarkRAGAgent(config);
}

// 환경 변수 확인 함수
export function checkGCPConfiguration() {
  const required = {
    projectId: process.env.GCP_PROJECT_ID,
    appId: process.env.GCP_AGENT_BUILDER_APP_ID,
    hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
  };

  const missing = [];
  if (!required.projectId) missing.push('GCP_PROJECT_ID');
  if (!required.appId) missing.push('GCP_AGENT_BUILDER_APP_ID');
  if (!required.hasCredentials) missing.push('GOOGLE_APPLICATION_CREDENTIALS_BASE64');

  return {
    isConfigured: missing.length === 0,
    missing,
    config: required
  };
}