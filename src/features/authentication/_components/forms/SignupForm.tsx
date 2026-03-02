'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/infrastructure/database/client'
import { EmailVerificationModal } from '@/shared/components/ui/email-verification-modal'
import { useSignup } from '../../_hooks'
import type { SignUpData } from '../../_types'

const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, '특수문자를 포함해야 합니다.'),
  passwordConfirm: z.string().min(1, '비밀번호를 다시 입력해주세요.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string()
    .optional()
    .refine((val) => !val || val.length === 0 || /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/.test(val), {
      message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'
    }),
  marketingAgreed: z.boolean().optional()
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm']
})

type SignupFormData = z.infer<typeof signupSchema>

interface SignupFormProps {
  onSuccess?: (user: any, message: string) => void
  onError?: (error: string) => void
  redirectTo?: string
}

export function SignupForm({ onSuccess, onError, redirectTo = '/' }: SignupFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const { signup, isLoading, error, clearError } = useSignup()

  // 🚨 NEW: 이메일 인증 모달 상태
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  // 이메일 중복 체크 상태
  const [emailCheckState, setEmailCheckState] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle')
  const [emailCheckMessage, setEmailCheckMessage] = useState('')
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      name: '',
      phone: '',
      marketingAgreed: false
    }
  })

  // 이메일 중복 체크 함수
  const handleEmailCheck = async () => {
    console.log('🔍 [중복확인] 함수 시작')
    const email = form.getValues('email')
    console.log('🔍 [중복확인] 이메일:', email)

    // 이메일 형식 검증
    if (!email || !z.string().email().safeParse(email).success) {
      console.log('❌ [중복확인] 이메일 형식 오류')
      setEmailCheckState('idle')
      setEmailCheckMessage('올바른 이메일 형식을 입력해주세요.')
      return
    }

    setIsCheckingEmail(true)
    setEmailCheckState('checking')
    setEmailCheckMessage('확인 중...')
    console.log('⏳ [중복확인] RPC 호출 시작...')

    try {
      const supabase = createClient()
      console.log('✅ [중복확인] Supabase 클라이언트 생성 완료')
      console.log('🔗 [중복확인] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

      // 타임아웃 추가 (10초)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC 호출 타임아웃 (10초)')), 10000)
      )

      const rpcPromise = supabase.rpc('check_email_duplicate', { p_email: email })

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any

      console.log('📊 [중복확인] RPC 응답:', { data, error })

      if (error) {
        console.error('❌ [중복확인] RPC 에러:', error)
        setEmailCheckState('idle')
        setEmailCheckMessage(`이메일 확인 중 오류: ${error.message || '알 수 없는 오류'}`)
        return
      }

      console.log('✅ [중복확인] 데이터 구조:', data)

      if (data.available) {
        console.log('✅ [중복확인] 사용 가능한 이메일')
        setEmailCheckState('available')
        setEmailCheckMessage(data.message)
      } else {
        console.log('⚠️ [중복확인] 중복된 이메일')
        setEmailCheckState('duplicate')
        setEmailCheckMessage(data.message)
      }
    } catch (error) {
      console.error('❌ [중복확인] Catch 에러:', error)
      setEmailCheckState('idle')
      setEmailCheckMessage(`이메일 확인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      console.log('🏁 [중복확인] 함수 종료')
      setIsCheckingEmail(false)
    }
  }

  // 전화번호 자동 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')

    // 11자 이상 입력 방지
    if (numbers.length > 11) {
      return value.slice(0, 13) // 하이픈 포함 최대 13자
    }

    // 자동 하이픈 추가
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }
  }

  const handleSubmit = async (data: SignupFormData) => {
    clearError()

    try {
      const { passwordConfirm, ...signupData } = data
      const result = await signup(signupData)

      if (!result.success) {
        onError?.(result.error || '회원가입 중 오류가 발생했습니다.')
        return
      }

      onSuccess?.(result.user, result.message || '회원가입이 완료되었습니다.')

      // 🚨 NEW: 회원가입 성공 시 이메일 인증 모달 표시
      setSignupEmail(data.email)
      setShowEmailVerificationModal(true)

      if (result.requiresVerification) {
        return
      }

      // Use Next.js router for instant navigation without full page reload
      router.push(redirectTo)
    } catch (error) {
      const errorMessage = '회원가입 중 오류가 발생했습니다.'
      onError?.(errorMessage)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="signup-email" className="text-base font-medium text-neutral-700">이메일 *</Label>
        <div className="flex gap-2">
          <Input
            id="signup-email"
            type="email"
            placeholder="이메일을 입력하세요"
            {...form.register('email', {
              onChange: () => {
                // 이메일 변경 시 중복 체크 상태 리셋
                setEmailCheckState('idle')
                setEmailCheckMessage('')
              }
            })}
            disabled={isLoading}
            className="h-12 text-base px-4 border-2 border-neutral-200 focus:border-brand-500 rounded-lg transition-all duration-200"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleEmailCheck}
            disabled={isLoading || isCheckingEmail}
            className="h-12 px-4 whitespace-nowrap border-2"
          >
            {isCheckingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            중복 확인
          </Button>
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
        )}
        {emailCheckState === 'available' && (
          <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{emailCheckMessage}</span>
          </div>
        )}
        {emailCheckState === 'duplicate' && (
          <div className="flex items-center gap-1 text-sm text-red-500 mt-1">
            <XCircle className="h-4 w-4" />
            <span>{emailCheckMessage}</span>
          </div>
        )}
        {emailCheckMessage && emailCheckState === 'idle' && (
          <p className="text-sm text-yellow-600 mt-1">{emailCheckMessage}</p>
        )}
        {error && error.includes('이메일') && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="signup-password" className="text-base font-medium text-neutral-700">비밀번호 *</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호를 입력하세요"
            {...form.register('password')}
            disabled={isLoading}
            className="h-12 text-base px-4 pr-12 border-2 border-neutral-200 focus:border-brand-500 rounded-lg transition-all duration-200"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
        )}
        <p className="text-sm text-neutral-500 mt-1">
          8자 이상, 특수문자 포함
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="signup-password-confirm" className="text-base font-medium text-neutral-700">비밀번호 확인 *</Label>
        <div className="relative">
          <Input
            id="signup-password-confirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            placeholder="비밀번호를 다시 입력하세요"
            {...form.register('passwordConfirm')}
            disabled={isLoading}
            className="h-12 text-base px-4 pr-12 border-2 border-neutral-200 focus:border-brand-500 rounded-lg transition-all duration-200"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            disabled={isLoading}
          >
            {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>
        {form.formState.errors.passwordConfirm && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.passwordConfirm.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="signup-name" className="text-base font-medium text-neutral-700">이름 *</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="이름을 입력하세요"
          {...form.register('name')}
          disabled={isLoading}
          className="h-12 text-base px-4 border-2 border-neutral-200 focus:border-brand-500 rounded-lg transition-all duration-200"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="signup-phone" className="text-base font-medium text-neutral-700">전화번호 (선택)</Label>
        <Input
          id="signup-phone"
          type="tel"
          placeholder="010-1234-5678"
          {...form.register('phone', {
            onChange: (e) => {
              const formatted = formatPhoneNumber(e.target.value)
              form.setValue('phone', formatted)
            }
          })}
          disabled={isLoading}
          className="h-12 text-base px-4 border-2 border-neutral-200 focus:border-brand-500 rounded-lg transition-all duration-200"
          maxLength={13}
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
        )}
        <p className="text-sm text-neutral-500 mt-1">
          숫자만 입력하면 자동으로 하이픈이 추가됩니다.
        </p>
      </div>

      <div className="flex items-center space-x-3 py-2">
        <Controller
          name="marketingAgreed"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              id="marketing"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
              className="w-5 h-5"
            />
          )}
        />
        <Label htmlFor="marketing" className="text-base font-medium text-neutral-700 leading-relaxed">
          마케팅 정보 수신에 동의합니다 (선택)
        </Label>
      </div>

      {error && !error.includes('이메일') && (
        <div className="text-sm text-red-500 text-center py-2">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold h-12 sm:h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" 
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        회원가입
      </Button>

      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        email={signupEmail}
      />
    </form>
  )
}