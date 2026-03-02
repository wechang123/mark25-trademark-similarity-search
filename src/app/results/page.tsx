"use client"

import { Suspense } from "react"
import { ResultsPageContent } from "./results-page-content"

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-neutral-600">결과를 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  )
}
