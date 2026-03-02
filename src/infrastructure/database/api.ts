import { createClient } from "./client"
import type { Database } from "@/types/supabase-generated"
import type { TrademarkSearch, AnalysisWaitlist, ServicePreBooking } from "@/shared/types/database"
import { savePreBookingLocally, checkEmailDuplicate, type MockServicePreBooking } from "./fallback"

const supabase = createClient()

// Type-safe table access
type PublicTables = Database['public']['Tables']
type ServicePreBookingRow = PublicTables['service_pre_bookings']['Row']
type ServicePreBookingInsert = PublicTables['service_pre_bookings']['Insert']

// Supabase 연결 상태 확인
async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("service_pre_bookings").select("id").limit(1)
    return !error
  } catch (error) {
    console.warn("Supabase 연결 실패:", error)
    return false
  }
}

// Device Info 타입 정의 (JSONB 필드 구체화)
interface DeviceInfo {
  userAgent?: string
  platform?: string
  language?: string
  screenResolution?: string
  timezone?: string
  referrer?: string
}

// 상표 검색 생성
export async function createTrademarkSearch(data: {
  trademark: string
  industry: string
  device_info?: DeviceInfo
}) {
  const isConnected = await checkSupabaseConnection()

  if (!isConnected) {
    // 폴백: 로컬 mock 데이터 반환
    return {
      id: `mock_${Date.now()}`,
      ...data,
      status: "pending" as const,
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as TrademarkSearch
  }

  const { data: search, error } = await supabase.schema("trademark").from("trademark_searches").insert(data).select().single()

  if (error) throw error
  return search as TrademarkSearch
}

// 상표 검색 조회
export async function getTrademarkSearch(id: string) {
  const isConnected = await checkSupabaseConnection()

  if (!isConnected) {
    throw new Error("데이터베이스 연결이 필요합니다.")
  }

  const { data, error } = await supabase.schema("trademark").from("trademark_searches").select("*").eq("id", id).single()

  if (error) throw error
  return data as TrademarkSearch
}

// 대기열 신청 생성
export async function createWaitlistEntry(data: {
  trademark_search_id: string
  name: string
  email: string
  phone: string
  trademark_name: string
}) {
  const isConnected = await checkSupabaseConnection()

  if (!isConnected) {
    // 폴백: 로컬 저장
    const entry = {
      id: `local_${Date.now()}`,
      ...data,
      status: "pending" as const,
      created_at: new Date().toISOString(),
    }

    try {
      const existingEntries = JSON.parse(localStorage.getItem("ip_doctor_waitlist") || "[]")
      existingEntries.push(entry)
      localStorage.setItem("ip_doctor_waitlist", JSON.stringify(existingEntries))
    } catch (error) {
      console.warn("로컬 저장 실패:", error)
    }

    return entry as AnalysisWaitlist
  }

  const { data: entry, error } = await supabase.from("analysis_waitlist").insert(data).select().single()

  if (error) throw error
  return entry as AnalysisWaitlist
}

// 서비스 사전 예약 생성 (개선된 버전)
export async function createPreBooking(data: {
  source: "homepage" | "results_page"
  name: string
  email: string
  phone: string
  trademark_interest?: string
}): Promise<ServicePreBooking | MockServicePreBooking> {
  const isConnected = await checkSupabaseConnection()

  if (!isConnected) {
    // 폴백: 로컬 저장
    if (checkEmailDuplicate(data.email)) {
      throw new Error("이미 등록된 이메일입니다.")
    }

    return savePreBookingLocally(data)
  }

  // 클라이언트 사이드 바우처 코드 생성 함수
  const generateVoucherCodeFallback = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = "FREE4-"
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  let voucherCode: string

  try {
    // 먼저 데이터베이스 함수로 바우처 코드 생성 시도
    const { data: dbVoucherCode, error: voucherError } = await supabase.rpc("generate_voucher_code")

    if (voucherError) {
      console.warn("Database voucher generation failed, using fallback:", voucherError.message)
      voucherCode = generateVoucherCodeFallback()
    } else {
      voucherCode = dbVoucherCode
    }
  } catch (error) {
    console.warn("Database voucher generation error, using fallback:", error)
    voucherCode = generateVoucherCodeFallback()
  }

  // 중복 확인 및 재생성 로직
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    try {
      const { data: booking, error } = await supabase
        .from("service_pre_bookings")
        .insert({
          ...data,
          voucher_code: voucherCode,
          voucher_value: 40000,
        })
        .select()
        .single()

      if (error) {
        if (error.code === "23505" && error.message.includes("voucher_code")) {
          // 중복된 바우처 코드인 경우 새로 생성
          voucherCode = generateVoucherCodeFallback()
          attempts++
          continue
        }
        throw error
      }

      return booking as ServicePreBooking
    } catch (error) {
      if (attempts === maxAttempts - 1) {
        throw error
      }
      attempts++
    }
  }

  throw new Error("바우처 코드 생성에 실패했습니다.")
}

// 검색 진행 상황 업데이트
export async function updateSearchProgress(searchId: string, status: string, progress?: number, results?: Record<string, unknown>) {
  const isConnected = await checkSupabaseConnection()

  if (!isConnected) {
    console.warn("Supabase 연결 없음 - 진행 상황 업데이트 스킵")
    return null
  }

  const { data, error } = await supabase.rpc("update_search_progress", {
    search_id: searchId,
    new_status: status,
    new_progress: progress,
    new_results: results,
  })

  if (error) throw error
  return data
}
