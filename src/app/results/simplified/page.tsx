"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SimplifiedResultsView } from "@/features/trademark-analysis/_components/simplified-results/SimplifiedResultsView";

function SimplifiedResultsPageInner() {
  const searchParams = useSearchParams();
  
  const stage2Id = searchParams.get("stage2Id");
  const trademarkName = searchParams.get("trademarkName");
  const businessDescription = searchParams.get("businessDescription");

  if (!stage2Id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">분석 결과를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">분석 ID가 제공되지 않았습니다.</p>
          <a 
            href="/trademark-selection" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            새로운 분석 시작하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <SimplifiedResultsView 
      stage2Id={stage2Id}
      trademarkName={trademarkName || ""}
      businessDescription={businessDescription || ""}
    />
  );
}

export default function SimplifiedResultsPage() {
  return (
    <Suspense fallback={<ResultsLoading />}>
      <SimplifiedResultsPageInner />
    </Suspense>
  );
}

const ResultsLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">분석 결과를 불러오고 있습니다...</p>
    </div>
  </div>
);