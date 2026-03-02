import { createClient } from "@/infrastructure/database/server"
import { cookies } from "next/headers"
import type { KiprisSearchResult, KiprisTrademarkInfo } from "@/infrastructure/external/server-kipris-api"
import type { AIAnalysisResult } from "@/infrastructure/ai/server-ai-analysis"

// 키프리스 검색 결과 저장
export async function saveKiprisResults(
  searchId: string,
  kiprisResult: KiprisSearchResult,
  rawData?: any,
  searchQuery?: string,
) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // 1. 키프리스 검색 결과 요약 저장
    const { data: kiprisRecord, error: kiprisError } = await supabase
      .schema("trademark").from("kipris_search_results")
      .insert({
        trademark_search_id: searchId,
        total_found: kiprisResult.total,
        same_industry_count: kiprisResult.sameIndustryCount,
        risk_score: kiprisResult.riskScore,
        risk_level: kiprisResult.riskLevel.toUpperCase(),
        raw_data: rawData || null,
        processed_data: kiprisResult,
        search_query: searchQuery || null,
      })
      .select()
      .single()

    if (kiprisError) {
      console.error("❌ Failed to save KIPRIS results:", kiprisError)
      return null
    }

    // 2. 개별 유사 상표 정보 저장
    if (kiprisResult.items && kiprisResult.items.length > 0) {
      const similarTrademarks = kiprisResult.items.map((item: KiprisTrademarkInfo) => ({
        trademark_search_id: searchId,
        kipris_application_number: item.applicationNumber || null,
        trademark_name: item.title || "",
        applicant: item.applicantName || null,
        application_date: item.applicationDate ? new Date(item.applicationDate) : null,
        registration_date: item.registrationDate ? new Date(item.registrationDate) : null,
        registration_number: item.registrationNumber || null,
        goods_classification_code: item.goodsClassificationCode || null,
        trademark_status: item.applicationStatus || null,
        similarity_score: item.similarityScore || 0,
        risk_level: (item.similarityScore || 0) > 70 ? "HIGH" : (item.similarityScore || 0) > 50 ? "MEDIUM" : "LOW",
      }))

      const { error: trademarksError } = await supabase.schema("ai_analysis").from("similar_trademarks").insert(similarTrademarks)

      if (trademarksError) {
        console.error("❌ Failed to save similar trademarks:", trademarksError)
      } else {
        console.log(`✅ Saved ${similarTrademarks.length} similar trademarks`)
      }

      // 3. 의견제출통지서(있다면) 저장 - application_number 기준
      try {
        const noticesToUpsert = kiprisResult.items
          .filter((item: KiprisTrademarkInfo) => !!item.pdfFileUrl || !!item.rejectionReason)
          .map((item: KiprisTrademarkInfo) => ({
            session_id: searchId,
            similar_trademark_id: null,
            application_number: item.applicationNumber || item.registrationNumber || '',
            decision_number: (item as any).decisionNumber || null,
            doc_name: item.docName || '의견제출통지서',
            rejection_reason: item.rejectionReason || null,
            rejection_reason_summary: item.rejectionReasonSummary || null,
            legal_ground: item.legalGround || null,
            pdf_file_url: item.pdfFileUrl || null,
            rejection_date: (item as any).rejectionDate || null,
            raw_text: null,
            extracted_summary: null,
            key_phrases: null,
          }))
          .filter((n: any) => n.application_number);

        if (noticesToUpsert.length > 0) {
          const { error: noticeError } = await supabase
            .from('rejection_notices')
            .upsert(noticesToUpsert, { onConflict: 'session_id,application_number,doc_name' });
          if (noticeError) {
            console.warn('⚠️ Failed to upsert rejection notices:', noticeError);
          } else {
            console.log(`✅ Upserted ${noticesToUpsert.length} rejection notices`);
          }
        }
      } catch (noticeSaveError) {
        console.warn('⚠️ Error while saving rejection notices:', noticeSaveError);
      }
    }

    console.log("✅ KIPRIS results saved successfully")
    return kiprisRecord
  } catch (error) {
    console.error("❌ Error saving KIPRIS results:", error)
    return null
  }
}

// AI 분석 결과 저장
export async function saveAIAnalysisResults(
  searchId: string,
  aiResult: AIAnalysisResult,
  promptUsed?: string,
  rawResponse?: string,
  processingTime?: number,
  tokenUsage?: any,
) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: aiRecord, error: aiError } = await supabase
      .schema("ai_analysis").from("ai_analysis_results")
      .insert({
        trademark_search_id: searchId,
        model_used: "gpt-4o-mini",
        prompt_used: promptUsed || null,
        raw_response: rawResponse || null,
        parsed_result: aiResult,
        probability: aiResult.probability,
        confidence: aiResult.confidence,
        processing_time_ms: processingTime || null,
        token_usage: tokenUsage || null,
      })
      .select()
      .single()

    if (aiError) {
      console.error("❌ Failed to save AI analysis results:", aiError)
      return null
    }

    console.log("✅ AI analysis results saved successfully")
    return aiRecord
  } catch (error) {
    console.error("❌ Error saving AI analysis results:", error)
    return null
  }
}

// 상세 분석 결과 조회
export async function getDetailedAnalysisResults(searchId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // 기본 검색 정보
    const { data: searchData, error: searchError } = await supabase
      .schema("trademark").from("trademark_searches")
      .select("*")
      .eq("id", searchId)
      .single()

    if (searchError) {
      throw new Error(`Search not found: ${searchError.message}`)
    }

    // 키프리스 결과
    const { data: kiprisData, error: kiprisError } = await supabase
      .schema("trademark").from("kipris_search_results")
      .select("*")
      .eq("trademark_search_id", searchId)
      .single()

    // AI 분석 결과
    const { data: aiData, error: aiError } = await supabase
      .schema("ai_analysis").from("ai_analysis_results")
      .select("*")
      .eq("trademark_search_id", searchId)
      .single()

    // 유사 상표 목록
    const { data: similarTrademarks, error: trademarksError } = await supabase
      .schema("ai_analysis").from("similar_trademarks")
      .select("*")
      .eq("trademark_search_id", searchId)
      .order("similarity_score", { ascending: false })

    return {
      search: searchData,
      kipris: kiprisData || null,
      ai: aiData || null,
      similarTrademarks: similarTrademarks || [],
      errors: {
        kipris: kiprisError?.message,
        ai: aiError?.message,
        trademarks: trademarksError?.message,
      },
    }
  } catch (error) {
    console.error("❌ Error getting detailed analysis results:", error)
    throw error
  }
}
