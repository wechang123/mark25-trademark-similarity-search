'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import Image from 'next/image'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { SignupForm } from './forms/SignupForm'
import { SigninForm } from './forms/SigninForm'
import { SocialButtons } from './SocialButtons'

interface AuthFormContainerProps {
  defaultTab?: 'signin' | 'signup'
  redirectTo?: string
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
}

export function AuthFormContainer({ 
  defaultTab = 'signin',
  redirectTo = '/',
  onSuccess,
  onError 
}: AuthFormContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSuccess = (user: any, successMessage: string) => {
    setMessage({ type: 'success', text: successMessage })
    onSuccess?.(user)
  }

  const handleError = (errorMessage: string) => {
    setMessage({ type: 'error', text: errorMessage })
    onError?.(errorMessage)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 뒤로 가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-gray-900 p-2"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로 가기
        </Button>
      </div>
      
      {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* 헤더 섹션 - 모바일에서는 상단, 데스크톱에서는 좌측 */}
        <div className="lg:w-1/3 text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/logo-auth.png"
              alt="Mark25"
              width={160}
              height={80}
              className="w-32 h-16 sm:w-40 sm:h-40 object-contain"
              priority
            />
          </div>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            AI 상표 등록 서비스에 오신 것을 환영합니다
          </p>
        </div>

        {/* 폼 섹션 - 모바일에서는 하단, 데스크톱에서는 우측 */}
        <div className="lg:w-2/3">
          <Card className="bg-white rounded-3xl shadow-2xl border border-gray-100">
            <CardContent className="p-6">
              {/* 탭 선택 */}
              <div className="mb-6">
                <div className="flex gap-2 p-1 bg-brand-50 rounded-lg">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all ${
                      activeTab === 'signin'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-brand-700 hover:bg-brand-100'
                    }`}
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all ${
                      activeTab === 'signup'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-brand-700 hover:bg-brand-100'
                    }`}
                  >
                    회원가입
                  </button>
                </div>
              </div>

              {/* 메시지 표시 */}
              {message && (
                <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                  <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* 폼 렌더링 */}
              {activeTab === 'signin' ? (
                <div>
                  <SigninForm 
                    onSuccess={handleSuccess}
                    onError={handleError}
                    redirectTo={redirectTo}
                  />
                  
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">또는</span>
                      </div>
                    </div>
                    <SocialButtons />
                  </div>
                </div>
              ) : (
                <div>
                  <SignupForm 
                    onSuccess={handleSuccess}
                    onError={handleError}
                    redirectTo={redirectTo}
                  />
                  
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">또는</span>
                      </div>
                    </div>
                    <SocialButtons />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}