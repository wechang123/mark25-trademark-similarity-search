'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useSignin } from '../../_hooks'
import type { SignInData } from '../../_types'

const signinSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  rememberMe: z.boolean().optional()
})

type SigninFormData = z.infer<typeof signinSchema>

interface SigninFormProps {
  onSuccess?: (user: any, message: string) => void
  onError?: (error: string) => void
  redirectTo?: string
}

export function SigninForm({ onSuccess, onError, redirectTo = '/' }: SigninFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { signin, isLoading, error, clearError } = useSignin()

  const form = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const handleSubmit = async (data: SigninFormData) => {
    clearError()

    try {
      const result = await signin(data as SignInData)

      if (!result.success) {
        onError?.(result.error || '로그인 중 오류가 발생했습니다.')
        return
      }

      onSuccess?.(result.user, result.message || '로그인되었습니다.')

      // Use Next.js router for instant navigation without full page reload
      router.push(redirectTo)
    } catch (error) {
      const errorMessage = '로그인 중 오류가 발생했습니다.'
      onError?.(errorMessage)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="signin-email" className="text-base font-medium text-neutral-700">이메일</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="이메일을 입력하세요"
          {...form.register('email')}
          disabled={isLoading}
          className="h-12 text-base px-4 border-2 border-neutral-200 focus:border-brand-500 rounded-lg transition-all duration-200"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="signin-password" className="text-base font-medium text-neutral-700">비밀번호</Label>
        <div className="relative">
          <Input
            id="signin-password"
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
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>

      <div className="flex items-center py-2">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="remember"
            {...form.register('rememberMe')}
            disabled={isLoading}
            className="w-5 h-5"
          />
          <Label htmlFor="remember" className="text-base font-medium text-neutral-700">로그인 상태 유지</Label>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold h-12 sm:h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" 
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        로그인
      </Button>
    </form>
  )
}