"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface Step1CustomerTypeProps {
  hasPatentCustomerNumber: boolean | null;
  onCustomerTypeChange: (hasPatent: boolean) => void;
}

export function Step1CustomerType({
  hasPatentCustomerNumber,
  onCustomerTypeChange,
}: Step1CustomerTypeProps) {
  return (
    <div className="space-y-8">
      <div className="mb-2 text-base font-bold text-blue-700 text-center">
        특허고객번호 보유 여부를 선택해주세요
      </div>
      <div className="mb-2 text-sm text-neutral-700 text-center">
        특허고객번호 보유 여부에 따라 다른 입력 화면이 제공됩니다.
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className={`cursor-pointer border-2 ${
            hasPatentCustomerNumber === true
              ? "border-brand-500"
              : "border-neutral-200"
          } hover:shadow-lg transition`}
          onClick={() => onCustomerTypeChange(true)}
        >
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full border-2 ${
                  hasPatentCustomerNumber === true
                    ? "border-brand-500"
                    : "border-neutral-300"
                } flex items-center justify-center mr-2`}
              >
                {hasPatentCustomerNumber === true && (
                  <span className="bg-brand-500 w-3 h-3 rounded-full block" />
                )}
              </span>
              특허고객번호가 있어요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-neutral-700 text-sm space-y-2">
              <div>• 이미 특허청에 특허고객번호를 등록하신 분</div>
              <div>• 간편한 정보 입력으로 빠른 출원 가능</div>
              <div>• 기존 등록된 정보 활용</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border-2 ${
            hasPatentCustomerNumber === false
              ? "border-brand-500"
              : "border-neutral-200"
          } hover:shadow-lg transition`}
          onClick={() => onCustomerTypeChange(false)}
        >
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full border-2 ${
                  hasPatentCustomerNumber === false
                    ? "border-brand-500"
                    : "border-neutral-300"
                } flex items-center justify-center mr-2`}
              >
                {hasPatentCustomerNumber === false && (
                  <span className="bg-brand-500 w-3 h-3 rounded-full block" />
                )}
              </span>
              특허고객번호가 없어요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-neutral-700 text-sm space-y-2">
              <div>• 처음 특허청에 출원하시는 분</div>
              <div>• 상세한 정보 입력이 필요합니다</div>
              <div>• 출원과 함께 특허고객번호 자동 발급</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
