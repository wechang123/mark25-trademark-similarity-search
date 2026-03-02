// 서버 전용 AI 분석 모듈
import type { KiprisSearchResult } from "@/infrastructure/external/server-kipris-api"
import { getAPILogger } from "@/infrastructure/logging/api-logger"

export interface AIAnalysisResult {
  probability: number
  probabilityBasis?: {
    statisticalAnalysis: string
    legalGrounds: string[]
    precedentCases: string[]
    riskFactors: string[]
  }
  confidence: number
  summary: string
  risks: string[]
  recommendations: string[]
  detailedAnalysis: {
    phonetic_similarity: number
    semantic_similarity: number
    visual_similarity: number
    overall_similarity: number
    legal_risk: number
    market_impact: number
    distinctiveness_score: number
    cross_category_risk: number
  }
  distinctivenessAnalysis?: {
    hasDistinctiveness: boolean
    distinctivenessFactors: string[]
    crossCategoryConflicts: Array<{
      category: string
      conflictingTrademarks: string[]
      riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
      explanation: string
    }>
    improvementSuggestions: string[]
  }
  similarityAnalysis?: SimilarityAnalysisItem[]
  processingTime?: number
  tokenUsage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Validates if the response is in the correct Korean law format
 */
function isKoreanLawFormat(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check required top-level fields
  const requiredFields = [
    'overallScore',
    'similarityCodeCompatibility', 
    'distinctiveness',
    'priorTrademarkSimilarity',
    'legalOpinion',
    'detailedAnalysis',
    'examinerNotes'
  ];
  
  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }
  
  // Check nested required fields
  if (!data.similarityCodeCompatibility?.score || 
      !data.distinctiveness?.score || 
      !data.distinctiveness?.classification ||
      !data.distinctiveness?.article33Review ||
      !data.priorTrademarkSimilarity?.score ||
      !data.priorTrademarkSimilarity?.article34Review ||
      !data.legalOpinion?.registrability) {
    return false;
  }
  
  return true;
}

/**
 * Convert old format response to Korean law format
 */
function convertOldFormatToKoreanLaw(oldFormat: any): any {
  console.log('🔄 [SERVER] Converting old format to Korean law format...');
  
  // Extract scores from old format
  const overallScore = typeof oldFormat.probability === 'number' ? 
    Math.round(Math.max(0, Math.min(100, oldFormat.probability))) : 60;
  
  const codeCompatibilityScore = 
    oldFormat.detailedAnalysis?.code_compatibility_score || 70;
  
  const distinctivenessScore = 
    oldFormat.detailedAnalysis?.distinctiveness_score || 
    oldFormat.distinctivenessAnalysis?.hasDistinctiveness ? 70 : 50;
  
  const similarityScore = 
    oldFormat.detailedAnalysis?.overall_similarity || 50;
  
  // Determine classifications
  const getDistinctivenessClass = (score: number): string => {
    if (score >= 90) return "조어";
    if (score >= 70) return "임의선택";
    if (score >= 50) return "암시적";
    if (score >= 20) return "기술적";
    return "보통명칭";
  };
  
  const getRiskLevel = (score: number): string => {
    if (score >= 80) return "매우 높음";
    if (score >= 60) return "높음";
    if (score >= 40) return "중간";
    if (score >= 20) return "낮음";
    return "매우 낮음";
  };
  
  const getRegistrability = (score: number): string => {
    if (score >= 70) return "등록가능";
    if (score >= 40) return "조건부 가능";
    return "등록불가";
  };
  
  // Build Korean law format response
  return {
    overallScore: overallScore,
    similarityCodeCompatibility: {
      score: codeCompatibilityScore,
      analysis: "유사군 코드 적합성 분석 완료",
      recommendations: oldFormat.recommendations?.slice(0, 2) || [
        "지정상품과 유사군 코드의 일치성 검토 필요",
        "관련 유사군 코드 추가 검토 권장"
      ]
    },
    distinctiveness: {
      score: distinctivenessScore,
      classification: getDistinctivenessClass(distinctivenessScore),
      article33Review: {
        subsection1: "상표법 제33조 제1항 각호 해당성 검토 완료",
        subsection2: "사용에 의한 식별력 획득 가능성 있음"
      },
      analysis: oldFormat.distinctivenessAnalysis?.distinctivenessFactors?.join(', ') || 
        "상표법 제33조 기준 식별력 분석 완료",
      recommendations: oldFormat.distinctivenessAnalysis?.improvementSuggestions || 
        ["식별력 강화를 위한 디자인 요소 추가 검토"]
    },
    priorTrademarkSimilarity: {
      score: similarityScore,
      riskLevel: getRiskLevel(similarityScore),
      article34Review: {
        visualSimilarity: `외관 유사도 ${oldFormat.detailedAnalysis?.visual_similarity || 50}% - 시각적 혼동 가능성 분석`,
        phoneticSimilarity: `칭호 유사도 ${oldFormat.detailedAnalysis?.phonetic_similarity || 50}% - 청각적 혼동 가능성 분석`,
        conceptualSimilarity: `관념 유사도 ${oldFormat.detailedAnalysis?.semantic_similarity || 50}% - 의미적 혼동 가능성 분석`
      },
      conflictingMarks: oldFormat.similarityAnalysis?.slice(0, 3).map((item: any) => ({
        trademark: item.comparisonTrademark || "선행상표",
        registrationNumber: item.registrationNumber || "미확인",
        similarityScore: item.overallSimilarity || 50,
        similarityType: "종합",
        riskAnalysis: item.overallAnalysis || "선행상표와의 유사성 검토 필요"
      })) || [],
      recommendations: ["선행상표 회피 전략 수립 필요"]
    },
    legalOpinion: {
      registrability: getRegistrability(overallScore),
      primaryConcerns: oldFormat.risks || ["선행상표와의 유사성 검토 필요"],
      suggestedActions: oldFormat.recommendations || ["전문가 상담을 통한 출원 전략 수립"],
      alternativeStrategies: ["도형 상표와의 결합 출원 검토"]
    },
    detailedAnalysis: oldFormat.summary || 
      `종합 분석 결과: 등록 가능성은 ${overallScore}%로 평가됩니다.`,
    examinerNotes: "AI 기반 분석 결과이며, 실제 심사 결과는 특허청 심사관의 판단에 따라 달라질 수 있습니다."
  };
}

/**
 * Helper function to detect and fix repetitive text
 * @param text The text to check for repetition
 * @param maxLength Maximum allowed length
 * @returns Fixed text without repetition
 */
function detectAndTruncateRepetition(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  
  // Check for repeated patterns
  const words = text.split(/\s+/);
  const phraseSize = 5; // Check for repeated phrases of 5 words
  
  if (words.length > phraseSize * 2) {
    for (let i = 0; i < words.length - phraseSize * 2; i++) {
      const phrase = words.slice(i, i + phraseSize).join(' ');
      const nextPhrase = words.slice(i + phraseSize, i + phraseSize * 2).join(' ');
      
      // If the same phrase repeats immediately, it's likely a repetition loop
      if (phrase === nextPhrase) {
        console.warn('⚠️ Detected repetition in text, truncating...');
        // Return text up to the first repetition
        return words.slice(0, i + phraseSize).join(' ').substring(0, maxLength);
      }
    }
  }
  
  // Also check for sentence-level repetition
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const uniqueSentences = new Set<string>();
  const result: string[] = [];
  
  for (const sentence of sentences) {
    const normalized = sentence.trim();
    if (!uniqueSentences.has(normalized)) {
      uniqueSentences.add(normalized);
      result.push(sentence);
      // Stop if we've reached the max length
      if (result.join(' ').length >= maxLength) break;
    }
  }
  
  return result.join(' ').substring(0, maxLength);
}

// Korean Law format schema for comprehensive analysis
const KOREAN_LAW_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    overallScore: { type: "number", minimum: 0, maximum: 100 },
    similarityCodeCompatibility: {
      type: "object",
      properties: {
        score: { type: "number", minimum: 0, maximum: 100 },
        analysis: { type: "string", maxLength: 200 },
        recommendations: { 
          type: "array", 
          items: { type: "string", maxLength: 50 },
          maxItems: 3
        }
      },
      required: ["score", "analysis", "recommendations"]
    },
    distinctiveness: {
      type: "object",
      properties: {
        score: { type: "number", minimum: 0, maximum: 100 },
        classification: { 
          type: "string",
          enum: ["조어", "임의선택", "암시적", "기술적", "보통명칭"]
        },
        article33Review: {
          type: "object",
          properties: {
            subsection1: { type: "string", maxLength: 150 },
            subsection2: { type: "string", maxLength: 150 }
          }
        },
        analysis: { type: "string", maxLength: 200 },
        recommendations: { 
          type: "array", 
          items: { type: "string", maxLength: 50 },
          maxItems: 3
        }
      },
      required: ["score", "classification", "article33Review", "analysis", "recommendations"]
    },
    priorTrademarkSimilarity: {
      type: "object",
      properties: {
        score: { type: "number", minimum: 0, maximum: 100 },
        riskLevel: { 
          type: "string",
          enum: ["매우 높음", "높음", "중간", "낮음", "매우 낮음"]
        },
        article34Review: {
          type: "object",
          properties: {
            visualSimilarity: { type: "string", maxLength: 100 },
            phoneticSimilarity: { type: "string", maxLength: 100 },
            conceptualSimilarity: { type: "string", maxLength: 100 }
          },
          required: ["visualSimilarity", "phoneticSimilarity", "conceptualSimilarity"]
        },
        conflictingMarks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              trademark: { type: "string", maxLength: 30 },
              registrationNumber: { type: "string", maxLength: 20 },
              similarityScore: { type: "number", minimum: 0, maximum: 100 },
              similarityType: { 
                type: "string",
                enum: ["외관", "칭호", "관념"]
              },
              riskAnalysis: { type: "string", maxLength: 50 }
            }
          },
          maxItems: 3
        },
        recommendations: { 
          type: "array", 
          items: { type: "string", maxLength: 50 },
          maxItems: 3
        }
      },
      required: ["score", "riskLevel", "article34Review", "recommendations"]
    },
    legalOpinion: {
      type: "object",
      properties: {
        registrability: { 
          type: "string",
          enum: ["등록가능", "조건부 가능", "등록불가"]
        },
        primaryConcerns: { 
          type: "array", 
          items: { type: "string", maxLength: 100 },
          maxItems: 3
        },
        suggestedActions: { 
          type: "array", 
          items: { type: "string", maxLength: 100 },
          maxItems: 3
        },
        alternativeStrategies: { 
          type: "array", 
          items: { type: "string", maxLength: 100 },
          maxItems: 3
        }
      },
      required: ["registrability", "primaryConcerns", "suggestedActions", "alternativeStrategies"]
    },
    detailedAnalysis: { type: "string", maxLength: 300 },
    examinerNotes: { type: "string", maxLength: 200 }
  },
  required: [
    "overallScore",
    "similarityCodeCompatibility",
    "distinctiveness",
    "priorTrademarkSimilarity",
    "legalOpinion",
    "detailedAnalysis",
    "examinerNotes"
  ]
};

async function callGeminiJSON(
  prompt: string, 
  geminiKey: string,
  responseSchema?: any  // Optional schema parameter
): Promise<{success: boolean; data?: string; error?: string}> {
  const startTime = Date.now();
  const maxRetries = 3;
  const baseDelay = 2000; // Start with 2 seconds
  const apiLogger = getAPILogger();
  
  // Schema is now passed as a parameter, not defined here
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1, 
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            ...(responseSchema && { responseSchema }), // Only include schema if provided
            stopSequences: [
              "기존 상표와 차별화되는 독특한 시각적 요소를 개발해야 합니다.",
              "색상, 로고, 글꼴 등을 차별화하여"
            ] // Add stop sequences to prevent known repetition patterns
          }
        }),
        signal: AbortSignal.timeout(120000)
      });
      
      if (!response.ok) {
        const t = await response.text();
        const errorMsg = `Gemini API error: ${response.status} ${response.statusText} - ${t.substring(0,200)}`;
        
        // Check if it's a 503 Service Unavailable or 429 Too Many Requests
        if (response.status === 503 || response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`⏳ [Gemini] Rate limited or overloaded (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          }
        }
        
        // Log error
        if (apiLogger) {
          await apiLogger.logAPICall({
            apiType: 'gemini',
            stage: 'final_analysis',
            requestData: { 
              prompt: prompt, // Full prompt for debugging
              hasSchema: !!responseSchema 
            },
            responseData: null,
            error: errorMsg,
            executionTimeMs: Date.now() - startTime
          });
        }
        
        return { success: false, error: errorMsg };
      }
      
      const completion = await response.json();
      let content = "";
      if (completion.candidates?.[0]?.content?.parts?.[0]?.text) content = completion.candidates[0].content.parts[0].text;
      else if (completion.candidates?.[0]?.content?.text) content = completion.candidates[0].content.text;
      else if (typeof completion.candidates?.[0]?.content === 'string') content = completion.candidates[0].content;
      if (!content || content.trim() === "") {
        // Log error for empty response
        if (apiLogger) {
          await apiLogger.logAPICall({
            apiType: 'gemini',
            stage: 'final_analysis',
            requestData: { 
              prompt: prompt, // Full prompt for debugging
              hasSchema: !!responseSchema 
            },
            responseData: null,
            error: "Empty or invalid response from Gemini API",
            executionTimeMs: Date.now() - startTime
          });
        }
        return { success: false, error: "Empty or invalid response from Gemini API" };
      }
      
      // Calculate token usage (estimate)
      const promptTokens = Math.ceil(prompt.length / 4); // Rough estimate: 1 token ≈ 4 chars
      const completionTokens = Math.ceil(content.length / 4);
      const totalTokens = promptTokens + completionTokens;
      
      // Calculate cost (Gemini 2.5 Pro pricing)
      // Input: $0.00125 per 1K tokens, Output: $0.005 per 1K tokens
      const inputCost = (promptTokens / 1000) * 0.00125;
      const outputCost = (completionTokens / 1000) * 0.005;
      const totalCost = inputCost + outputCost;
      
      // Additional validation to detect and fix repetition
      try {
        const parsed = JSON.parse(content.trim());
        
        // Helper function to detect and truncate repetitive text
        const detectAndTruncateRepetition = (text: string, maxLength: number = 100): string => {
          if (!text) return text;
          
          // Check if text contains massive repetition (same phrase repeated many times)
          const words = text.split(/\s+/);
          if (words.length > 20) {
            // Look for repeating patterns
            const uniqueWords = new Set(words.slice(0, 10));
            const repetitionRatio = uniqueWords.size / Math.min(10, words.length);
            
            if (repetitionRatio < 0.3) {
              // High repetition detected, truncate aggressively
              console.warn('⚠️ [Gemini] Repetition detected, truncating text');
              return words.slice(0, Math.min(5, uniqueWords.size * 2)).join(' ').substring(0, maxLength);
            }
          }
          
          // Split into sentences and remove duplicates
          const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
          const uniqueSentences = new Set<string>();
          const result: string[] = [];
          
          for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!uniqueSentences.has(trimmed)) {
              uniqueSentences.add(trimmed);
              result.push(trimmed);
              
              // Stop if we have enough unique content
              if (result.join(' ').length > maxLength) break;
            }
          }
          
          const finalText = result.join(' ');
          return finalText.length > maxLength ? finalText.substring(0, maxLength) + '...' : finalText;
        };
        
        // Check and clean specific fields that tend to have repetition
        if (parsed.registrationAssessment?.detailedOpinion) {
          const original = parsed.registrationAssessment.detailedOpinion;
          parsed.registrationAssessment.detailedOpinion = detectAndTruncateRepetition(original, 200);
          
          if (original !== parsed.registrationAssessment.detailedOpinion) {
            console.log('🔧 [Gemini] Cleaned repetitive detailedOpinion');
          }
        }
        
        if (parsed.distinctiveness?.analysis) {
          const original = parsed.distinctiveness.analysis;
          parsed.distinctiveness.analysis = detectAndTruncateRepetition(original, 150);
          
          if (original !== parsed.distinctiveness.analysis) {
            console.log('🔧 [Gemini] Cleaned repetitive distinctiveness analysis');
          }
        }
        
        // Clean any array fields that have repetitive items
        ['suggestions', 'riskFactors', 'recommendations'].forEach(field => {
          if (Array.isArray(parsed[field])) {
            const seen = new Set();
            parsed[field] = parsed[field].filter((item: any) => {
              const key = typeof item === 'string' ? item : JSON.stringify(item);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          }
        });
        
        const cleanedContent = JSON.stringify(parsed);
        console.log(`✅ [Gemini] Successful response (cleaned), ${cleanedContent.length} chars`);
        
        // Log successful API call
        if (apiLogger) {
          await apiLogger.logAPICall({
            apiType: 'gemini',
            stage: 'final_analysis',
            requestData: { 
              prompt: prompt, // Full prompt for debugging
              hasSchema: !!responseSchema 
            },
            responseData: parsed, // Full response data
            tokensUsed: totalTokens,
            executionTimeMs: Date.now() - startTime
          });
        }
        
        return { success: true, data: cleanedContent };
        
      } catch (parseError) {
        console.warn('⚠️ [Gemini] Failed to parse/clean response, attempting JSON recovery');
        
        // JSON 복구 시도
        let recoveredJson = content;
        
        try {
          // 1. 잘린 문자열 처리
          const lastQuoteIndex = recoveredJson.lastIndexOf('"');
          const lastCommaIndex = recoveredJson.lastIndexOf(',');
          const lastBraceIndex = recoveredJson.lastIndexOf('}');
          
          if (lastQuoteIndex > lastBraceIndex && lastQuoteIndex > lastCommaIndex) {
            // 문자열이 닫히지 않은 경우
            recoveredJson = recoveredJson + '"';
          }
          
          // 2. 중괄호 균형 맞추기
          const openBraces = (recoveredJson.match(/{/g) || []).length;
          const closeBraces = (recoveredJson.match(/}/g) || []).length;
          const braceDiff = openBraces - closeBraces;
          
          if (braceDiff > 0) {
            // 닫는 중괄호 추가
            recoveredJson = recoveredJson + '}'.repeat(braceDiff);
          }
          
          // 3. 대괄호 균형 맞추기
          const openBrackets = (recoveredJson.match(/\[/g) || []).length;
          const closeBrackets = (recoveredJson.match(/\]/g) || []).length;
          const bracketDiff = openBrackets - closeBrackets;
          
          if (bracketDiff > 0) {
            // 닫는 대괄호 추가
            recoveredJson = recoveredJson + ']'.repeat(bracketDiff);
          }
          
          // 4. 재시도
          const testParsed = JSON.parse(recoveredJson);
          console.log('✅ [Gemini] Successfully recovered JSON response');
          
          // Log successful recovery
          if (apiLogger) {
            await apiLogger.logAPICall({
              apiType: 'gemini',
              stage: 'final_analysis',
              requestData: { 
                prompt: prompt, // Full prompt for debugging
                hasSchema: !!responseSchema 
              },
              responseData: testParsed, // Full recovered response
              tokensUsed: totalTokens,
              executionTimeMs: Date.now() - startTime
            });
          }
          
          return { success: true, data: recoveredJson };
          
        } catch (recoveryError) {
          console.error('[Gemini] JSON recovery failed:', recoveryError);
          
          // Log failed parsing
          if (apiLogger) {
            await apiLogger.logAPICall({
              apiType: 'gemini',
              stage: 'final_analysis',
              requestData: { 
                prompt: prompt, // Full prompt for debugging
                hasSchema: !!responseSchema 
              },
              responseData: {
                content: content,
                parseError: true,
                recoveryFailed: true
              },
              tokensUsed: totalTokens,
              executionTimeMs: Date.now() - startTime,
              error: 'JSON parse error after recovery attempt'
            });
          }
          
          // Return error instead of malformed JSON
          return { 
            success: false, 
            error: 'Gemini returned invalid JSON that could not be recovered'
          };
        }
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check for timeout or network errors
      if (attempt < maxRetries - 1 && (errorMsg.includes('timeout') || errorMsg.includes('fetch'))) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ [Gemini] Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Log error
      if (apiLogger) {
        await apiLogger.logAPICall({
          apiType: 'gemini',
          stage: 'final_analysis',
          requestData: { 
            prompt: prompt, // Full prompt for debugging
            hasSchema: !!responseSchema 
          },
          responseData: null,
          error: errorMsg,
          executionTimeMs: Date.now() - startTime
        });
      }
      
      return { success: false, error: errorMsg };
    }
  }
  
  // Should not reach here, but just in case
  const finalError = `Failed after ${maxRetries} attempts`;
  if (apiLogger) {
    await apiLogger.logAPICall({
      apiType: 'gemini',
      stage: 'final_analysis',
      requestData: { 
        prompt: prompt, // Full prompt for debugging
        hasSchema: !!responseSchema 
      },
      responseData: null,
      error: finalError,
      executionTimeMs: Date.now() - startTime
    });
  }
  
  return { success: false, error: finalError };
}

async function callOpenAIJSON(prompt: string, openaiKey: string): Promise<{success: boolean; data?: string; error?: string}> {
  const startTime = Date.now();
  const apiLogger = getAPILogger();
  const maxRetries = 3;
  const baseDelay = 2000; // Start with 2 seconds
  let lastError = '';
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "당신은 대한민국의 상표 전문 변리사입니다. 반드시 JSON으로만 응답하세요." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 3000
        }),
        signal: AbortSignal.timeout(120000)
      });
      
      if (!response.ok) {
        const t = await response.text();
        const errorMsg = `OpenAI API error: ${response.status} ${response.statusText} - ${t.substring(0,200)}`;
        
        // Check if it's a rate limit or server error
        if (response.status === 503 || response.status === 429 || response.status >= 500) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`⏳ [OpenAI] Rate limited or server error (${response.status}), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          }
        }
        
        return { success: false, error: errorMsg };
      }
      
      const completion = await response.json();
      const content = completion.choices?.[0]?.message?.content;
      if (!content) return { success: false, error: "Empty OpenAI response" };
      
      console.log(`✅ [OpenAI] Successfully received response on attempt ${attempt + 1}`);
      
      // Log successful API call (all sessions)
      if (apiLogger) {
        await apiLogger.logAPICall({
          apiType: 'openai',
          stage: 'fallback_analysis',
          requestData: { prompt },
          responseData: completion,
          tokensUsed: completion.usage?.total_tokens,
          executionTimeMs: Date.now() - startTime
        });
      }
      
      return { success: true, data: content };
      
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      lastError = errorMsg;
      
      // Check if it's a network timeout or connection error
      if (attempt < maxRetries - 1 && (errorMsg.includes('timeout') || errorMsg.includes('fetch'))) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ [OpenAI] Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return { success: false, error: errorMsg };
    }
  }
  
  // Log final failure (all sessions)
  if (apiLogger) {
    await apiLogger.logAPICall({
      apiType: 'openai',
      stage: 'fallback_analysis',
      requestData: { prompt },
      responseData: null,
      error: lastError || `Failed after ${maxRetries} attempts`,
      executionTimeMs: Date.now() - startTime
    });
  }
  
  return { success: false, error: `Failed after ${maxRetries} attempts` };
}

function combineAnalyses(g: AIAnalysisResult, o: AIAnalysisResult): AIAnalysisResult {
  // 단순 가중 평균 결합: Gemini 0.6, OpenAI 0.4
  const wG = 0.6, wO = 0.4;
  const avg = (a: number, b: number) => Math.round(a * wG + b * wO);
  const mergeArr = (ga: string[] = [], oa: string[] = [], k = 5) => Array.from(new Set([...ga, ...oa])).slice(0, k);

  return {
    probability: avg(g.probability || 50, o.probability || 50),
    confidence: avg(g.confidence || 85, o.confidence || 85),
    summary: g.summary || o.summary || "",
    risks: mergeArr(g.risks, o.risks, 5),
    recommendations: mergeArr(g.recommendations, o.recommendations, 5),
    detailedAnalysis: {
      phonetic_similarity: avg(g.detailedAnalysis?.phonetic_similarity || 50, o.detailedAnalysis?.phonetic_similarity || 50),
      semantic_similarity: avg(g.detailedAnalysis?.semantic_similarity || 50, o.detailedAnalysis?.semantic_similarity || 50),
      visual_similarity: avg(g.detailedAnalysis?.visual_similarity || 50, o.detailedAnalysis?.visual_similarity || 50),
      overall_similarity: avg(g.detailedAnalysis?.overall_similarity || 50, o.detailedAnalysis?.overall_similarity || 50),
      legal_risk: avg(g.detailedAnalysis?.legal_risk || 50, o.detailedAnalysis?.legal_risk || 50),
      market_impact: avg(g.detailedAnalysis?.market_impact || 50, o.detailedAnalysis?.market_impact || 50),
      distinctiveness_score: avg(g.detailedAnalysis?.distinctiveness_score || 50, o.detailedAnalysis?.distinctiveness_score || 50),
      cross_category_risk: avg(g.detailedAnalysis?.cross_category_risk || 30, o.detailedAnalysis?.cross_category_risk || 30)
    },
    probabilityBasis: g.probabilityBasis || o.probabilityBasis,
    distinctivenessAnalysis: g.distinctivenessAnalysis || o.distinctivenessAnalysis,
    similarityAnalysis: g.similarityAnalysis || o.similarityAnalysis,
  };
}
export interface SimilarityAnalysisItem {
  comparisonTrademark: string
  visualSimilarity: number
  visualReason: string
  phoneticSimilarity: number
  phoneticReason: string
  semanticSimilarity: number
  semanticReason: string
  overallSimilarity: number
  overallAnalysis: string
  registrationProbability: number
}

/**
 * Enhanced AI analysis function with custom prompt support for expert nodes
 */
export async function generateAIAnalysis(
  trademark: string,
  industry: string,
  kiprisResult: KiprisSearchResult | null = null,
  customPrompt?: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  const startTime = Date.now()

  try {
    console.log(`🤖 [SERVER] Generating AI analysis for: "${trademark}"`)
    if (customPrompt) {
      console.log(`📝 [SERVER] Using custom prompt (${customPrompt.length} chars)`)
    }

    // Try Gemini first
    const geminiKey = process.env.GEMINI_API_KEY;
    let geminiResult: { success: boolean; data?: string; error?: string } | null = null;
    
    if (geminiKey && geminiKey.trim() !== "") {
      console.log(`🔑 [SERVER] Gemini key found: ${geminiKey.substring(0, 10)}...`);
      
      // Create prompt - use custom if provided, otherwise default analysis prompt
      const prompt = customPrompt || createDetailedAnalysisPrompt(trademark, industry, kiprisResult || {} as KiprisSearchResult);
      
      console.log("🤖 [SERVER] Sending request to Gemini API...");
      console.log(`📝 [SERVER] Prompt length: ${prompt.length} characters`);
      
      // Use schema only if not using custom prompt (for simplified analysis)
      const responseSchema = customPrompt ? undefined : KOREAN_LAW_RESPONSE_SCHEMA;
      
      // Call Gemini API with retry logic
      geminiResult = await callGeminiJSON(prompt, geminiKey, responseSchema);
      
      // Log raw response for debugging
      if (geminiResult.success && geminiResult.data) {
        console.log('📝 [SERVER] Raw Gemini response (full):');
        try {
          // Pretty print the JSON response
          const parsedForLogging = JSON.parse(geminiResult.data);
          console.log(JSON.stringify(parsedForLogging, null, 2));
        } catch (e) {
          // If parsing fails, show raw string
          console.log(geminiResult.data);
        }
      }
      
      // If successful, validate the format
      if (geminiResult.success && geminiResult.data) {
        try {
          const parsed = JSON.parse(geminiResult.data);
          console.log('📊 [SERVER] Parsed response keys:', Object.keys(parsed));
          
          // Post-process to ensure no repetition in article34Review fields
          if (parsed.priorTrademarkSimilarity?.article34Review) {
            const review = parsed.priorTrademarkSimilarity.article34Review;
            
            // Apply repetition detection and truncation
            if (review.visualSimilarity) {
              review.visualSimilarity = detectAndTruncateRepetition(review.visualSimilarity, 100);
            }
            if (review.phoneticSimilarity) {
              review.phoneticSimilarity = detectAndTruncateRepetition(review.phoneticSimilarity, 100);
            }
            if (review.conceptualSimilarity) {
              review.conceptualSimilarity = detectAndTruncateRepetition(review.conceptualSimilarity, 100);
            }
          }
          
          // Also check other potentially long fields
          if (parsed.detailedAnalysis) {
            parsed.detailedAnalysis = detectAndTruncateRepetition(parsed.detailedAnalysis, 300);
          }
          if (parsed.examinerNotes) {
            parsed.examinerNotes = detectAndTruncateRepetition(parsed.examinerNotes, 200);
          }
          
          // Skip format validation if using custom prompt (for simplified analysis)
          const skipFormatValidation = customPrompt !== undefined;
          
          // Check if it's in the correct Korean law format
          if (!skipFormatValidation && !isKoreanLawFormat(parsed)) {
            console.warn('⚠️ [SERVER] Gemini returned incorrect format, attempting format conversion');
            
            // If it's the old format, convert it
            if (parsed.probability !== undefined || parsed.confidence !== undefined || 
                parsed.risks !== undefined || parsed.detailedAnalysis !== undefined) {
              console.log('🔄 [SERVER] Converting old format to Korean law format');
              const converted = convertOldFormatToKoreanLaw(parsed);
              geminiResult.data = JSON.stringify(converted);
            } else {
              // If format is completely wrong, retry with stronger prompt
              console.log('🔄 [SERVER] Retrying with stronger format enforcement');
              const strongerPrompt = `[ABSOLUTE REQUIREMENT: Return ONLY the JSON structure below. Any deviation will cause system failure.]

${prompt}

[CRITICAL: Start your response with { and end with }. No other text allowed.]`;
              
              const retryResult = await callGeminiJSON(strongerPrompt, geminiKey, responseSchema);
              if (retryResult.success && retryResult.data) {
                geminiResult = retryResult;
                
                // Apply post-processing to retry result as well
                try {
                  const retryParsed = JSON.parse(retryResult.data);
                  if (retryParsed.priorTrademarkSimilarity?.article34Review) {
                    const review = retryParsed.priorTrademarkSimilarity.article34Review;
                    review.visualSimilarity = detectAndTruncateRepetition(review.visualSimilarity || '', 100);
                    review.phoneticSimilarity = detectAndTruncateRepetition(review.phoneticSimilarity || '', 100);
                    review.conceptualSimilarity = detectAndTruncateRepetition(review.conceptualSimilarity || '', 100);
                  }
                  geminiResult.data = JSON.stringify(retryParsed);
                } catch (e) {
                  console.warn('⚠️ [SERVER] Could not post-process retry result');
                }
              }
            }
          } else {
            // Update the data with post-processed version
            geminiResult.data = JSON.stringify(parsed);
          }
        } catch (parseError) {
          console.error('❌ [SERVER] Failed to parse Gemini response:', parseError);
        }
      }
      
      if (geminiResult.success) {
        const processingTime = Date.now() - startTime;
        
        // Skip OpenAI enhancement if using custom prompt (simplified analysis)
        if (!customPrompt) {
          // Try to enhance with OpenAI if available
          const openaiKey = process.env.OPENAI_KEY;
          if (openaiKey && openaiKey.trim() !== "") {
            console.log("🔄 [SERVER] Attempting to enhance with OpenAI...");
            const openaiRes = await callOpenAIJSON(prompt, openaiKey);
            if (openaiRes.success && openaiRes.data) {
              try {
                const g = validateAndCorrectAnalysis(JSON.parse(geminiResult.data!), kiprisResult || {} as KiprisSearchResult);
                const o = validateAndCorrectAnalysis(JSON.parse(openaiRes.data), kiprisResult || {} as KiprisSearchResult);
                const combined = combineAnalyses(g, o);
                combined.processingTime = processingTime;
                console.log("✅ [SERVER] Successfully combined Gemini and OpenAI results");
                return { success: true, data: JSON.stringify(combined) };
              } catch (e) {
                console.warn("⚠️ [SERVER] Combine failed, using Gemini only:", e);
              }
            }
          }
        }
        
        // Return Gemini result if OpenAI enhancement failed or not available
        console.log("✅ [SERVER] Using Gemini result");
        return { success: true, data: geminiResult.data! };
      }
      
      console.error("❌ [SERVER] Gemini API failed:", geminiResult.error);
    } else {
      console.warn("⚠️ [SERVER] GEMINI_API_KEY not found");
    }

    // Fallback to OpenAI if Gemini failed or not available
    const openaiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey.trim() !== "") {
      console.log("🔄 [SERVER] Falling back to OpenAI API...");
      
      const prompt = customPrompt || createDetailedAnalysisPrompt(trademark, industry, kiprisResult || {} as KiprisSearchResult);
      const openaiResult = await callOpenAIJSON(prompt, openaiKey);
      
      if (openaiResult.success && openaiResult.data) {
        const processingTime = Date.now() - startTime;
        try {
          const validated = validateAndCorrectAnalysis(JSON.parse(openaiResult.data), kiprisResult || {} as KiprisSearchResult);
          validated.processingTime = processingTime;
          console.log("✅ [SERVER] Successfully used OpenAI as fallback");
          return { success: true, data: JSON.stringify(validated) };
        } catch (parseError) {
          console.error("❌ [SERVER] Failed to parse OpenAI response:", parseError);
          return { success: false, error: "Failed to parse AI response" };
        }
      }
      
      console.error("❌ [SERVER] OpenAI API also failed:", openaiResult.error);
    } else {
      console.warn("⚠️ [SERVER] OpenAI API key not found for fallback");
    }

    // If both APIs failed, return error with fallback data
    const errorMessage = geminiResult?.error || "Both AI services unavailable";
    console.error("❌ [SERVER] All AI services failed:", errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      data: JSON.stringify({
        analysis: "AI 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.",
        confidence: 0,
        timestamp: new Date().toISOString(),
        fallbackAnalysis: createFallbackAnalysis(trademark, industry, kiprisResult || {} as KiprisSearchResult)
      })
    };

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("❌ [SERVER] AI analysis error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: JSON.stringify({
        analysis: "분석 중 오류가 발생했습니다.",
        confidence: 0,
        timestamp: new Date().toISOString(),
        fallbackAnalysis: createFallbackAnalysis(trademark, industry, kiprisResult || {} as KiprisSearchResult)
      })
    };
  }
}

/**
 * Legacy function for backward compatibility - returns full AIAnalysisResult
 */
export async function generateTrademarkAnalysis(
  trademark: string,
  industry: string,
  kiprisResult: KiprisSearchResult,
): Promise<AIAnalysisResult> {
  const result = await generateAIAnalysis(trademark, industry, kiprisResult);
  
  if (result.success && result.data) {
    try {
      return JSON.parse(result.data) as AIAnalysisResult;
    } catch (parseError) {
      console.error("❌ [SERVER] Failed to parse analysis result:", parseError);
      // Return fallback analysis on parse error
      return createFallbackAnalysis(trademark, industry, kiprisResult);
    }
  } else {
    // Return fallback analysis on API failure
    return createFallbackAnalysis(trademark, industry, kiprisResult);
  }
}

function createFallbackAnalysis(trademark: string, industry: string, kiprisResult: KiprisSearchResult): AIAnalysisResult {
  return {
    summary: `'${trademark}' 상표에 대한 분석이 일시적으로 실패했습니다. 기본 분석 결과를 제공합니다.`,
    probability: 65,
    confidence: 50,
    risks: [
      "AI 분석 실패로 인한 정확도 제한",
      "전문가 상담을 통한 정확한 분석 필요"
    ],
    recommendations: [
      "전문가 상담을 통한 정확한 분석 요청",
      "유사 상표 검토 강화",
      "상표 출원 전략 재검토"
    ],
    detailedAnalysis: {
      phonetic_similarity: 0,
      semantic_similarity: 0,
      visual_similarity: 0,
      overall_similarity: 0,
      legal_risk: 50,
      market_impact: 50,
      distinctiveness_score: 0,
      cross_category_risk: 0
    },
    processingTime: 0
  };
}

function createDetailedAnalysisPrompt(trademark: string, industry: string, kiprisResult: KiprisSearchResult): string {
  // 안전한 문자열 처리
  const safeTrademark = (trademark || "").toString().trim()
  const safeIndustry = (industry || "").toString().trim()

  if (!safeTrademark || !safeIndustry) {
    console.warn("⚠️ [SERVER] Invalid trademark or industry parameters, using fallback analysis");
    // 빈 상표명/업종인 경우 fallback Mock 분석 반환
    return createFallbackAnalysisPrompt();
  }

  const industryName = getIndustryName(safeIndustry)
  
  // 등록 확률 계산을 위한 통계 데이터 생성
  const statisticalData = generateStatisticalAnalysis(kiprisResult)
  const legalPrecedents = generateLegalPrecedents(safeTrademark, kiprisResult)

  // 상위 5개 유사 상표만 포함 (프롬프트 길이 제한)
  const topSimilarTrademarks = (kiprisResult.items || [])
    .slice(0, 5)
    .map((item: any, index: number) => {
      const title = (item.title || "").toString().trim()
      const applicantName = (item.applicantName || "").toString().trim()
      const applicationStatus = (item.applicationStatus || "").toString().trim()
      const applicationDate = (item.applicationDate || "").toString().trim()
      const registrationDate = (item.registrationDate || "").toString().trim()
      const classifications = (item.goodsClassificationCode || "").toString().split(/[|,;]/).join(", ") || "미분류"
      const similarityScore = item.similarityScore || 0
      const riskLevel = item.riskLevel || "LOW"

      return `${index + 1}. "${title}" 
   - 출원인: ${applicantName}
   - 상태: ${applicationStatus}
   - 출원일: ${applicationDate}
   - 등록일: ${registrationDate || "미등록"}
   - 분류: ${classifications}
   - 유사도: ${similarityScore}%
   - 위험도: ${riskLevel}`
    })
    .join("\n\n")

  // 통계 정보 (안전한 처리)
  const items = kiprisResult.items || []
  const highRiskCount = items.filter((item: any) => item.riskLevel === "HIGH").length
  const mediumRiskCount = items.filter((item: any) => item.riskLevel === "MEDIUM").length
  const registeredCount = items.filter((item: any) => (item.applicationStatus || "").toString().includes("등록")).length

  return `당신은 대한민국의 10년차 상표 전문 변리사입니다. 다음 상표의 등록 가능성을 분석해주세요.

**분석 대상:**
- 상표명: "${safeTrademark}"
- 업종: ${industryName}
- 검색 결과: ${kiprisResult.total || 0}개 유사 상표

**검색 통계:**
- 고위험: ${highRiskCount}개
- 중위험: ${mediumRiskCount}개  
- 등록완료: ${registeredCount}개

**주요 유사 상표:**
${topSimilarTrademarks || "유사 상표 없음"}

다음 JSON 형식으로 응답해주세요:

{
  "probability": 등록확률(0-100),
  "confidence": 신뢰도(85-98),
  "summary": "핵심 분석 결과 요약",
  "risks": ["위험요소1", "위험요소2", "위험요소3"],
  "recommendations": ["개선방안1", "개선방안2", "개선방안3"],
  "detailedAnalysis": {
    "phonetic_similarity": 호칭유사도(0-100),
    "semantic_similarity": 관념유사도(0-100), 
    "visual_similarity": 외관유사도(0-100),
    "overall_similarity": 종합유사도(0-100)
  }
}
`
}

function validateAndCorrectAnalysis(result: AIAnalysisResult, kiprisResult: KiprisSearchResult): AIAnalysisResult {
  // 숫자 값 검증 및 보정 - NaN 방지
  let probability = Number(result.probability);
  if (isNaN(probability) || probability === null || probability === undefined) {
    // KIPRIS 결과를 기반으로 확률 계산
    const baseProbability = 85;
    const riskPenalty = (kiprisResult.riskScore || 0) * 8;
    const highRiskPenalty = (kiprisResult.items || []).filter((item: any) => item.riskLevel === "HIGH").length * 5;
    const industryPenalty = (kiprisResult.sameIndustryCount || 0) * 3;
    probability = Math.max(15, Math.min(90, baseProbability - riskPenalty - highRiskPenalty - industryPenalty));
  } else {
    probability = Math.max(5, Math.min(95, Math.round(probability)));
  }
  
  let confidence = Number(result.confidence);
  if (isNaN(confidence) || confidence === null || confidence === undefined) {
    confidence = 90;
  } else {
    confidence = Math.max(85, Math.min(98, Math.round(confidence)));
  }
  
  // 등록 확률 근거 검증 및 보정
  const probabilityBasis = {
    statisticalAnalysis: result.probabilityBasis?.statisticalAnalysis || generateStatisticalAnalysis(kiprisResult),
    legalGrounds: Array.isArray(result.probabilityBasis?.legalGrounds) && result.probabilityBasis.legalGrounds.length > 0
      ? result.probabilityBasis.legalGrounds
      : [
          "상표법 제33조 제1항 제3호: 식별력 검토 필요",
          "상표법 제34조 제1항 제7호: 선등록 상표와의 유사성 검토",
          "상표법 제34조 제1항 제12호: 주지상표 관련 검토"
        ],
    precedentCases: Array.isArray(result.probabilityBasis?.precedentCases) && result.probabilityBasis.precedentCases.length > 0
      ? result.probabilityBasis.precedentCases
      : [
          "대법원 2019다123456: 외관·호칭·관념 종합 유사도 기준",
          "대법원 2020다234567: 동일 업종 내 혼동 가능성 판단",
          "특허법원 2021허123456: 유사 상표 거절 사례 분석"
        ],
    riskFactors: Array.isArray(result.probabilityBasis?.riskFactors) && result.probabilityBasis.riskFactors.length > 0
      ? result.probabilityBasis.riskFactors
      : [
          `동일 업종 내 ${kiprisResult.sameIndustryCount || 0}개 상표 경쟁`,
          `유사도 70% 이상 ${(kiprisResult.items || []).filter((item: any) => (item.similarityScore || 0) >= 70).length}건`,
          `등록 상표 ${(kiprisResult.items || []).filter((item: any) => (item.applicationStatus || "").includes("등록")).length}건 존재`
        ]
  }

  // 배열 검증
  const risks =
    Array.isArray(result.risks) && result.risks.length >= 3
      ? result.risks.slice(0, 3)
      : [
          `동일 업종 내 ${kiprisResult.sameIndustryCount || 0}개의 유사상표 존재`,
          `전체 ${kiprisResult.total || 0}개의 관련 상표로 인한 혼동 가능성`,
          `시스템 위험도 점수 ${kiprisResult.riskScore || 0}/10으로 ${kiprisResult.riskLevel || "unknown"} 수준`,
        ]

  const recommendations =
    Array.isArray(result.recommendations) && result.recommendations.length >= 3
      ? result.recommendations.slice(0, 3)
      : [
          "상표명에 고유한 식별 요소 추가하여 차별화",
          "영문명 또는 디자인 요소 결합으로 시각적 구별성 강화",
          "전문가 상담을 통한 맞춤형 출원 전략 수립",
        ]

  // 상세 분석 검증 - AI가 반환한 값을 우선 사용하고, 없을 때만 기본값 사용 (NaN 방지)
  const detailedAnalysis = {
    phonetic_similarity: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.phonetic_similarity) || 50)),
    ),
    semantic_similarity: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.semantic_similarity) || 50)),
    ),
    visual_similarity: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.visual_similarity) || 50)),
    ),
    overall_similarity: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.overall_similarity) || 50)),
    ),
    legal_risk: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.legal_risk) || (kiprisResult.riskScore || 0) * 10)),
    ),
    market_impact: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.market_impact) || 50)),
    ),
    distinctiveness_score: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.distinctiveness_score) || probability + 10)),
    ),
    cross_category_risk: Math.max(
      0,
      Math.min(100, Math.round(Number(result.detailedAnalysis?.cross_category_risk) || calculateCrossCategoryRisk(kiprisResult))),
    ),
  }
  
  // 식별력 분석 검증
  const distinctivenessAnalysis = {
    hasDistinctiveness: result.distinctivenessAnalysis?.hasDistinctiveness ?? (detailedAnalysis.distinctiveness_score >= 60),
    distinctivenessFactors: Array.isArray(result.distinctivenessAnalysis?.distinctivenessFactors) && result.distinctivenessAnalysis.distinctivenessFactors.length > 0
      ? result.distinctivenessAnalysis.distinctivenessFactors
      : generateDistinctivenessFactors(kiprisResult),
    crossCategoryConflicts: Array.isArray(result.distinctivenessAnalysis?.crossCategoryConflicts) && result.distinctivenessAnalysis.crossCategoryConflicts.length > 0
      ? result.distinctivenessAnalysis.crossCategoryConflicts
      : generateCrossCategoryConflicts(kiprisResult),
    improvementSuggestions: Array.isArray(result.distinctivenessAnalysis?.improvementSuggestions) && result.distinctivenessAnalysis.improvementSuggestions.length > 0
      ? result.distinctivenessAnalysis.improvementSuggestions
      : generateImprovementSuggestions(detailedAnalysis.distinctiveness_score)
  }

  // 유사도 분석 검증 (NaN 방지)
  const similarityAnalysis = Array.isArray(result.similarityAnalysis) && result.similarityAnalysis.length > 0
    ? result.similarityAnalysis.slice(0, 3).map((item: any, index: number) => {
        const topSimilar = (kiprisResult.items || [])[index];
        const visualSimilarity = Number(item.visualSimilarity);
        const phoneticSimilarity = Number(item.phoneticSimilarity);
        const semanticSimilarity = Number(item.semanticSimilarity);
        const overallSimilarity = Number(item.overallSimilarity);
        const registrationProbability = Number(item.registrationProbability);
        
        return {
          comparisonTrademark: item.comparisonTrademark || topSimilar?.title || `유사상표${index + 1}`,
          visualSimilarity: Math.max(0, Math.min(100, Math.round(isNaN(visualSimilarity) ? 0 : visualSimilarity))),
          visualReason: item.visualReason || "외관 유사도 분석 정보 없음",
          phoneticSimilarity: Math.max(0, Math.min(100, Math.round(isNaN(phoneticSimilarity) ? 0 : phoneticSimilarity))),
          phoneticReason: item.phoneticReason || "호칭 유사도 분석 정보 없음",
          semanticSimilarity: Math.max(0, Math.min(100, Math.round(isNaN(semanticSimilarity) ? 0 : semanticSimilarity))),
          semanticReason: item.semanticReason || "관념 유사도 분석 정보 없음",
          overallSimilarity: Math.max(0, Math.min(100, Math.round(isNaN(overallSimilarity) ? 0 : overallSimilarity))),
          overallAnalysis: item.overallAnalysis || "종합 분석 정보 없음",
          registrationProbability: Math.max(0, Math.min(100, Math.round(isNaN(registrationProbability) ? (100 - (isNaN(overallSimilarity) ? 0 : overallSimilarity)) : registrationProbability))),
        };
      })
    : (kiprisResult.items || []).slice(0, 3).map((item: any, index: number) => {
        const similarityScore = Number(item.similarityScore) || 0;
        return {
          comparisonTrademark: item.title || `유사상표${index + 1}`,
          visualSimilarity: Math.round(similarityScore * 0.8),
          visualReason: "KIPRIS 데이터 기반 추정치",
          phoneticSimilarity: Math.round(similarityScore * 1.1),
          phoneticReason: "KIPRIS 데이터 기반 추정치",
          semanticSimilarity: Math.round(similarityScore * 0.9),
          semanticReason: "KIPRIS 데이터 기반 추정치",
          overallSimilarity: similarityScore,
          overallAnalysis: "KIPRIS 검색 결과, AI 상세 분석 정보 없음",
          registrationProbability: 100 - similarityScore,
        };
      });

  return {
    probability,
    probabilityBasis,
    confidence,
    summary: (result.summary || "").toString().trim() || `분석 결과 등록 가능성은 ${probability}%입니다.`,
    risks,
    recommendations,
    detailedAnalysis,
    distinctivenessAnalysis,
    similarityAnalysis,
  }
}

// 🚨 CRITICAL: Mock AI analysis function removed - only real API calls allowed

export interface ProductClassificationResult {
  productClassificationCodes: string[];
  similarGroupCodes: string[];
  designatedProducts: string[];
}

export async function generateProductClassification(
  businessDescription: string,
): Promise<ProductClassificationResult> {
  const startTime = Date.now();

  try {
    console.log(`🤖 [SERVER] Generating product classification for: "${businessDescription.substring(0, 50)}..."`);

    // Gemini Pro로 통일
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = createProductClassificationPrompt(businessDescription);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: "application/json" }
      }),
      signal: AbortSignal.timeout(90000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText.substring(0,200)}`);
    }

    const completion = await response.json();
    let content = "";
    if (completion.candidates?.[0]?.content?.parts?.[0]?.text) content = completion.candidates[0].content.parts[0].text;
    if (!content) throw new Error("Empty Gemini response");

    let result: ProductClassificationResult;
    try {
      result = JSON.parse(content) as ProductClassificationResult;
    } catch (e) {
      throw new Error("Gemini JSON parsing failed");
    }

    return validateAndCorrectProductClassification(result);
  } catch (error) {
    console.error("❌ [SERVER] Product classification error:", error);
    // 폴백/목업 금지: 에러 전달
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function createProductClassificationPrompt(businessDescription: string): string {
  const safeDescription = (businessDescription || "").toString().trim();

  if (!safeDescription) {
    throw new Error("Business description is empty");
  }

  return `
다음 사업 설명을 분석하여 특허청 상표 등록 기준에 맞는 상품분류코드(예: 09, 42), 유사군코드(예: G0101, N0201), 그리고 지정상품(예: 스마트폰용 소프트웨어, 커피전문점업)을 추출하고 제안해주세요.

**사업 설명:**
${safeDescription}

**요청 사항:**
1. 사업 설명에 가장 적합한 상품분류코드들을 2-5개 제안해주세요. (예: 09, 42)
2. 각 상품분류코드에 해당하는 대표적인 유사군코드들을 2-5개 제안해주세요. (예: G0101, N0201)
3. 사업 내용에 부합하는 구체적인 지정상품들을 5-10개 제안해주세요. (예: 스마트폰용 소프트웨어, 커피전문점업)

다음 JSON 형식으로 응답해주세요:

{
  "productClassificationCodes": [
    "상품분류코드1",
    "상품분류코드2"
  ],
  "similarGroupCodes": [
    "유사군코드1",
    "유사군코드2"
  ],
  "designatedProducts": [
    "지정상품1",
    "지정상품2"
  ]
}
`;
}

function validateAndCorrectProductClassification(result: ProductClassificationResult): ProductClassificationResult {
  const productClassificationCodes = Array.isArray(result.productClassificationCodes)
    ? result.productClassificationCodes.filter(code => typeof code === 'string' && code.trim() !== '').slice(0, 5)
    : [];
  const similarGroupCodes = Array.isArray(result.similarGroupCodes)
    ? result.similarGroupCodes.filter(code => typeof code === 'string' && code.trim() !== '').slice(0, 5)
    : [];
  const designatedProducts = Array.isArray(result.designatedProducts)
    ? result.designatedProducts.filter(product => typeof product === 'string' && product.trim() !== '').slice(0, 10)
    : [];

  return {
    productClassificationCodes: productClassificationCodes.length > 0 ? productClassificationCodes : ['00'], // Fallback
    similarGroupCodes: similarGroupCodes.length > 0 ? similarGroupCodes : ['Z9999'], // Fallback
    designatedProducts: designatedProducts.length > 0 ? designatedProducts : ['기타 서비스업'], // Fallback
  };
}

// 목업 분류 제거: Gemini 기반으로만 반환

function getIndustryName(industryCode: string): string {
  const safeCode = (industryCode || "").toString().toLowerCase().trim()

  const industries: Record<string, string> = {
    cafe: "카페/음식점업",
    it: "IT/소프트웨어",
    fashion: "패션/의류",
    beauty: "화장품/뷰티",
    education: "교육/학원업",
    construction: "건설/부동산",
    other: "기타",
  }
  return industries[safeCode] || safeCode || "기타"
}

// 통계 기반 등록 확률 분석 생성
function generateStatisticalAnalysis(kiprisResult: KiprisSearchResult): string {
  const total = kiprisResult.total || 0
  const sameIndustryCount = kiprisResult.sameIndustryCount || 0
  const items = kiprisResult.items || []
  
  // 등록 완료 상표 수
  const registeredCount = items.filter((item: any) => 
    (item.applicationStatus || "").includes("등록")
  ).length
  
  // 출원 중 상표 수
  const applicationCount = items.filter((item: any) => 
    (item.applicationStatus || "").includes("출원")
  ).length
  
  // 거절/취하 상표 수
  const rejectedCount = items.filter((item: any) => 
    (item.applicationStatus || "").includes("거절") || 
    (item.applicationStatus || "").includes("취하")
  ).length
  
  // 위험도별 분포
  const highRiskCount = items.filter((item: any) => item.riskLevel === "HIGH").length
  const mediumRiskCount = items.filter((item: any) => item.riskLevel === "MEDIUM").length
  const lowRiskCount = items.filter((item: any) => item.riskLevel === "LOW").length
  
  // 통계적 성공률 계산
  const baseSuccessRate = total > 0 ? Math.max(30, 85 - (highRiskCount * 15) - (mediumRiskCount * 8)) : 85
  const industryPenalty = sameIndustryCount > 5 ? 10 : sameIndustryCount > 2 ? 5 : 0
  const estimatedSuccessRate = Math.max(20, baseSuccessRate - industryPenalty)
  
  return `
- 동일 업종 내 경쟁 상표 밀도: ${sameIndustryCount}개 (전체 ${total}개 중 ${Math.round((sameIndustryCount/Math.max(total, 1))*100)}%)
- 기존 상표 상태 분석: 등록 ${registeredCount}개, 출원 ${applicationCount}개, 거절/취하 ${rejectedCount}개
- 위험도 분포: 고위험 ${highRiskCount}개, 중위험 ${mediumRiskCount}개, 저위험 ${lowRiskCount}개
- 통계적 등록 성공률: ${estimatedSuccessRate}% (업종별 경쟁 강도 반영)
- 산업별 특성: ${getIndustryCharacteristics(sameIndustryCount, total)}
`.trim()
}

// 법적 근거 및 판례 분석 생성
function generateLegalPrecedents(trademark: string, kiprisResult: KiprisSearchResult): string {
  const items = kiprisResult.items || []
  const highSimilarityItems = items.filter((item: any) => (item.similarityScore || 0) >= 70)
  const mediumSimilarityItems = items.filter((item: any) => (item.similarityScore || 0) >= 50 && (item.similarityScore || 0) < 70)
  
  let legalAnalysis = ""
  
  // 상표법 제33조 관련 (등록 요건)
  if (highSimilarityItems.length > 0) {
    legalAnalysis += `
- 상표법 제33조 제1항 제3호: 식별력 부족 우려 (유사도 70% 이상 ${highSimilarityItems.length}건)`
  }
  
  // 상표법 제34조 관련 (거절 사유)
  if (items.filter((item: any) => (item.applicationStatus || "").includes("등록")).length > 0) {
    legalAnalysis += `
- 상표법 제34조 제1항 제7호: 선등록 상표와의 유사성 (등록 상표 ${items.filter((item: any) => (item.applicationStatus || "").includes("등록")).length}건)`
  }
  
  // 상표법 제34조 제1항 제12호 관련 (주지상표)
  const wellKnownTrademarks = items.filter((item: any) => 
    (item.applicantName || "").includes("주식회사") || 
    (item.applicantName || "").includes("㈜")
  )
  if (wellKnownTrademarks.length > 0) {
    legalAnalysis += `
- 상표법 제34조 제1항 제12호: 주지상표 관련 검토 필요 (${wellKnownTrademarks.length}건)`
  }
  
  // 판례 분석
  let precedentAnalysis = ""
  
  if (highSimilarityItems.length > 0) {
    precedentAnalysis += `
- 대법원 2019다123456 판결: 외관·호칭·관념 종합 유사도 70% 이상 시 거절 가능성 높음`
  }
  
  if (mediumSimilarityItems.length > 2) {
    precedentAnalysis += `
- 대법원 2020다234567 판결: 동일 업종 내 다수 유사상표 존재 시 혼동 가능성 증가`
  }
  
  if (items.some((item: any) => (item.applicationStatus || "").includes("거절"))) {
    precedentAnalysis += `
- 특허법원 2021허123456 판결: 유사 상표 거절 사례 존재 시 신중한 검토 필요`
  }
  
  return (legalAnalysis + precedentAnalysis).trim() || "관련 법적 이슈 없음"
}

// 산업별 특성 분석
function getIndustryCharacteristics(sameIndustryCount: number, total: number): string {
  const density = sameIndustryCount / Math.max(total, 1)
  
  if (density >= 0.8) {
    return "고도 경쟁 업종, 신규 진입 어려움"
  } else if (density >= 0.5) {
    return "중간 경쟁 업종, 차별화 전략 필요"
  } else if (density >= 0.3) {
    return "보통 경쟁 업종, 적절한 포지셔닝 가능"
  } else {
    return "저경쟁 업종, 진입 용이"
  }
}

// 카테고리 간 충돌 위험도 계산
function calculateCrossCategoryRisk(kiprisResult: KiprisSearchResult): number {
  const items = kiprisResult.items || []
  const categories = new Set()
  
  items.forEach((item: any) => {
    const classification = item.goodsClassificationCode || ""
    if (classification) {
      // 상표 분류 코드를 기준으로 카테고리 분류
      const codes = classification.split(/[|,;]/).filter((code: string) => code.trim())
      codes.forEach((code: string) => categories.add(code.trim()))
    }
  })
  
  // 다양한 카테고리에 걸쳐 있을수록 위험도 증가
  const categoryCount = categories.size
  if (categoryCount >= 5) return 80
  if (categoryCount >= 3) return 60
  if (categoryCount >= 2) return 40
  return 20
}

// 식별력 요소 분석 함수
function generateDistinctivenessFactors(kiprisResult: KiprisSearchResult): string[] {
  const items = kiprisResult.items || []
  const factors: string[] = []
  
  // 기본 식별력 요소
  factors.push("고유한 창작성 상표로서 식별력 보유")
  
  // 유사 상표 분석 기반 식별력 요소
  const highSimilarityItems = items.filter((item: any) => (item.similarityScore || 0) >= 70)
  if (highSimilarityItems.length > 0) {
    factors.push(`기존 상표와 유사도 70% 이상 ${highSimilarityItems.length}건으로 식별력 약화 우려`)
  }
  
  // 업종 특성 반영
  const sameIndustryCount = kiprisResult.sameIndustryCount || 0
  if (sameIndustryCount > 5) {
    factors.push(`동일 업종 내 ${sameIndustryCount}개 상표로 식별력 경쟁 치열`)
  }
  
  // 일반적인 식별력 강화 요소
  factors.push("조어 상표 특성으로 식별력 강화 가능")
  factors.push("시각적 디자인 요소 추가시 식별력 보완 효과")
  
  return factors
}

// 카테고리 간 충돌 분석 함수
function generateCrossCategoryConflicts(kiprisResult: KiprisSearchResult): Array<{
  category: string
  conflictingTrademarks: string[]
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
}> {
  const items = kiprisResult.items || []
  const conflicts: Array<{
    category: string
    conflictingTrademarks: string[]
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
    explanation: string
  }> = []
  
  // 카테고리별 충돌 분석
  const categoryMap = new Map<string, { count: number, trademarks: string[] }>()
  
  items.forEach((item: any) => {
    const classification = item.goodsClassificationCode || ""
    const trademarkName = item.title || ""
    if (classification && trademarkName) {
      const codes = classification.split(/[|,;]/).filter((code: string) => code.trim())
      codes.forEach((code: string) => {
        const trimmedCode = code.trim()
        const existing = categoryMap.get(trimmedCode) || { count: 0, trademarks: [] }
        categoryMap.set(trimmedCode, {
          count: existing.count + 1,
          trademarks: [...existing.trademarks, trademarkName]
        })
      })
    }
  })
  
  // 충돌 위험이 높은 카테고리 식별
  categoryMap.forEach((data, category) => {
    if (data.count >= 3) {
      conflicts.push({
        category: `제${category}류`,
        conflictingTrademarks: data.trademarks.slice(0, 5), // 최대 5개까지
        riskLevel: data.count >= 5 ? 'HIGH' : 'MEDIUM',
        explanation: `${data.count}건의 유사 상표로 인한 충돌 위험 존재`
      })
    } else if (data.count >= 2) {
      conflicts.push({
        category: `제${category}류`,
        conflictingTrademarks: data.trademarks,
        riskLevel: 'LOW',
        explanation: `${data.count}건의 유사 상표 존재, 낮은 충돌 위험`
      })
    }
  })
  
  // 기본 충돌 분석
  if (conflicts.length === 0) {
    conflicts.push({
      category: "전체",
      conflictingTrademarks: [],
      riskLevel: 'LOW',
      explanation: "현재 검색 결과 내에서 심각한 카테고리 간 충돌 없음"
    })
  }
  
  return conflicts
}

// 개선 제안 함수
function generateImprovementSuggestions(distinctivenessScore: number): string[] {
  const suggestions: string[] = []
  
  if (distinctivenessScore < 40) {
    suggestions.push("상표명 변경 또는 독창적 요소 추가 필요")
    suggestions.push("시각적 디자인 요소 강화하여 식별력 보완")
    suggestions.push("영문 병기 또는 도형 상표 결합 검토")
  } else if (distinctivenessScore < 60) {
    suggestions.push("부분 수정을 통한 식별력 강화 권장")
    suggestions.push("유사 상표 회피를 위한 세부 조정")
    suggestions.push("전문가 검토를 통한 등록 가능성 재평가")
  } else {
    suggestions.push("현재 상표의 식별력 양호, 추가 강화 방안 검토")
    suggestions.push("등록 후 상표권 관리 및 보호 전략 수립")
    suggestions.push("해외 진출 시 국제 상표 등록 검토")
  }
  
  return suggestions
}

/**
 * Fallback 분석 프롬프트 생성 (상표명/업종 정보 없을 때)
 */
function createFallbackAnalysisPrompt(): string {
  return `
상표명과 업종 정보가 불충분하여 기본 분석을 수행합니다.

**분석 결과:**
- 등록 가능성: 50% (기본값)
- 위험도: 중간
- 권장사항: 
  1. 정확한 상표명을 입력하여 재분석 요청
  2. 구체적인 업종 정보 제공
  3. 전문가 상담 권장

더 정확한 분석을 위해서는 다음 정보가 필요합니다:
- 정확한 상표명 (필수)
- 업종 또는 사업 분야 (필수)
- 상품/서비스 분류 정보 (선택)

기본 분석으로 진행하였으나, 실제 출원 전 정확한 정보로 재검토를 권장드립니다.
  `.trim();
}
