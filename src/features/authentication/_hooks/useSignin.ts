'use client'

import { useState, useCallback } from 'react'
import { authService } from '../_services'
import type { SigninHookResult, SignInData, AuthResult } from '../_types'

export function useSignin(): SigninHookResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signin = useCallback(async (data: SignInData): Promise<AuthResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await authService.signIn(data)
      
      if (!result.success) {
        setError(result.error || '로그인 중 오류가 발생했습니다.')
      }

      return result
    } catch (error) {
      const errorMessage = '로그인 중 오류가 발생했습니다.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    signin,
    isLoading,
    error,
    clearError
  }
}