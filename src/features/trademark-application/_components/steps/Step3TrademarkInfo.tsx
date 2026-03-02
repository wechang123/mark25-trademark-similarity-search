import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { FileText, HelpCircle } from "lucide-react";
import { ImageUpload } from "@/features/trademark-analysis/_components/search/image-upload";
import { TrademarkApplicationFormData } from "../../_types";

interface Step3TrademarkInfoProps {
  formData: TrademarkApplicationFormData;
  onInputChange: (field: string, value: any) => void;
  onTrademarkImageUpload: (file: File | null) => void;
}

export function Step3TrademarkInfo({
  formData,
  onInputChange,
  onTrademarkImageUpload,
}: Step3TrademarkInfoProps) {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              <span className="flex items-center gap-1">
                상표유형 선택 <span className="text-red-500">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    상표유형을 선택하고 마우스를 올리면 설명을 볼 수 있습니다.
                  </TooltipContent>
                </Tooltip>
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              상표유형을 선택하고 업종 설명을 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trademarkType" className="text-lg">
                상표유형 <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trademarkType"
                    value="일반상표"
                    checked={formData.trademarkType === "일반상표"}
                    onChange={() => onInputChange("trademarkType", "일반상표")}
                  />
                  일반상표
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      기호나 문자, 도형 또는 이들을 서로 결합한 상표를 말합니다.
                      또한 이들 각각에 색채를 결합한 것도{" "}
                      <span className="text-red-500 font-bold">일반상표</span>에
                      해당됩니다.
                      <br />
                      입체적으로 표현된 또는 색채만으로 이루어진 문자 또는 도형
                      등도{" "}
                      <span className="text-red-500 font-bold">일반상표</span>에
                      해당됩니다.
                    </TooltipContent>
                  </Tooltip>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trademarkType"
                    value="특수상표"
                    checked={formData.trademarkType === "특수상표"}
                    onChange={() => onInputChange("trademarkType", "특수상표")}
                  />
                  특수상표
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      소리, 냄새, 동작, 홀로그램, 입체적 형상, 다른 것(도형,
                      문자)과 결합하지 않은 색채만으로 된 상표는{" "}
                      <span className="text-info-600 font-bold">특수상표</span>
                      에 해당합니다.
                    </TooltipContent>
                  </Tooltip>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-lg">
                상표 사진 <span className="text-red-500">*</span>
              </Label>
              <ImageUpload
                onFileUpload={onTrademarkImageUpload}
                acceptedFileTypes={["image/jpeg", "image/jpg", "image/png"]}
                placeholder="상표 이미지를 업로드하세요 (JPG, PNG → 자동 4cm×4cm JPG 변환)"
                forceJpg151={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryDescription">
                업종 설명 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="industryDescription"
                placeholder="상표를 사용할 업종에 대해 설명해주세요"
                value={formData.industryDescription}
                onChange={(e) =>
                  onInputChange("industryDescription", e.target.value)
                }
                className="min-h-[120px] text-lg border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productClassification">
                상품 분류 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="productClassification"
                placeholder="상품 분류가 여기에 표시됩니다."
                value={formData.productClassification}
                readOnly
                className="min-h-[80px] text-lg border-neutral-200 bg-neutral-100 rounded-2xl resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designatedProducts">
                지정 상품 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="designatedProducts"
                placeholder="지정 상품 (하드코딩된 값)"
                value={formData.designatedProducts.join("")}
                readOnly
                className="min-h-[120px] text-lg border-neutral-200 bg-neutral-100 rounded-2xl resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
