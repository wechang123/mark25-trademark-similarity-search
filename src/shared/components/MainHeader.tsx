'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { AuthButton, useAuthContext } from '@/features/authentication'

interface MainHeaderProps {
  currentPage?: 'home' | 'dashboard' | 'analysis' | 'application' | 'admin'
}

export function MainHeader({ currentPage = 'home' }: MainHeaderProps) {
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { isAdmin, isManager } = useAuthContext()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setShowMobileMenu(false)
  }

  const isAdminOrManager = isAdmin() || isManager()

  return (
    <>
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Mark25"
                width={48}
                height={48}
                className="w-12 h-12 object-contain cursor-pointer"
                onClick={() => router.push('/')}
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900">Mark25</div>
                <div className="text-xs text-neutral-500">AI 상표 분석</div>
              </div>
              <Badge className="hidden md:inline-flex ml-2 bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 border-0">
                Beta
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {currentPage === 'home' ? (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                  >
                    내 대시보드
                  </button>
                  <button
                    onClick={() => router.push('/trademark-selection')}
                    className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                  >
                    상표 분석
                  </button>
                  <button
                    onClick={() => router.push('/trademark-application')}
                    className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                  >
                    상표 출원
                  </button>
                  {isAdminOrManager && (
                    <button
                      onClick={() => router.push('/admin/dashboard')}
                      className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                    >
                      관리자 대시보드
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/')}
                    className="text-neutral-700 hover:text-brand-600 transition-colors font-medium"
                  >
                    홈
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className={`transition-colors font-medium ${
                      currentPage === 'dashboard'
                        ? 'text-brand-600'
                        : 'text-neutral-700 hover:text-brand-600'
                    }`}
                  >
                    내 대시보드
                  </button>
                  <button
                    onClick={() => router.push('/trademark-selection')}
                    className={`transition-colors font-medium ${
                      currentPage === 'analysis'
                        ? 'text-brand-600'
                        : 'text-neutral-700 hover:text-brand-600'
                    }`}
                  >
                    상표 분석
                  </button>
                  <button
                    onClick={() => router.push('/trademark-application')}
                    className={`transition-colors font-medium ${
                      currentPage === 'application'
                        ? 'text-brand-600'
                        : 'text-neutral-700 hover:text-brand-600'
                    }`}
                  >
                    상표 출원
                  </button>
                  {isAdminOrManager && (
                    <button
                      onClick={() => router.push('/admin/dashboard')}
                      className={`transition-colors font-medium ${
                        currentPage === 'admin'
                          ? 'text-brand-600'
                          : 'text-neutral-700 hover:text-brand-600'
                      }`}
                    >
                      관리자 대시보드
                    </button>
                  )}
                </>
              )}
              <div className="flex items-center space-x-4 ml-4">
                <AuthButton />
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {showMobileMenu ? (
                <X className="h-6 w-6 text-neutral-700" />
              ) : (
                <Menu className="h-6 w-6 text-neutral-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 top-[73px] z-40 bg-white">
          <nav className="container mx-auto px-4 py-6 space-y-4">
            {currentPage === 'home' ? (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="block w-full text-left text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2"
                >
                  내 대시보드
                </button>
                <button
                  onClick={() => router.push('/trademark-selection')}
                  className="block w-full text-left text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2"
                >
                  상표 분석
                </button>
                <button
                  onClick={() => router.push('/trademark-application')}
                  className="block w-full text-left text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2"
                >
                  상표 출원
                </button>
                {isAdminOrManager && (
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="block w-full text-left text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2"
                  >
                    관리자 대시보드
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/')}
                  className="block w-full text-left text-neutral-700 hover:text-brand-600 transition-colors font-medium py-2"
                >
                  홈
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className={`block w-full text-left transition-colors font-medium py-2 ${
                    currentPage === 'dashboard'
                      ? 'text-brand-600'
                      : 'text-neutral-700 hover:text-brand-600'
                  }`}
                >
                  내 대시보드
                </button>
                <button
                  onClick={() => router.push('/trademark-selection')}
                  className={`block w-full text-left transition-colors font-medium py-2 ${
                    currentPage === 'analysis'
                      ? 'text-brand-600'
                      : 'text-neutral-700 hover:text-brand-600'
                  }`}
                >
                  상표 분석
                </button>
                <button
                  onClick={() => router.push('/trademark-application')}
                  className={`block w-full text-left transition-colors font-medium py-2 ${
                    currentPage === 'application'
                      ? 'text-brand-600'
                      : 'text-neutral-700 hover:text-brand-600'
                  }`}
                >
                  상표 출원
                </button>
                {isAdminOrManager && (
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className={`block w-full text-left transition-colors font-medium py-2 ${
                      currentPage === 'admin'
                        ? 'text-brand-600'
                        : 'text-neutral-700 hover:text-brand-600'
                    }`}
                  >
                    관리자 대시보드
                  </button>
                )}
              </>
            )}
            <div className="pt-4 border-t">
              <AuthButton />
            </div>
          </nav>
        </div>
      )}
    </>
  )
}