import { createBrowserClient } from "@supabase/ssr"
import { createStorageAdapter } from "../auth/storage-adapter"

// SSR 환경 체크
const isServer = typeof window === 'undefined'

// 디버그용 클라이언트 생성 카운터
let clientCreationCount = 0

/**
 * Supabase 클라이언트 생성 (팩토리 패턴)
 * 각 탭/컴포넌트에서 독립적인 인스턴스 생성
 * 세션은 커스텀 스토리지 어댑터를 통해 탭 간 공유
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing")
  }

  clientCreationCount++
  
  // 서버사이드 기본 설정
  if (isServer) {
    console.log(`🔧 [Server] Creating Supabase client #${clientCreationCount}`)
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  }

  // 클라이언트사이드 - 커스텀 스토리지 어댑터 사용
  console.log(`🔧 [Client] Creating Supabase client #${clientCreationCount}`)
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorageAdapter(), // 커스텀 스토리지 어댑터 (탭 동기화)
      // storageKey는 제거 - 기본값 사용하여 서버와 호환성 유지
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-client-info": `ip-doctor-v1-${clientCreationCount}-${Date.now()}`, // 디버그용 식별자
      },
    },
  })
}

// 디버그용 클라이언트 정보 조회
export const getClientInfo = () => {
  return {
    isServer,
    creationCount: clientCreationCount,
    timestamp: Date.now()
  }
}
