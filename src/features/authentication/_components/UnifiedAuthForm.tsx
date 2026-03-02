'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { SigninForm } from './forms/SigninForm'
import { SignupForm } from './forms/SignupForm'
import { SocialButtons } from './SocialButtons'

interface UnifiedAuthFormProps {
  defaultTab?: 'signin' | 'signup'
  redirectTo?: string
}

export function UnifiedAuthForm({ defaultTab = 'signin', redirectTo }: UnifiedAuthFormProps) {
  const [currentTab, setCurrentTab] = useState(defaultTab)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {currentTab === 'signin' ? '로그인' : '회원가입'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <SigninForm redirectTo={redirectTo} />
            <div className="mt-4">
              <SocialButtons />
            </div>
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm redirectTo={redirectTo} />
            <div className="mt-4">
              <SocialButtons />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}