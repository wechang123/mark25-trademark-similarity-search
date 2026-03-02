"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SuccessPage } from "@/shared/components/success-page"

export function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") || ""
  const trademarkName = searchParams.get("trademark") || ""
  const industry = searchParams.get("industry") || ""

  useEffect(() => {
    if (!email) {
      router.push("/")
    }
  }, [email, router])

  const handleNewAnalysis = () => {
    router.push("/")
  }

  const handleConsultation = () => {
    alert("전문가 상담 서비스는 준비 중입니다. 곧 만나보실 수 있습니다!")
  }

  const handleHome = () => {
    router.push("/")
  }

  if (!email) {
    return null
  }

  return (
    <SuccessPage
      email={email}
      onNewAnalysis={handleNewAnalysis}
      onConsultation={handleConsultation}
      onHome={handleHome}
    />
  )
}
