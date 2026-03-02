'use client'

import { useAuthContext } from '../_contexts/AuthContext'
import type { AuthHookResult } from '../_types'

// useAuth Hook은 이제 AuthContext를 사용하여 상태를 가져옵니다
export function useAuth(): AuthHookResult {
  const { user, isLoading, error, isInitialized, signOut, refreshUser } = useAuthContext()

  return {
    state: {
      user,
      isLoading,
      error,
      isInitialized
    },
    actions: {
      signOut,
      refreshUser
    }
  }
}