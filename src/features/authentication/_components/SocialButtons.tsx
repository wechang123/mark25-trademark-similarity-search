'use client'

import { Button } from '@/shared/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/infrastructure/database/client'

interface SocialButtonsProps {
  disabled?: boolean
  onSocialLogin?: (provider: 'kakao') => void
}

export function SocialButtons({ disabled = false, onSocialLogin }: SocialButtonsProps) {
  const [isLoadingKakao, setIsLoadingKakao] = useState(false)
  
  const handleKakaoLogin = async () => {
    if (onSocialLogin) {
      onSocialLogin('kakao')
      return
    }
    
    try {
      setIsLoadingKakao(true)
      const supabase = createClient()
      
      // Supabase OAuth를 통한 카카오 로그인
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          scopes: 'profile_nickname profile_image account_email'
        }
      })
      
      if (error) {
        console.error('Kakao login error:', error)
        alert('카카오 로그인에 실패했습니다: ' + error.message)
      }
      // 성공 시 자동으로 카카오 로그인 페이지로 리다이렉트됨
    } catch (error) {
      console.error('Kakao login error:', error)
      alert('카카오 로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoadingKakao(false)
    }
  }


  return (
    <div className="mt-4 space-y-2">
      {/* 카카오 로그인 */}
      <Button
        type="button"
        variant="outline"
        className="w-full bg-yellow-300 hover:bg-yellow-400 text-black border-yellow-300"
        onClick={handleKakaoLogin}
        disabled={disabled || isLoadingKakao}
      >
        {(disabled || isLoadingKakao) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c5.8 0 9.5 3.5 9.5 7.3 0 2.8-1.9 5.2-4.7 6.4l1.2 4.4-4.9-2.7c-.7.1-1.4.2-2.1.2C6.2 18.6 2.5 15.1 2.5 10.3 2.5 6.5 6.2 3 12 3z"/>
        </svg>
        카카오로 계속하기
      </Button>

    </div>
  )
}