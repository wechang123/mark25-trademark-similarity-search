import { Metadata } from 'next'
import { SigninForm, SocialButtons } from '@/features/authentication'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '로그인 | IP-DR',
  description: 'IP-DR 계정으로 로그인하세요',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <SigninForm redirectTo="/" />
            <div className="mt-4">
              <SocialButtons />
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                계정이 없으신가요?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}