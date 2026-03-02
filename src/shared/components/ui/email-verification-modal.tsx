"use client"

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
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email?: string
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email = "입력하신 이메일"
}: EmailVerificationModalProps) {
  const router = useRouter()

  const handleSignIn = () => {
    // 모달 먼저 닫기
    onClose()
    // 로그인 페이지로 이동
    router.push('/signin')
  }

  const handleClose = () => {
    // 단순히 모달만 닫기
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              회원가입이 완료되었습니다!
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            {email}로 인증 메일이 발송되었습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                이메일 인증이 필요합니다
              </h4>
              <p className="text-sm text-blue-800">
                이메일을 확인하여 계정을 활성화한 후 로그인해주세요. 
                스팸 메일함도 확인해보세요.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            확인
          </Button>
          <Button
            onClick={handleSignIn}
            className="flex-1 bg-brand-500 hover:bg-brand-600"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            로그인하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 