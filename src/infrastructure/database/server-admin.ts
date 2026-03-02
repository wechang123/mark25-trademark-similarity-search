import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Admin API용 Supabase 클라이언트 생성
 * SERVICE_ROLE_KEY를 사용하여 RLS를 우회할 수 있음
 */
export const createServerSupabaseAdmin = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are missing")
  }

  // Service Role Key를 사용하여 관리자 권한 클라이언트 생성
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Service role doesn't need cookies
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-client-info": "ip-doctor-admin-api-v1",
      },
    },
  })
}

/**
 * Admin API용 일반 클라이언트 (인증 체크용)
 */
export const createServerSupabaseClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing")
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) => 
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component에서 호출된 경우 무시
        }
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-client-info": "ip-doctor-admin-api-v1",
      },
    },
  })
}