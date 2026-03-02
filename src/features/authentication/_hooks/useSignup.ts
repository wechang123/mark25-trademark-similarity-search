'use client'

import { useState, useCallback } from 'react'
import { authService } from '../_services'
import type { SignupHookResult, SignUpData, AuthResult } from '../_types'

export function useSignup(): SignupHookResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signup = useCallback(async (data: SignUpData): Promise<AuthResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await authService.signUp(data)
      
      if (!result.success) {
        setError(result.error || '회원가입 중 오류가 발생했습니다.')
      }

      return result
    } catch (error) {
      const errorMessage = '회원가입 중 오류가 발생했습니다.'
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
    signup,
    isLoading,
    error,
    clearError
  }
}