"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle,
  FileText,
  Download,
  ArrowRight,
  Home,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export function TrademarkApplicationSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="Mark25"
              width={64}
              height={64}
              className="w-16 h-16 aspect-square object-contain cursor-pointer"
              onClick={() => router.push("/")}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                상표 출원 등록 서비스
              </h1>
              <p className="text-sm text-neutral-600">AI 기반 상표 출원 도우미</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              상표 출원 신청이 완료되었습니다!
            </h1>
            <p className="text-lg text-neutral-600 mb-8">
              신청하신 상표 출원이 성공적으로 접수되었습니다.
              <br />
              처리 상황은 이메일로 안내드리겠습니다.
            </p>
          </div>

          {/* Application Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                출원 신청 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-neutral-500">신청 번호</p>
                  <p className="font-medium">
                    PA-{Date.now().toString().slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">신청 일시</p>
                  <p className="font-medium">
                    {new Date().toLocaleString("ko-KR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">처리 상태</p>
                  <Badge className="bg-warning-100 text-warning-800">
                    검토 중
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">예상 처리 기간</p>
                  <p className="font-medium">3-5 영업일</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>다음 단계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">신청서 검토</p>
                    <p className="text-sm text-neutral-600">
                      제출된 서류를 검토하고 누락사항이 있는지 확인합니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">이메일 안내</p>
                    <p className="text-sm text-neutral-600">
                      검토 결과와 추가 필요사항을 이메일로 안내드립니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">최종 제출</p>
                    <p className="text-sm text-neutral-600">
                      모든 서류가 완료되면 특허청에 최종 제출합니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/")}
              className="h-12 px-8 text-base bg-brand-500 hover:bg-brand-600 text-white rounded-2xl"
            >
              <Home className="w-5 h-5 mr-2" />
              메인으로 돌아가기
            </Button>
            <Button
              variant="outline"
              className="h-12 px-8 text-base border-neutral-200 hover:border-brand-500 hover:text-brand-500 rounded-2xl"
            >
              <Download className="w-5 h-5 mr-2" />
              신청서 다운로드
            </Button>
          </div>

          {/* Contact Information */}
          <div className="mt-12 p-6 bg-neutral-50 rounded-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">
              문의사항이 있으신가요?
            </h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <p>📧 이메일: support@ipdoctor.com</p>
              <p>📞 전화: 02-1234-5678</p>
              <p>🕒 운영시간: 평일 09:00 - 18:00</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
