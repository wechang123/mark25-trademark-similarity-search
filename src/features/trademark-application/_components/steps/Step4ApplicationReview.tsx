import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

interface Step4ApplicationReviewProps {
  selectedService: string | null;
  onServiceSelect: (service: string) => void;
  showPayment: boolean;
  onShowPayment: () => void;
  onHidePayment: () => void;
  onSubmit: () => void;
}

export function Step4ApplicationReview({
  selectedService,
  onServiceSelect,
  showPayment,
  onShowPayment,
  onHidePayment,
  onSubmit,
}: Step4ApplicationReviewProps) {
  return (
    <div className="space-y-8">
      <div className="mb-2 text-base font-bold text-blue-700">
        상표 출원 비용: 19,900원 (VAT 포함)
      </div>
      <div className="mb-2 text-sm text-neutral-600">
        ※ 1개 류당 약 62,000원의 관납료가 별도로 추가됩니다.
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className={`cursor-pointer border-2 ${
            selectedService === "simple"
              ? "border-brand-500"
              : "border-neutral-200"
          } hover:shadow-lg transition`}
          onClick={() => onServiceSelect("simple")}
        >
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedService === "simple"
                    ? "border-brand-500"
                    : "border-neutral-300"
                } flex items-center justify-center mr-2`}
              >
                {selectedService === "simple" && (
                  <span className="bg-brand-500 w-3 h-3 rounded-full block" />
                )}
              </span>
              간편 출원 서비스{" "}
              <span className="text-brand-500 font-bold ml-2 text-xl">
                19,900원
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-neutral-500 text-sm">
              AI 기반으로 쉽고 빠르게 상표 출원 신청이 가능합니다.
            </div>
          </CardContent>
        </Card>
      </div>
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">결제하기</h2>
            <div className="mb-4 text-xl">
              간편 출원 서비스{" "}
              <span className="font-bold text-brand-500">
                19,900원 (VAT 포함)
              </span>
            </div>
            <div className="mb-4 text-sm text-neutral-600">
              ※ 1개 류당 약 62,000원의 관납료가 별도로 추가됩니다.
            </div>
            <div className="mb-4 text-xs text-red-500 font-semibold">
              이 비용은 특허청에 납부되는 관납료이며, 우리 서비스의 수익이
              아닙니다.
            </div>
            <Button
              className="w-full h-12 text-base bg-brand-500 hover:bg-brand-600 text-white rounded-2xl mb-2"
              onClick={() => {
                onHidePayment();
                onSubmit();
              }}
            >
              결제 및 출원 신청
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base rounded-2xl"
              onClick={onHidePayment}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}