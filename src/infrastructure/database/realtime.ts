import { createClient } from "./client"

export interface TrademarkSearchUpdate {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  risk_score?: number
  risk_level?: "LOW" | "MEDIUM" | "HIGH"
  updated_at: string
}

// 특정 검색의 진행 상황을 실시간으로 구독
export function subscribeToSearchProgress(
  searchId: string,
  onUpdate: (update: TrademarkSearchUpdate) => void,
  onError?: (error: any) => void,
) {
  const supabase = createClient()
  const subscription = supabase
    .channel(`search-${searchId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "trademark_searches",
        filter: `id=eq.${searchId}`,
      },
      (payload: any) => {
        console.log("실시간 업데이트:", payload)
        onUpdate(payload.new as TrademarkSearchUpdate)
      },
    )
    .on("postgres_changes", { event: "*", schema: "public" }, (error: any) => {
      console.error("구독 에러:", error)
      onError?.(error)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}
