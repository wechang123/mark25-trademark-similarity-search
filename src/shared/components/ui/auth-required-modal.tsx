"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Lock, LogIn } from 'lucide-react'

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = "로그인이 필요한 서비스입니다",
  description = "상표 분석 기능을 사용하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
}: AuthRequiredModalProps) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogin = () => {
    setIsRedirecting(true)
    router.push('/signin')
  }

  const handleClose = () => {
    if (!isRedirecting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isRedirecting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isRedirecting}
            className="flex-1 bg-brand-500 hover:bg-brand-600"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isRedirecting ? '이동 중...' : '로그인하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 