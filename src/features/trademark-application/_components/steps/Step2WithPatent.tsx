"use client";

import React, { useRef } from "react";
import { Database, User, HelpCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { SignaturePad } from "../SignaturePad";
import { ImageUpload } from "@/features/trademark-analysis/_components/search/image-upload";
import type { TrademarkApplicationFormData } from "../../_types";

interface Step2WithPatentProps {
  formData: TrademarkApplicationFormData;
  onInputChange: (field: string, value: any) => void;
  onSealImageUpload: (file: File | null) => void;
  onSignatureImageUpload: (file: File | null) => void;
  onSealCertificateUpload: (file: File | null) => void;
  signatureTab: "upload" | "draw";
  setSignatureTab: (tab: "upload" | "draw") => void;
  nameKoreanRef: React.RefObject<HTMLInputElement | null>;
  nameEnglishRef: React.RefObject<HTMLInputElement | null>;
}

// 유틸리티 함수: File 객체를 Base64 문자열로 변환
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function Step2WithPatent({
  formData,
  onInputChange,
  onSealImageUpload,
  onSignatureImageUpload,
  onSealCertificateUpload,
  signatureTab,
  setSignatureTab,
  nameKoreanRef,
  nameEnglishRef,
}: Step2WithPatentProps) {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="mb-2 text-md text-red-500 font-medium">
          * 표시는 필수 입력사항입니다.
        </div>

        {/* 출원인 구분 */}
        <Card>
          <CardHeader>
            <CardTitle>
              출원인 구분 <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value="국내자연인"
              readOnly
              className="h-12 text-base border-neutral-200 bg-neutral-100 rounded-2xl"
            />
          </CardContent>
        </Card>

        {/* 성명 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" />
              고객 정보 확인 <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription className="text-base">
              상표 출원을 위한 고객 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nameKorean">
                  성명(국문) <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={nameKoreanRef}
                  id="nameKorean"
                  placeholder="홍길동"
                  value={formData.nameKorean}
                  onChange={(e) => onInputChange("nameKorean", e.target.value)}
                  className="h-12 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEnglish">
                  성명(영문) <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={nameEnglishRef}
                  id="nameEnglish"
                  placeholder="Hong Gil Dong"
                  value={formData.nameEnglish}
                  onChange={(e) => onInputChange("nameEnglish", e.target.value)}
                  className="h-12 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 특허고객번호 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-500" />
              특허고객번호 <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription className="text-base">
              특허청에서 발급받은 특허고객번호를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex gap-1.5 items-center">
                <Input
                  maxLength={1}
                  placeholder="1"
                  value={formData.patentCustomerNumber1 || ""}
                  onChange={(e) =>
                    onInputChange(
                      "patentCustomerNumber1",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className="h-12 w-12 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl flex-shrink-0"
                />
                <span className="text-neutral-400 text-sm flex-shrink-0">
                  -
                </span>
                <Input
                  maxLength={4}
                  placeholder="2345"
                  value={formData.patentCustomerNumber2 || ""}
                  onChange={(e) =>
                    onInputChange(
                      "patentCustomerNumber2",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className="h-12 w-16 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl flex-shrink-0"
                />
                <span className="text-neutral-400 text-sm flex-shrink-0">
                  -
                </span>
                <Input
                  maxLength={6}
                  placeholder="567890"
                  value={formData.patentCustomerNumber3 || ""}
                  onChange={(e) =>
                    onInputChange(
                      "patentCustomerNumber3",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className="h-12 w-24 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl flex-shrink-0"
                />
                <span className="text-neutral-400 text-sm flex-shrink-0">
                  -
                </span>
                <Input
                  maxLength={1}
                  placeholder="1"
                  value={formData.patentCustomerNumber4 || ""}
                  onChange={(e) =>
                    onInputChange(
                      "patentCustomerNumber4",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className="h-12 w-12 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl flex-shrink-0"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center lg:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-12 whitespace-nowrap px-6 hover:border-brand-500"
                  onClick={() => {
                    window.open(
                      "https://www.patent.go.kr/smart/jsp/kiponet/mp/mpopenpatinfo/apagtinfo/ReadApAgtInfoInput.do"
                    );
                  }}
                >
                  🔍 특허고객번호 검색
                </Button>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <span>특허고객번호를 모르시나요?</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-blue-600 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm text-left">
                      <div className="font-medium mb-1">검색 방법:</div>
                      <div>1. 출원인/대리인 정보 클릭</div>
                      <div>
                        2. 성명(한글), 성명(영문), 주민(법인)등록번호 입력
                      </div>
                      <div>3. 검색 후 특허고객번호 확인</div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 인감도장/서명 이미지 첨부 */}
        <Card className="mb-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>
              인감도장/서명 이미지 첨부 <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription className="text-base">
              특허고객번호 신청시 제출한 인감/서명과 동일해야 합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-stretch h-full min-h-[220px]">
              {/* 인감도장 이미지 */}
              <div className="flex-1 flex flex-col gap-2 h-full justify-stretch">
                <Label>인감도장 이미지</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled
                    style={{ pointerEvents: "none", opacity: 0.7 }}
                  >
                    파일 업로드
                  </Button>
                </div>
                <div className="flex-1 flex flex-col justify-center h-full">
                  <ImageUpload
                    onFileUpload={onSealImageUpload}
                    acceptedFileTypes={["image/jpeg", "image/jpg", "image/png"]}
                    forceJpg151={true}
                    placeholder="인감도장 이미지를 업로드하세요 (JPG, PNG)"
                  />
                </div>
              </div>
              {/* 서명 이미지 */}
              <div className="flex-1 flex flex-col gap-2 h-full justify-stretch">
                <Label>서명 이미지</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={signatureTab === "upload" ? "default" : "outline"}
                    onClick={() => setSignatureTab("upload")}
                  >
                    파일 업로드
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={signatureTab === "draw" ? "default" : "outline"}
                    onClick={() => setSignatureTab("draw")}
                  >
                    직접 그리기
                  </Button>
                </div>
                <div className="flex-1 flex flex-col justify-center h-full">
                  {signatureTab === "upload" ? (
                    <ImageUpload
                      onFileUpload={onSignatureImageUpload}
                      acceptedFileTypes={[
                        "image/jpeg",
                        "image/jpg",
                        "image/png",
                      ]}
                      forceJpg151={true}
                      placeholder="서명 이미지를 업로드하세요 (JPG, PNG)"
                    />
                  ) : (
                    <SignaturePad
                      onSignatureUpload={(dataUrl) =>
                        onSignatureImageUpload(
                          dataUrl
                            ? dataURLtoFile(dataUrl, "signature.png")
                            : null
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs mt-6 space-y-2">
              <div className="text-neutral-700">
                <div>
                  * 특허고객번호 신청시 제출한 인감/서명과 동일한 것을
                  사용해주세요
                </div>
                <div>* 다른 인감/서명 사용시 인감증명서 첨부가 필요합니다</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                <div className="font-medium text-red-900 mb-1">
                  ⚠️ 중요 안내
                </div>
                <div>
                  기존 등록된 인감/서명과 다른 것을 사용하면서 인감증명서를
                  첨부하지 않을 경우,{" "}
                  <strong>상표출원이 반려되거나 처리가 지연</strong>될 수
                  있습니다.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 인감증명서 첨부 (선택사항) */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              <HelpCircle className="w-5 h-5 inline mr-2" />
              인감증명서 첨부 (선택사항)
            </CardTitle>
            <CardDescription className="text-blue-700 text-base">
              기존 등록된 인감과 다른 인감을 사용하는 경우에만 첨부하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 whitespace-nowrap px-4 hover:border-brand-500"
                    onClick={() => {
                      window.open(
                        "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13100000025"
                      );
                    }}
                  >
                    🏛️ 인감증명서 발급
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <span>인감증명서 발급 방법을 모르시나요?</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-blue-600 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm text-left">
                        <div className="font-medium mb-1">발급 방법:</div>
                        <div>1. 정부24 사이트 접속</div>
                        <div>2. 공동인증서 또는 간편인증으로 로그인</div>
                        <div>3. 인감증명서 발급 신청</div>
                        <div>4. 발급받은 증명서 업로드</div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <ImageUpload
                  onFileUpload={onSealCertificateUpload}
                  acceptedFileTypes={[
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "application/pdf",
                  ]}
                  placeholder="인감증명서를 업로드하세요 (JPG, PNG, PDF) - 선택사항"
                />
              </div>
              <div className="text-xs text-blue-600 mt-2">
                <div>
                  * 기존 등록된 인감과 다른 인감을 사용하는 경우에만 첨부하세요
                </div>
                <div>
                  * 시/군/구청 또는 읍/면/동사무소에서 발급받은 인감증명서를
                  첨부해주세요
                </div>
                <div>
                  * 인감증명서는 발급일로부터 3개월 이내의 것이어야 합니다
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
