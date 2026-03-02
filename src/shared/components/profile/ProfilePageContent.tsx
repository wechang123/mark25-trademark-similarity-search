'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useAuth } from '@/features/authentication/_hooks/useAuth';
import { profileService } from '@/features/authentication/_services/profileService';

export function ProfilePageContent() {
  const { state, actions } = useAuth()
  const { user, isLoading, error } = state
  
  const [phone, setPhone] = useState('')
  const [marketingAgreed, setMarketingAgreed] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  // Initialize form values when user data loads
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '')
      setMarketingAgreed(user.marketing_agreed === true)
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return
    
    setIsUpdating(true)
    setUpdateMessage('')
    
    try {
      const updatedUser = await profileService.updateProfile(user.id, {
        phone: phone.trim() || null,
        marketing_agreed: marketingAgreed
      })
      
      // Refresh user data
      await actions.refreshUser()
      setUpdateMessage('프로필이 성공적으로 업데이트되었습니다.')
    } catch (error) {
      console.error('Profile update error:', error)
      setUpdateMessage('프로필 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">프로필 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>로그인하기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">프로필 관리</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>개인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <Input 
                id="name" 
                value={user.name || ''} 
                placeholder="이름 정보 없음"
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input 
                id="email" 
                type="email" 
                value={user.email} 
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">전화번호</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="전화번호를 입력하세요"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="marketing"
              checked={marketingAgreed}
              onCheckedChange={(checked) => setMarketingAgreed(!!checked)}
            />
            <Label htmlFor="marketing">마케팅 정보 수신 동의</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="created">가입일</Label>
              <Input 
                id="created" 
                value={new Date(user.created_at).toLocaleDateString('ko-KR')} 
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="provider">로그인 방식</Label>
              <Input
                id="provider"
                value={
                  user.provider === 'kakao' ? '카카오 로그인' : '이메일 로그인'
                }
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {updateMessage && (
            <div className={`p-3 rounded-md text-sm ${
              updateMessage.includes('성공') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {updateMessage}
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleUpdateProfile}
            disabled={isUpdating}
          >
            {isUpdating ? '업데이트 중...' : '프로필 업데이트'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}