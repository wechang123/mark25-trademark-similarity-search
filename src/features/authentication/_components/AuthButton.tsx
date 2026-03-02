'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { User, LogOut, Settings, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '../_hooks'

export function AuthButton() {
  const router = useRouter()
  const { state, actions } = useAuth()
  const { user, isLoading, isInitialized } = state
  const { signOut } = actions

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleSignInClick = () => {
    router.push('/signin')
  }

  // 초기화 중이거나 로딩 중
  if (!isInitialized || isLoading) {
    return (
      <Button disabled variant="ghost" size="sm">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  // 로그인하지 않은 상태
  if (!user) {
    return (
      <Button
        onClick={handleSignInClick}
        className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
      >
        로그인
      </Button>
    )
  }

  // 로그인한 상태
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 px-4 py-2 border-neutral-200 hover:bg-neutral-50"
          disabled={isLoading}
        >
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:block font-medium text-neutral-700">
            {user.name || '사용자'}
          </span>
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <div className="font-medium text-gray-900">{user.name || '사용자'}</div>
          <div className="text-sm text-neutral-500">{user.email}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          프로필 관리
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={signOut} 
          className="cursor-pointer text-error-600 focus:text-error-600"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그아웃 중...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}