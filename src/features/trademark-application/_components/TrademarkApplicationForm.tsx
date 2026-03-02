"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { TrademarkApplicationFormData } from "../_types";
import { Step1CustomerType } from "./steps/Step1CustomerType";
import { Step2WithPatent } from "./steps/Step2WithPatent";
import { Step2WithoutPatent } from "./steps/Step2WithoutPatent";
import { Step3TrademarkInfo } from "./steps/Step3TrademarkInfo";
import { Step4ApplicationReview } from "./steps/Step4ApplicationReview";

// window.daum 타입 선언
declare global {
  interface Window {
    daum?: any;
  }
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function TrademarkApplicationForm() {
  const router = useRouter();

  // 상태 관리
  const [currentStep, setCurrentStep] = useState(1);
  // 특허고객번호 유무 상태 추가
  const [hasPatentCustomerNumber, setHasPatentCustomerNumber] = useState<
    boolean | null
  >(null);

  const [formData, setFormData] = useState<TrademarkApplicationFormData>({
    residentNumberFront: "",
    residentNumberBack: "",
    nameKorean: "",
    nameEnglish: "",
    applicantType: "국내자연인",
    cityProvince: "",
    nationality: "",
    sealImage: null,
    signatureImage: null,
    address: "",
    addressPostalCode: "",
    addressDetail: "",
    addressEnglish: "",
    addressAutoChange: "",
    publicationAddressMethod: "",
    deliveryAddress: "",
    deliveryAddressPostalCode: "",
    deliveryAddressDetail: "",
    phone1: "",
    phone2: "",
    phone3: "",
    email: "",
    electronicCertificate: "",
    trademarkType: "일반상표",
    trademarkImage: null,
    industryDescription: "",
    productClassification: "42류",
    designatedProducts: ["색연필"],
    applicationNumber1: "",
    applicationNumber2: "",
    applicationNumber3: "",
    receiptMethod: "온라인수령",
    patentCustomerNumber1: "",
    patentCustomerNumber2: "",
    patentCustomerNumber3: "",
    patentCustomerNumber4: "",
    sealCertificateImage: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [signatureTab, setSignatureTab] = useState<"upload" | "draw">("upload");

  const [stepError, setStepError] = useState<string>("");

  // 각 필수 입력란에 ref 추가
  const nameKoreanRef = useRef<HTMLInputElement>(null);
  const nameEnglishRef = useRef<HTMLInputElement>(null);
  const residentNumberFrontRef = useRef<HTMLInputElement>(null);
  const residentNumberBackRef = useRef<HTMLInputElement>(null);
  const cityProvinceRef = useRef<HTMLDivElement>(null);
  const nationalityRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);
  // Step2WithoutPatent에서 필요한 ref들
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const sealImageRef = useRef<HTMLDivElement>(null);
  const signatureImageRef = useRef<HTMLDivElement>(null);

  function loadDaumPostcode(): Promise<void> {
    return new Promise((resolve) => {
      if (window.daum?.Postcode) return resolve();
      const s = document.createElement("script");
      s.id = "daum-postcode-script";
      s.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
  }

  const handleRoadAddressSearch = async (
    field: "address" | "deliveryAddress"
  ) => {
    await loadDaumPostcode();
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        setFormData((prev) => ({
          ...prev,
          [`${field}PostalCode`]: data.zonecode || "",
          [field]: data.roadAddress || data.address || "",
          [`${field}Detail`]: data.buildingName || "",
        }));
      },
    }).open();
  };

  // 이벤트 핸들러 함수들 (useCallback으로 최적화)
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 고객 유형 변경 핸들러
  const handleCustomerTypeChange = useCallback(
    (hasPatent: boolean) => {
      if (
        hasPatentCustomerNumber !== null &&
        hasPatentCustomerNumber !== hasPatent
      ) {
        // 이미 입력된 데이터가 있으면 확인
        const hasInputData =
          formData.nameKorean ||
          formData.nameEnglish ||
          formData.residentNumberFront ||
          formData.residentNumberBack ||
          formData.patentCustomerNumber1 ||
          formData.patentCustomerNumber2 ||
          formData.patentCustomerNumber3 ||
          formData.patentCustomerNumber4;

        if (hasInputData) {
          const confirmed = window.confirm(
            "고객 유형을 변경하면 입력된 정보가 초기화됩니다. 계속하시겠습니까?"
          );
          if (!confirmed) return;
        }

        // 고객 정보 관련 필드 초기화
        setFormData((prev) => ({
          ...prev,
          nameKorean: "",
          nameEnglish: "",
          residentNumberFront: "",
          residentNumberBack: "",
          cityProvince: "",
          nationality: "",
          address: "",
          addressDetail: "",
          addressEnglish: "",
          addressPostalCode: "",
          phone1: "",
          phone2: "",
          phone3: "",
          email: "",
          patentCustomerNumber1: "",
          patentCustomerNumber2: "",
          patentCustomerNumber3: "",
          patentCustomerNumber4: "",
          sealImage: null,
          signatureImage: null,
        }));
      }

      setHasPatentCustomerNumber(hasPatent);
    },
    [hasPatentCustomerNumber, formData]
  );

  // 각 파일 업로드에 대해 개별적인 useCallback 함수를 생성하여 무한 루프 방지
  const handleSealImageUpload = useCallback(async (file: File | null) => {
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, sealImage: base64 }));
    } else {
      setFormData((prev) => ({ ...prev, sealImage: null }));
    }
  }, []);

  const handleSignatureImageUpload = useCallback(async (file: File | null) => {
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, signatureImage: base64 }));
    } else {
      setFormData((prev) => ({ ...prev, signatureImage: null }));
    }
  }, []);

  const handleTrademarkImageUpload = useCallback(async (file: File | null) => {
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, trademarkImage: base64 }));
    } else {
      setFormData((prev) => ({ ...prev, trademarkImage: null }));
    }
  }, []);

  const handleSealCertificateUpload = useCallback(async (file: File | null) => {
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, sealCertificateImage: base64 }));
    } else {
      setFormData((prev) => ({ ...prev, sealCertificateImage: null }));
    }
  }, []);

  const handleNextStep = () => {
    if (currentStep === 1) {
      // 1단계: 특허고객번호 유무 선택 확인
      if (hasPatentCustomerNumber === null) {
        setStepError("특허고객번호 보유 여부를 선택해주세요.");
        return;
      }
      setStepError("");
    }
    if (currentStep === 2) {
      // 2단계: 출원자 정보 입력 검증 (특허고객번호 유무에 따라 다름)
      if (hasPatentCustomerNumber === true) {
        // 특허고객번호 보유 고객 검증
        const requiredFieldsWithPatent = [
          { value: formData.nameKorean, ref: nameKoreanRef },
          { value: formData.nameEnglish, ref: nameEnglishRef },
          {
            value:
              formData.patentCustomerNumber1 &&
              formData.patentCustomerNumber2 &&
              formData.patentCustomerNumber3 &&
              formData.patentCustomerNumber4,
            ref: null,
          },
        ];

        const firstEmpty = requiredFieldsWithPatent.find((f) => !f.value);
        if (firstEmpty) {
          if (firstEmpty.ref && firstEmpty.ref.current) {
            firstEmpty.ref.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            if (firstEmpty.ref.current.focus) firstEmpty.ref.current.focus();
            firstEmpty.ref.current.classList.add("border-red-500");
            setTimeout(
              () => firstEmpty.ref.current?.classList.remove("border-red-500"),
              2000
            );
          }
          setStepError(
            "모든 필수 항목을 작성해야 다음 단계로 이동할 수 있습니다."
          );
          return;
        }

        // 인감도장/서명 이미지 첨부 검증
        const hasSealOrSignature =
          formData.sealImage || formData.signatureImage;
        if (!hasSealOrSignature) {
          setStepError("인감도장 또는 서명 이미지를 첨부해주세요.");
          return;
        }
      } else {
        // 특허고객번호 없는 고객 검증 (기존 로직)
        const requiredFields = [
          { value: formData.residentNumberFront, ref: residentNumberFrontRef },
          { value: formData.residentNumberBack, ref: residentNumberBackRef },
          { value: formData.nameKorean, ref: nameKoreanRef },
          { value: formData.nameEnglish, ref: nameEnglishRef },
          { value: formData.cityProvince, ref: cityProvinceRef },
          { value: formData.nationality, ref: nationalityRef },
          { value: formData.address, ref: addressRef },
          { value: formData.addressDetail, ref: addressDetailRef },
          {
            value: formData.phone1 && formData.phone2 && formData.phone3,
            ref: phoneRef,
          },
          { value: formData.email, ref: emailRef },
          { value: formData.receiptMethod, ref: null },
        ];

        const firstEmpty = requiredFields.find((f) => !f.value);
        if (firstEmpty) {
          if (firstEmpty.ref && firstEmpty.ref.current) {
            firstEmpty.ref.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            if (firstEmpty.ref.current.focus) firstEmpty.ref.current.focus();
            firstEmpty.ref.current.classList.add("border-red-500");
            setTimeout(
              () => firstEmpty.ref.current?.classList.remove("border-red-500"),
              2000
            );
          }
          setStepError(
            "모든 필수 항목을 작성해야 다음 단계로 이동할 수 있습니다."
          );
          return;
        }

        // 인감도장/서명 이미지 첨부 검증
        const hasSealOrSignature =
          formData.sealImage || formData.signatureImage;
        if (!hasSealOrSignature) {
          if (sealImageRef.current) {
            sealImageRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            sealImageRef.current.classList.add("border-red-500");
            setTimeout(
              () => sealImageRef.current?.classList.remove("border-red-500"),
              2000
            );
          }
          setStepError(
            "모든 필수 항목을 작성해야 다음 단계로 이동할 수 있습니다."
          );
          return;
        }
      }

      setStepError("");
    }
    if (currentStep === 3) {
      // 3단계: 상표 정보 입력 검증 (기존 2단계 로직)
      // 상표유형, 상표 사진, 업종 설명
      const requiredFieldsStep2 = [
        { value: formData.trademarkType, ref: null },
        { value: formData.trademarkImage, ref: null },
        { value: formData.industryDescription, ref: null },
        { value: formData.productClassification, ref: null },
        {
          value: formData.designatedProducts.length > 0 ? "ok" : "",
          ref: null,
        },
      ];
      // 입력하지 않은 첫 필수항목으로 스크롤 (ref가 있으면)
      const firstEmpty = requiredFieldsStep2.find((f) => !f.value);
      if (firstEmpty) {
        // 3단계는 ref가 없으므로, 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: "smooth" });
        setStepError(
          "모든 필수 항목을 작성해야 다음 단계로 이동할 수 있습니다."
        );
        return;
      }
      setStepError("");
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (currentStep === 4 && !showPayment) {
        setShowPayment(true);
        setIsSubmitting(false);
        return;
      }
      // 주소 자동변경 검증 제거 - 불가능으로 고정
      // 매핑/합치기
      const residentNumber = `${formData.residentNumberFront}-${formData.residentNumberBack}`;
      const phoneNumber = [
        formData.phone1,
        formData.phone2,
        formData.phone3,
      ].join("-");
      const applicationNumber = null; // 1999년 이전 출원번호 - null 고정

      // 특허고객번호 합치기 (하이픈 포함)
      const patentCustomerNumber =
        hasPatentCustomerNumber &&
        formData.patentCustomerNumber1 &&
        formData.patentCustomerNumber2 &&
        formData.patentCustomerNumber3 &&
        formData.patentCustomerNumber4
          ? `${formData.patentCustomerNumber1}-${formData.patentCustomerNumber2}-${formData.patentCustomerNumber3}-${formData.patentCustomerNumber4}`
          : null;

      // 단독출원 가능 여부 - 서버에서 고정값으로 처리됨

      // 서버로 보낼 데이터: 불필요한 쪼개진 값은 구조분해로 제외
      const payload = {
        residentNumber,
        nameKorean: formData.nameKorean,
        nameEnglish: formData.nameEnglish,
        applicantType: formData.applicantType,
        cityProvince: formData.cityProvince,
        nationality: formData.nationality,
        sealImage: formData.sealImage, // Base64 string
        signatureImage: formData.signatureImage, // Base64 string
        address: formData.address,
        addressDetail: formData.addressDetail,
        addressEnglish: formData.addressEnglish,
        addressPostalCode: formData.addressPostalCode,
        addressAutoChange: "불가능", // 주소자동변경 - 불가능으로 고정
        publicationAddressMethod: "신청", // 공보 주소 게재방식 - 신청(일부게재)으로 고정
        deliveryAddress: null, // 송달주소 - null 고정
        deliveryAddressPostalCode: null, // 송달주소 우편번호 - null 고정
        deliveryAddressDetail: null, // 송달주소 상세 - null 고정
        phoneNumber,
        email: formData.email,
        receiptMethod: formData.receiptMethod,
        applicationNumber,
        electronicCertificate: "미신청", // 전자등록증 - 미신청으로 고정
        trademarkType: formData.trademarkType,
        trademarkImage: formData.trademarkImage, // Base64 string
        industryDescription: formData.industryDescription,
        productClassification: formData.productClassification,
        designatedProducts: formData.designatedProducts,
        patentCustomerNumber, // 특허고객번호 (하이픈 포함)
        sealCertificateImage: formData.sealCertificateImage,
      };

      const response = await fetch("/api/trademark-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/trademark-application/success");
      } else {
        throw new Error("출원 신청에 실패했습니다.");
      }
    } catch (error) {
      alert("출원 신청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1단계: 특허고객번호 유무 선택
  const renderStep1 = () => (
    <Step1CustomerType
      hasPatentCustomerNumber={hasPatentCustomerNumber}
      onCustomerTypeChange={handleCustomerTypeChange}
    />
  );

  // 2단계: 출원인 정보 렌더링 (특허고객번호 유무에 따라 다른 폼)
  const renderStep2 = () => {
    if (hasPatentCustomerNumber === true) {
      // 특허고객번호 보유 고객용 간소화된 폼
      return (
        <Step2WithPatent
          formData={formData}
          onInputChange={handleInputChange}
          onSealImageUpload={handleSealImageUpload}
          onSignatureImageUpload={handleSignatureImageUpload}
          onSealCertificateUpload={handleSealCertificateUpload}
          signatureTab={signatureTab}
          setSignatureTab={setSignatureTab}
          nameKoreanRef={nameKoreanRef}
          nameEnglishRef={nameEnglishRef}
        />
      );
    } else {
      // 특허고객번호 없는 고객용 상세 폼
      return (
        <Step2WithoutPatent
          formData={formData}
          onInputChange={handleInputChange}
          onSealImageUpload={handleSealImageUpload}
          onSignatureImageUpload={handleSignatureImageUpload}
          signatureTab={signatureTab}
          setSignatureTab={setSignatureTab}
          onRoadAddressSearch={handleRoadAddressSearch}
          nameKoreanRef={nameKoreanRef}
          nameEnglishRef={nameEnglishRef}
          residentNumberFrontRef={residentNumberFrontRef}
          residentNumberBackRef={residentNumberBackRef}
          cityProvinceRef={cityProvinceRef}
          nationalityRef={nationalityRef}
          addressRef={addressRef}
          addressDetailRef={addressDetailRef}
          emailRef={emailRef}
          phoneRef={phoneRef}
          sealImageRef={sealImageRef}
          signatureImageRef={signatureImageRef}
        />
      );
    }
  };

  // 기존 renderStep2WithPatentNumber와 renderStep2WithoutPatentNumber 함수들은
  // 별도의 Step2WithPatent, Step2WithoutPatent 컴포넌트로 분리됨
  // 3단계: 상표 정보 입력
  const renderStep3 = () => (
    <Step3TrademarkInfo
      formData={formData}
      onInputChange={handleInputChange}
      onTrademarkImageUpload={handleTrademarkImageUpload}
    />
  );

  // 4단계: 서비스 선택 및 결제
  const renderStep4 = () => (
    <Step4ApplicationReview
      selectedService={selectedService}
      onServiceSelect={setSelectedService}
      showPayment={showPayment}
      onShowPayment={() => setShowPayment(true)}
      onHidePayment={() => setShowPayment(false)}
      onSubmit={handleSubmit}
    />
  );

  const steps = [
    { label: "고객 구분" },
    { label: "출원자 정보" },
    { label: "상표 정보" },
    { label: "신청 및 결제" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex flex-row items-center justify-between gap-2 md:gap-0 relative">
          <div className="flex items-center space-x-4 w-auto">
            <Image
              src="/logo.png"
              alt="Mark25"
              width={64}
              height={64}
              className="w-16 h-16 aspect-square object-contain cursor-pointer"
              onClick={() => router.push("/")}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900 break-keep">
                상표 출원 등록 서비스
              </h1>
              <p className="text-sm text-neutral-600">
                AI 기반 상표 출원 도우미
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="md:hidden w-12 h-12 p-0 flex items-center justify-center bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-info-600 rounded-full transition"
            aria-label="메인으로 돌아가기"
            style={{ boxShadow: "none" }}
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
          <Button
            onClick={() => router.push("/")}
            className="hidden md:block h-10 px-4 text-base w-auto max-w-xs bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold shadow-lg transition"
          >
            메인으로 돌아가기
          </Button>
        </div>
      </header>
      {/* Progress Bar */}
      <div className="bg-neutral-50 border-b border-gray-100">
        <div className="container mx-auto px-2 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={
                    "flex flex-col items-center flex-1 min-w-0 text-center " +
                    (currentStep === idx + 1
                      ? "font-bold text-gray-900"
                      : "text-gray-400")
                  }
                >
                  <div
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold ${
                      currentStep === idx + 1
                        ? "bg-brand-500 text-white"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs text-neutral-500 mt-1">
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-4 md:w-8 h-0.5 bg-neutral-200 mx-1 md:mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 gap-4">
            <div className="flex-1 flex justify-start">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="h-12 px-8 text-lg border-neutral-200 hover:border-brand-500 hover:text-brand-500 rounded-2xl"
              >
                이전
              </Button>
            </div>
            <div className="flex-1 flex justify-end flex-col items-end">
              {currentStep < 4 ? (
                <>
                  <Button
                    onClick={handleNextStep}
                    className="h-12 px-8 text-lg bg-brand-500 hover:bg-brand-600 text-white rounded-2xl"
                  >
                    다음
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  {stepError && (
                    <div className="mt-2 text-sm text-red-500 text-right">
                      {stepError}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-12 px-8 text-lg bg-brand-500 hover:bg-brand-600 text-white rounded-2xl"
                >
                  {isSubmitting ? "처리 중..." : "출원 신청하기"}
                  <FileText className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          {/* 개인정보 보호 안내 */}
          <div className="mt-8 text-md text-gray-700 text-center">
            ※ 입력하신 개인정보는 암호화되어 안전하게 보호됩니다.
          </div>
        </div>
      </main>
    </div>
  );
}
