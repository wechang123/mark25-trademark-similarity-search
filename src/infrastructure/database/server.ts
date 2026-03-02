import { createServerClient } from "@supabase/ssr"

// 서버 사이드에서는 요청마다 새 클라이언트 생성 (쿠키 때문에)
export const createClient = async (cookieStore?: any) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing")
  }

  // 쿠키 스토어가 제공되지 않으면 동적으로 import
  let cookieStoreToUse = cookieStore;
  if (!cookieStoreToUse) {
    try {
      const { cookies } = await import("next/headers");
      cookieStoreToUse = await cookies();
    } catch (error) {
      // pages 디렉토리나 server context가 아닌 경우 빈 쿠키 스토어 사용
      console.warn("Failed to import next/headers cookies, using empty cookie store");
      cookieStoreToUse = {
        getAll: () => [],
        set: () => {},
      };
    }
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStoreToUse.getAll()
      },
      setAll(cookiesToSet: any[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) => cookieStoreToUse.set(name, value, options))
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
        "x-client-info": "ip-doctor-server-v1",
      },
    },
  })
}

/**
 * 서비스 롤을 사용하는 관리자 권한 클라이언트 생성
 * RLS 정책을 우회하여 모든 데이터에 접근 가능
 */
export const createServiceRoleClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[createServiceRoleClient] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    throw new Error("Supabase service role environment variables are missing")
  }

  console.log('[createServiceRoleClient] Creating service role client with key starting with:', 
    supabaseServiceKey.substring(0, 20) + '...'
  );

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() { return [] },
      setAll() { /* 서비스 클라이언트는 쿠키 불필요 */ },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-client-info": "ip-doctor-service-v1",
      },
    },
  })
}

// 호환성을 위한 별칭 exports
export { createClient as createServerClient };
export { createClient as createServerSupabaseClient };
export const createServiceClient = () => createClient();
