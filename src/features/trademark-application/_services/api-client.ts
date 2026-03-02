import type { TrademarkApplicationFormData, TrademarkApplicationResponse } from "../_types"

export async function submitTrademarkApplication(
  formData: TrademarkApplicationFormData
): Promise<TrademarkApplicationResponse> {
  try {
    const response = await fetch("/api/trademark-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "상표 출원 신청 처리에 실패했습니다.")
    }

    return result
  } catch (error) {
    console.error("❌ Trademark application submission failed:", error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error("알 수 없는 오류가 발생했습니다.")
  }
}