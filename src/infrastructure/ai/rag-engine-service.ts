import { VertexAI } from "@google-cloud/vertexai";

// --- 1. GCP 프로젝트 및 RAG Engine 정보 설정 ---
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION;
const RAG_CORPUS_ID = process.env.GCP_RAG_CORPUS_ID;

const RAG_CORPUS_RESOURCE_NAME = `projects/${PROJECT_ID}/locations/${LOCATION}/ragCorpora/${RAG_CORPUS_ID}`;

// --- 2. LLM 모델 및 Reranker 모델 이름 설정 ---
const MODEL_NAME = "gemini-2.5-pro";
const RANKER_MODEL_NAME = "semantic-ranker-default@latest";

// --- 3. Vertex AI 초기화 (기존 패턴 따라하기) ---
let vertex_ai: VertexAI;
let generativeModel: any;

function initializeVertexAI() {
  try {
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

    if (credentialsBase64) {
      // Follow the working pattern: write credentials to temp file and set GOOGLE_APPLICATION_CREDENTIALS
      const credentials = JSON.parse(
        Buffer.from(credentialsBase64, "base64").toString()
      );
      const fs = require("fs");
      const path = require("path");
      const os = require("os");

      // Create temp credentials file
      const tempDir = os.tmpdir();
      const credentialsPath = path.join(
        tempDir,
        `gcp-credentials-${Date.now()}.json`
      );
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));

      // Set environment variable that VertexAI library will use
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

      console.log(
        "🔑 [RAG Engine] Using service account credentials via temp file"
      );
    } else {
      console.log("🔑 [RAG Engine] Using default credentials");
    }

    vertex_ai = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });

    generativeModel = vertex_ai.getGenerativeModel({ model: MODEL_NAME });

    console.log("✅ [RAG Engine] Vertex AI initialized successfully");
  } catch (error) {
    console.error("❌ [RAG Engine] Failed to initialize Vertex AI:", error);
    throw error;
  }
}

// --- 4. 시스템 프롬프트 설정 ---
const systemInstructionText = `너는 상표출원을 도와주는 10년차 전문 변리사야. 항상 전문적이고 신뢰감을 주는 말투를 사용하며, 고객에게 핵심적인 추천과 함께 가능한 차선책까지 제시하여 완벽한 상표 전략을 제안해야 한다.

[절대 규칙: Grounding Rule]
너의 가장 중요한 임무는 '제공된 데이터(Context)' 내에 존재하는 정보만을 사용하여 답변하는 것이다. 특히 'product_name'(지정상품) 목록을 생성할 때는, 제공된 데이터 안에 명시적으로 존재하는 단어를 그대로, 절대 왜곡하거나 추론하여 만들지 말아야 한다. 만약 제공된 데이터에서 10개를 채울 수 없다면, 찾은 만큼만 나열해야 한다. 상품업은 1류~34류, 서비스업은 35류~45류에 해당된다.


고객이 자신의 사업에 대한 설명을 입력하면, 너는 다음의 엄격한 2단계 추론 프로세스를 수행해야 한다.

[1단계: 사업 본질 분석 (내부적 사고 과정)]
반드시 다음의 질문에 먼저 스스로 답변하고 그 답변을 바탕으로 2단계를 진행하라. 이 과정은 최종 답변에 표시하지 않는다.
1. 고객 설명에서 가장 핵심적인 '행위'를 나타내는 단어는 무엇인가? (예: 판매, 제조, 교육, 상담)
2. 그 행위는 '서비스업' 키워드('판매업', '도소매업'...) 목록에 포함되거나 유사한 의미를 가지는가? (예/아니요)
3. 따라서 이 사업의 **핵심적인 본질(주된 분류)**은 '상품업(1~34류)'인가, '서비스업(35~45류)'인가?
4. 만약 3번의 주된 분류 외에, 명백하게 고려해볼 만한 **'차선책' 분류(보조 분류)**가 존재하는가? (예: '의류 판매업'의 주된 분류는 '서비스업'이지만, '의류' 자체는 '상품업'이라는 차선책이 존재함) (예/아니요)

[2단계: 제한적 검색 및 전문가 답변 생성]
1단계 분석 결과를 바탕으로 답변을 생성한다.
- 먼저, '3번 질문(주된 분류)'의 답변에 따라 해당 분류(1~34류 또는 35~45류) 내에서 가장 유사한 'similar_group_code'와 'product_name' 10개를 찾아 'primary_recommendation' 부분을 완성한다. **이 때, 'product_name' 목록은 [절대 규칙]을 반드시 준수하여 생성한다.**
- 만약 '4번 질문(차선책 분류)'의 답변이 '예'라면, 차선책 분류에 대해서도 동일하게 가장 유사한 'similar_group_code'와 'product_name' 10개를 찾아 'secondary_recommendation' 부분을 완성한다. **이 때, 'product_name' 목록은 [절대 규칙]을 반드시 준수하여 생성한다.** 차선책이 없다면 이 부분은 'null'로 처리한다.
- 마지막으로, 이 모든 분석을 종합하여 전문가의 최종 조언을 'professional_advice' 부분에 작성한다.

[출력 형식]
{
  "summary": "고객 설명의 핵심 내용을 1~2 문장으로 요약",
  "primary_recommendation": {
    "recommendation_type": "주요 추천",
    "analysis": {
      "business_type": "1단계에서 판단한 '주된' 사업 분류",
      "reason": "왜 이것이 주된 사업 분류인지에 대한 핵심 이유",
      "class_code": "추천된 상품류 코드",
      "similar_group_code": "가장 유사한 유사군 코드"
    },
    "recommended_products": [
      "추천 지정상품 1", "추천 지정상품 2", "추천 지정상품 3", "추천 지정상품 4", "추천 지정상품 5", "추천 지정상품 6", "추천 지정상품 7", "추천 지정상품 8", "추천 지정상품 9", "추천 지정상품 10"
    ]
  },
  "secondary_recommendation": {
    "recommendation_type": "차선책 추천 (권리범위 확장)",
    "analysis": {
      "business_type": "1단계에서 판단한 '보조' 사업 분류",
      "reason": "왜 이 분류도 함께 고려해야 하는지에 대한 핵심 이유",
      "class_code": "추천된 상품류 코드",
      "similar_group_code": "가장 유사한 유사군 코드"
    },
    "recommended_products": [
      "추천 지정상품 1", "추천 지정상품 2", "추천 지정상품 3", "추천 지정상품 4", "추천 지정상품 5", "추천 지정상품 6", "추천 지정상품 7", "추천 지정상품 8", "추천 지정상품 9", "추천 지정상품 10"
    ]
  },
  "professional_advice": "10년차 변리사로서, 주요 추천과 차선책 추천을 종합하여 고객이 어떻게 상표 전략을 수립해야 하는지에 대한 최종적이고 전문적인 조언. 두 분류를 함께 출원했을 때의 시너지 효과 등을 설명."
}`;

// --- 5. RAG Retrieval Tool 및 Rerank 설정 ---
const ragTool = {
  retrieval: {
    disableAttribution: false,
    vertexRagStore: {
      ragResources: [
        {
          ragCorpus: RAG_CORPUS_RESOURCE_NAME,
        },
      ],
      ragRetrievalConfig: {
        topK: 20, // 검색할 상위 컨텍스트 개수
        ranking: {
          rankService: {
            modelName: RANKER_MODEL_NAME, // Reranker 모델 이름
          },
        },
      },
    },
  },
};

// --- 6. Generation Config 설정 ---
const generationConfig = {
  maxOutputTokens: 65535,
  temperature: 1,
  topP: 0.95,
};

// --- 7. Safety Settings 설정 ---
const safetySettings = [
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
];

// --- 8. System Instruction 설정 ---
const systemInstruction = {
  parts: [{ text: systemInstructionText }],
};

// --- 7. 응답 타입 정의 ---
export interface RAGRecommendation {
  recommendation_type: string;
  analysis: {
    business_type: string;
    reason: string;
    class_code: string;
    similar_group_code: string;
  };
  recommended_products: string[];
}

export interface RAGEngineResponse {
  summary: string;
  primary_recommendation: RAGRecommendation;
  secondary_recommendation: RAGRecommendation | null;
  professional_advice: string;
}

// --- 8. RAG Engine Service 클래스 ---
export class RAGEngineService {
  private initialized = false;

  /**
   * Vertex AI 초기화 (한 번만 실행)
   */
  private async ensureInitialized() {
    if (!this.initialized) {
      initializeVertexAI();
      this.initialized = true;
    }
  }

  /**
   * 사업 설명을 기반으로 RAG Engine을 통해 유사군 코드 및 지정상품 추천
   * @param businessDescription 사용자의 사업 설명
   * @returns 구조화된 추천 결과
   */
  public async analyzeBusinessDescription(
    businessDescription: string
  ): Promise<RAGEngineResponse> {
    if (!businessDescription || businessDescription.trim().length === 0) {
      throw new Error("사업 설명은 비어있을 수 없습니다.");
    }

    // Vertex AI 초기화 확인
    await this.ensureInitialized();

    console.log(
      `🚀 [RAG Engine] Starting analysis for: "${businessDescription.substring(
        0,
        100
      )}..."`
    );
    const startTime = Date.now();

    try {
      const request = {
        contents: [{ role: "user", parts: [{ text: businessDescription }] }],
        generationConfig: generationConfig,
        safetySettings: safetySettings,
        tools: [ragTool],
        systemInstruction: systemInstruction,
      };

      console.log(
        `📡 [RAG Engine] Sending query to Vertex AI with RAG corpus: ${RAG_CORPUS_ID}`
      );

      // 타임아웃 설정 (60초)
      const TIMEOUT_MS = 60000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RAG Engine timeout after 60 seconds')), TIMEOUT_MS);
      });

      // 스트리밍 응답 처리 with timeout
      const streamingRespPromise = generativeModel.generateContentStream(request);
      const streamingResp = await Promise.race([streamingRespPromise, timeoutPromise]) as any;

      let fullResponse = "";
      let chunkCount = 0;
      console.log('📦 [RAG Engine] Starting to receive streaming chunks...');
      
      for await (const chunk of streamingResp.stream) {
        chunkCount++;
        console.log(`📦 [RAG Engine] Received chunk #${chunkCount}`);
        
        if (
          chunk.candidates &&
          chunk.candidates[0] &&
          chunk.candidates[0].content &&
          chunk.candidates[0].content.parts &&
          chunk.candidates[0].content.parts[0] &&
          chunk.candidates[0].content.parts[0].text
        ) {
          const text = chunk.candidates[0].content.parts[0].text;
          fullResponse += text;
          console.log(`📝 [RAG Engine] Chunk #${chunkCount} text length: ${text.length}`);
        } else {
          console.warn(`⚠️ [RAG Engine] Chunk #${chunkCount} has no text content:`, JSON.stringify(chunk, null, 2));
        }
      }
      
      console.log(`✅ [RAG Engine] Streaming complete. Total chunks: ${chunkCount}, Total response length: ${fullResponse.length}`);

      const executionTime = Date.now() - startTime;
      console.log(`✅ [RAG Engine] Analysis completed in ${executionTime}ms`);
      console.log(
        `📄 [RAG Engine] Full response length: ${fullResponse.length} characters`
      );

      // JSON 응답 파싱
      const parsedResponse = this.parseRAGResponse(fullResponse);

      console.log(`🎯 [RAG Engine] Successfully parsed response:`);
      console.log(
        `   - Primary class: ${parsedResponse.primary_recommendation.analysis.class_code}`
      );
      console.log(
        `   - Primary similar group: ${parsedResponse.primary_recommendation.analysis.similar_group_code}`
      );
      console.log(
        `   - Secondary available: ${
          parsedResponse.secondary_recommendation ? "Yes" : "No"
        }`
      );

      return parsedResponse;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(
        `❌ [RAG Engine] Analysis failed after ${errorTime}ms:`,
        error
      );
      throw new Error(
        `RAG Engine 분석 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }

  /**
   * RAG Engine 응답을 구조화된 객체로 파싱
   */
  private parseRAGResponse(rawResponse: string): RAGEngineResponse {
    try {
      // JSON 블록 추출 (```json...``` 또는 {...} 형태)
      const jsonMatch =
        rawResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
        rawResponse.match(/(\{[\s\S]*\})/);

      if (!jsonMatch) {
        throw new Error("응답에서 JSON 형식을 찾을 수 없습니다.");
      }

      const jsonString = jsonMatch[1];
      const parsed = JSON.parse(jsonString) as RAGEngineResponse;

      // 필수 필드 검증
      if (
        !parsed.summary ||
        !parsed.primary_recommendation ||
        !parsed.professional_advice
      ) {
        throw new Error("응답에 필수 필드가 누락되었습니다.");
      }

      return parsed;
    } catch (error) {
      console.error("❌ [RAG Engine] Failed to parse response:", error);
      console.error("Raw response:", rawResponse);

      // 폴백 응답 생성
      return this.createFallbackResponse();
    }
  }

  /**
   * 파싱 실패 시 폴백 응답 생성
   */
  private createFallbackResponse(): RAGEngineResponse {
    const fallbackRecommendation: RAGRecommendation = {
      recommendation_type: "주요 추천",
      analysis: {
        business_type: "분석 실패",
        reason: "RAG Engine 응답을 파싱할 수 없습니다.",
        class_code: "Unknown",
        similar_group_code: "Unknown",
      },
      recommended_products: ["수동 분석 필요"],
    };

    return {
      summary: "RAG Engine 응답 파싱에 실패했습니다. 수동 검토가 필요합니다.",
      primary_recommendation: fallbackRecommendation,
      secondary_recommendation: null,
      professional_advice:
        "시스템 오류로 인해 정확한 분석을 제공할 수 없습니다. 전문가의 수동 검토를 권장합니다.",
    };
  }

  /**
   * RAG Engine 연결 상태 확인
   */
  public async healthCheck(): Promise<boolean> {
    try {
      console.log("🔍 [RAG Engine] Performing health check...");

      const testQuery = "테스트용 간단한 사업 설명입니다.";
      const response = await this.analyzeBusinessDescription(testQuery);

      const isHealthy =
        Boolean(response.summary) &&
        Boolean(response.primary_recommendation) &&
        Boolean(response.professional_advice) &&
        response.primary_recommendation.analysis.class_code !== "Unknown";

      console.log(
        `💚 [RAG Engine] Health check ${isHealthy ? "passed" : "failed"}`
      );

      return isHealthy;
    } catch (error) {
      console.error("💔 [RAG Engine] Health check failed:", error);
      return false;
    }
  }
}

// --- 9. 싱글톤 인스턴스 생성 ---
let ragEngineInstance: RAGEngineService | null = null;

export function createRAGEngineService(): RAGEngineService {
  if (!ragEngineInstance) {
    ragEngineInstance = new RAGEngineService();
    console.log("🏗️ [RAG Engine] Service instance created");
  }
  return ragEngineInstance;
}

// --- 10. 편의 함수 export ---
export async function generateContentWithRAG(
  businessDescription: string
): Promise<RAGEngineResponse> {
  const service = createRAGEngineService();
  return service.analyzeBusinessDescription(businessDescription);
}
