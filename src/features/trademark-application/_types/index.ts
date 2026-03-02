// 상표 출원 관련 타입 정의

export interface TrademarkApplicationFormData {
  residentNumberFront: string;
  residentNumberBack: string;
  nameKorean: string;
  nameEnglish: string;
  applicantType: "국내자연인" | "법인" | "외국인";
  cityProvince: string;
  nationality: string;
  sealImage: string | null; // Base64 string
  signatureImage: string | null; // Base64 string
  address: string;
  addressPostalCode: string;
  addressDetail: string;
  addressEnglish: string;
  addressAutoChange: string;
  publicationAddressMethod: string;
  deliveryAddress?: string; // 옵셔널 - UI에서 제거됨
  deliveryAddressPostalCode?: string; // 옵셔널 - UI에서 제거됨
  deliveryAddressDetail?: string; // 옵셔널 - UI에서 제거됨
  phone1: string;
  phone2: string;
  phone3: string;
  email: string;
  electronicCertificate: string;
  trademarkType: "일반상표" | "특수상표"; // 실제 사용값으로 수정
  trademarkImage: string | null; // Base64 string
  industryDescription: string;
  productClassification: string;
  designatedProducts: string[];
  applicationNumber1?: string; // 옵셔널 - UI에서 제거됨
  applicationNumber2?: string; // 옵셔널 - UI에서 제거됨
  applicationNumber3?: string; // 옵셔널 - UI에서 제거됨
  receiptMethod: "온라인수령" | "우편수령";
  patentCustomerNumber1?: string; // 특허고객번호 첫 번째 부분 (1자리)
  patentCustomerNumber2?: string; // 특허고객번호 두 번째 부분 (4자리)
  patentCustomerNumber3?: string; // 특허고객번호 세 번째 부분 (6자리)
  patentCustomerNumber4?: string; // 특허고객번호 네 번째 부분 (1자리)
  sealCertificateImage?: string | null; // 인감증명서 이미지 Base64
}

export type AddressAutoChangeValue = "가능" | "불가능";
export type SingleApplicationValue = "가능" | "불가능";
export type ElectronicCertificateValue = "신청" | "미신청";

export interface TrademarkApplicationResponse {
  success: boolean;
  message: string;
  applicationId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface PostcodeData {
  address: string;
  zonecode: string;
  buildingName?: string;
  apartment?: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  recommended?: boolean;
}
