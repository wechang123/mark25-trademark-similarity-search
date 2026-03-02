"use client";

import React from "react";
import { Shield, Info } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { SignaturePad } from "../SignaturePad";
import { ImageUpload } from "@/features/trademark-analysis/_components/search/image-upload";
import type { TrademarkApplicationFormData } from "../../_types";

interface Step2WithoutPatentProps {
  formData: TrademarkApplicationFormData;
  onInputChange: (field: string, value: any) => void;
  onSealImageUpload: (file: File | null) => void;
  onSignatureImageUpload: (file: File | null) => void;
  signatureTab: "upload" | "draw";
  setSignatureTab: (tab: "upload" | "draw") => void;
  onRoadAddressSearch: (field: "address" | "deliveryAddress") => void;
  nameKoreanRef: React.RefObject<HTMLInputElement | null>;
  nameEnglishRef: React.RefObject<HTMLInputElement | null>;
  residentNumberFrontRef: React.RefObject<HTMLInputElement | null>;
  residentNumberBackRef: React.RefObject<HTMLInputElement | null>;
  cityProvinceRef: React.RefObject<HTMLDivElement | null>;
  nationalityRef: React.RefObject<HTMLDivElement | null>;
  addressRef: React.RefObject<HTMLInputElement | null>;
  addressDetailRef: React.RefObject<HTMLInputElement | null>;
  emailRef: React.RefObject<HTMLInputElement | null>;
  phoneRef: React.RefObject<HTMLInputElement | null>;
  sealImageRef: React.RefObject<HTMLDivElement | null>;
  signatureImageRef: React.RefObject<HTMLDivElement | null>;
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

export function Step2WithoutPatent({
  formData,
  onInputChange,
  onSealImageUpload,
  onSignatureImageUpload,
  signatureTab,
  setSignatureTab,
  onRoadAddressSearch,
  nameKoreanRef,
  nameEnglishRef,
  residentNumberFrontRef,
  residentNumberBackRef,
  cityProvinceRef,
  nationalityRef,
  addressRef,
  addressDetailRef,
  emailRef,
  phoneRef,
  sealImageRef,
  signatureImageRef,
}: Step2WithoutPatentProps) {
  const cityProvinceOptions = [
    "서울특별시",
    "부산광역시",
    "경기도",
    "강원특별자치도",
    "충청북도",
    "충청남도",
    "전북특별자치도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주도",
    "교포",
    "군인",
    "대구광역시",
    "인천광역시",
    "광주광역시",
    "대전광역시",
    "울산광역시",
    "세종특별자치시",
  ];

  const countryOptions = [
    ...Array.from(
      new Set([
        "KR 한국",
        "JP 일본",
        "US 미국",
        "DE 독일",
        "FR 프랑스",
        "GB 영국",
        "CH 스위스",
        "NL 네덜란드",
        "IT 이탈리아",
        "SE 스웨덴",
        "AU 오스트레일리아",
        "CN 중국",
        "ES 스페인",
        "RU 러시아",
        "IN 인도",
        "BR 브라질",
        "GH 가나",
        "GA 가봉",
        "GY 가이아나",
        "GM 감비아",
        "XA 과달루프",
        "GT 과테말라",
        "XG 괌",
        "VA 교황청",
        "IB 국제사무국",
        "GD 그레나다",
        "GE 조지아",
        "GR 그리스",
        "GL 그린란드",
        "GN 기니",
        "GW 기네비쏘",
        "CV 카보베르데",
        "NA 나미비아",
        "NR 나우루",
        "NG 나이지리아",
        "ZA 남아프리카",
        "AN 네덜란드령안틸레스",
        "NP 네팔",
        "NO 노르웨이",
        "NZ 뉴질랜드",
        "XH 뉴칼레도니아",
        "DK 덴마크",
        "HU 헝가리",
        "PL 폴란드",
        "PT 포르투갈",
        "FI 핀란드",
        "SG 싱가포르",
        "TH 태국",
        "TR 터키",
        "TW 대만",
        "PH 필리핀",
        "MY 말레이시아",
        "ID 인도네시아",
        "EG 이집트",
        "IL 이스라엘",
        "SA 사우디아라비아",
        "AE 아랍에미리트",
        "AR 아르헨티나",
        "CL 칠레",
        "CO 콜롬비아",
        "PE 페루",
        "MX 멕시코",
        "CA 캐나다",
        "BE 벨기에",
        "AT 오스트리아",
        "CZ 체코",
        "SK 슬로바키아",
        "IE 아일랜드",
        "LU 룩셈부르크",
        "RO 루마니아",
        "BG 불가리아",
        "UA 우크라이나",
        "BY 벨라루스",
        "LT 리투아니아",
        "LV 라트비아",
        "EE 에스토니아",
        "HR 크로아티아",
        "SI 슬로베니아",
        "RS 세르비아",
        "ME 몬테네그로",
        "MK 북마케도니아",
        "AL 알바니아",
        "MD 몰도바",
        "BA 보스니아헤르체고비나",
        "IS 아이슬란드",
        "LI 리히텐슈타인",
        "MC 모나코",
        "SM 산마리노",
        "MT 몰타",
        "CY 키프로스",
        "TR 터키",
        "EG 이집트",
        "MA 모로코",
        "DZ 알제리",
        "TN 튀니지",
        "KE 케냐",
        "SN 세네갈",
        "CI 코트디부아르",
        "CM 카메룬",
        "ET 에티오피아",
        "SD 수단",
        "TZ 탄자니아",
        "UG 우간다",
        "ZM 잠비아",
        "ZW 짐바브웨",
        "BW 보츠와나",
        "MZ 모잠비크",
        "AO 앙골라",
        "MG 마다가스카르",
        "MU 모리셔스",
        "SC 세이셸",
        "PG 파푸아뉴기니",
        "FJ 피지",
        "WS 사모아",
        "TO 통가",
        "SB 솔로몬제도",
        "VU 바누아투",
        "FM 미크로네시아",
        "MH 마셜제도",
        "PW 팔라우",
        "KI 키리바시",
        "TV 투발루",
        "HK 홍콩",
        "MO 마카오",
        "MN 몽골",
        "KP 북한",
        "KH 캄보디아",
        "LA 라오스",
        "MM 미얀마",
        "BN 브루나이",
        "PK 파키스탄",
        "BD 방글라데시",
        "LK 스리랑카",
        "BT 부탄",
        "MV 몰디브",
        "AF 아프가니스탄",
        "IR 이란",
        "IQ 이라크",
        "SY 시리아",
        "JO 요르단",
        "LB 레바논",
        "PS 팔레스타인",
        "KW 쿠웨이트",
        "QA 카타르",
        "OM 오만",
        "YE 예멘",
        "KZ 카자흐스탄",
        "UZ 우즈베키스탄",
        "TM 투르크메니스탄",
        "KG 키르기스스탄",
        "TJ 타지키스탄",
        "AZ 아제르바이잔",
        "AM 아르메니아",
        "AD 안도라",
      ])
    ),
  ];

  return (
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

      {/* 실명 확인 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            고객 정보 확인 <span className="text-red-500">*</span>
          </CardTitle>
          <CardDescription className="text-base">
            상표 출원을 위한 고객 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                주민등록번호 <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-row w-full gap-2 items-center">
                <Input
                  ref={residentNumberFrontRef}
                  maxLength={6}
                  placeholder="앞자리"
                  value={formData.residentNumberFront}
                  onChange={(e) =>
                    onInputChange(
                      "residentNumberFront",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className="h-12 w-24 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl"
                />
                <span>-</span>
                <Input
                  ref={residentNumberBackRef}
                  maxLength={7}
                  placeholder="뒷자리"
                  value={formData.residentNumberBack}
                  onChange={(e) =>
                    onInputChange(
                      "residentNumberBack",
                      e.target.value.replace(/[^0-9]/g, "")
                    )
                  }
                  className="h-12 w-28 text-base border-neutral-200 focus:border-brand-500 focus:ring-[#007AFF] rounded-2xl"
                  type="password"
                />
              </div>
              <div className="text-sm text-info-600 mt-1">
                입력하신 민감 정보는 암호화되어 안전하게 보호됩니다.
              </div>
            </div>
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
        </CardContent>
      </Card>

      {/* 시도/국적 */}
      <Card>
        <CardHeader>
          <CardTitle>
            시도/국적 <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>
              국내 시도 <span className="text-red-500">*</span>
            </Label>
            <div ref={cityProvinceRef}>
              <Select
                value={formData.cityProvince}
                onValueChange={(v) => onInputChange("cityProvince", v)}
              >
                <SelectTrigger className="h-12 text-base border-neutral-200 rounded-2xl">
                  <SelectValue placeholder="국내시도선택" />
                </SelectTrigger>
                <SelectContent>
                  {cityProvinceOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              거주국 <span className="text-red-500">*</span>
            </Label>
            <div ref={nationalityRef}>
              <Select
                value={formData.nationality}
                onValueChange={(v) => onInputChange("nationality", v)}
              >
                <SelectTrigger className="h-12 text-base border-neutral-200 rounded-2xl">
                  <SelectValue placeholder="거주국선택" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-stretch h-full min-h-[220px]">
            {/* 인감도장 이미지 */}
            <div
              ref={sealImageRef}
              className="flex-1 flex flex-col gap-2 h-full justify-stretch"
            >
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
            <div
              ref={signatureImageRef}
              className="flex-1 flex flex-col gap-2 h-full justify-stretch"
            >
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
                    acceptedFileTypes={["image/jpeg", "image/jpg", "image/png"]}
                    forceJpg151={true}
                    placeholder="서명 이미지를 업로드하세요 (JPG, PNG)"
                  />
                ) : (
                  <SignaturePad
                    onSignatureUpload={(dataUrl) =>
                      onSignatureImageUpload(
                        dataUrl ? dataURLtoFile(dataUrl, "signature.png") : null
                      )
                    }
                  />
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-neutral-700 mt-6">
            * 인감도장은 동사무소에 신고된 것이 아니어도 무방합니다.
            <br />
            * 국내자연인, 국내 주소가 있는 외국자연인 - 인감, 서명 중 최소
            한가지 등록
            <br />
            * 국내법인, 국내 사업소가 있는 외국법인 - 인감만 등록
            <br />
            * 국내 거소가 없는 외국자연인 및 외국법인 - 인감 필요 없음
            <br />
            * 인감(서명) 이미지는 선명하고 식별이 가능하도록 준비
            <br />* 스캔 없이 휴대폰 카메라로 촬영된 이미지도 첨부 가능
          </div>
        </CardContent>
      </Card>

      {/* 국내주소 */}
      <Card>
        <CardHeader>
          <CardTitle>
            국내주소 <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="우편번호"
              value={formData.addressPostalCode || ""}
              readOnly
              className="h-12 w-40 text-base border-neutral-200 rounded-2xl bg-neutral-50 cursor-not-allowed"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onRoadAddressSearch("address")}
              className="h-12 whitespace-nowrap"
            >
              도로명검색
            </Button>
          </div>
          <Input
            ref={addressRef}
            placeholder="도로명 검색을 통해 주소를 입력해주세요"
            value={formData.address}
            readOnly
            className="h-12 text-base border-neutral-200 rounded-2xl bg-neutral-50 cursor-not-allowed"
          />
          <Input
            ref={addressDetailRef}
            placeholder="상세주소 (예: 1층, 203동 108호 등)"
            value={formData.addressDetail ?? ""}
            onChange={(e) => onInputChange("addressDetail", e.target.value)}
            className="h-12 text-base border-neutral-200 rounded-2xl"
          />
          <div className="text-xs text-info-600 mt-1">
            입력하신 민감 정보는 암호화되어 안전하게 보호됩니다.
          </div>
        </CardContent>
        <div className="text-xs text-neutral-700 px-6 pb-4">
          * 정확한 행정처리를 위해 주소를 정확히 기재하여 주시기 바랍니다.
          <br />* 국내자연인(개인)은 주민등록등본 주소지, 국내법인은
          법인등기부등본 주소지를 기입하여 신청해주시기 바랍니다.
        </div>
      </Card>

      {/* 영문 주소 */}
      <Card>
        <CardHeader>
          <CardTitle>영문 주소</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="영문 주소 입력"
            value={formData.addressEnglish ?? ""}
            onChange={(e) => onInputChange("addressEnglish", e.target.value)}
            className="h-12 text-base border-neutral-200 rounded-2xl"
          />
        </CardContent>
      </Card>

      {/* 이메일 */}
      <Card>
        <CardHeader>
          <CardTitle>
            이메일 <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            ref={emailRef}
            placeholder="이메일 입력"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className="h-12 text-base border-neutral-200 rounded-2xl"
          />
        </CardContent>
      </Card>

      {/* 전화번호 */}
      <Card>
        <CardHeader>
          <CardTitle>
            전화번호 <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              ref={phoneRef}
              maxLength={3}
              placeholder="010"
              value={formData.phone1}
              onChange={(e) =>
                onInputChange("phone1", e.target.value.replace(/[^0-9]/g, ""))
              }
              className="h-12 w-20 text-base border-neutral-200 rounded-2xl"
            />
            <span>-</span>
            <Input
              maxLength={4}
              placeholder="1234"
              value={formData.phone2}
              onChange={(e) =>
                onInputChange("phone2", e.target.value.replace(/[^0-9]/g, ""))
              }
              className="h-12 w-24 text-base border-neutral-200 rounded-2xl"
            />
            <span>-</span>
            <Input
              maxLength={4}
              placeholder="5678"
              value={formData.phone3}
              onChange={(e) =>
                onInputChange("phone3", e.target.value.replace(/[^0-9]/g, ""))
              }
              className="h-12 w-24 text-base border-neutral-200 rounded-2xl"
            />
          </div>
          <div className="text-xs text-neutral-700 mt-1">
            * 전화번호가 없는 경우 휴대폰번호를 입력 바랍니다.
          </div>
        </CardContent>
      </Card>

      {/* 고정값 안내사항 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">
            <Info className="w-5 h-5 inline mr-2" />
            출원 정보 안내
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <span className="font-semibold">•</span>
            <div>
              <span className="font-semibold">주소 자동변경:</span> 현재 출원
              시스템에서는 주소 자동변경이 적용되지 않습니다. 추후 전입신고를
              하시더라도 특허고객번호 및 등록명의인 주소는 자동으로 변경되지
              않으므로, 주소 변경이 필요한 경우 별도로 변경 신청을 하셔야
              합니다.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold">•</span>
            <div>
              <span className="font-semibold">공보 주소 게재:</span> 귀하의
              개인정보 보호를 위해 공보에는 주소의 일부만 게재됩니다. 자연인의
              경우 특허고객번호 부여와 함께 공보의 국내 주소가 시/군/구까지만
              표시되어 개인정보가 보호됩니다.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold">•</span>
            <div>
              <span className="font-semibold">특허고객번호 수령:</span> 출원
              접수 후 발급되는 특허고객번호는 온라인으로 수령됩니다. 등록된
              이메일 주소로 특허고객번호 안내문이 발송되어 빠르고 안전하게
              확인하실 수 있습니다.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold">•</span>
            <div>
              <span className="font-semibold">등록증 발급:</span> 상표 등록 시
              서면 등록증이 발급됩니다. 등록증은 우편으로 발송되며, 기재하신
              주소로 안전하게 배송됩니다.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
