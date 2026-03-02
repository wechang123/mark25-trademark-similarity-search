import { createClient } from "@/infrastructure/database/client";

export interface TrademarkApplicationData {
  residentNumber: string;
  nameKorean: string;
  nameEnglish: string;
  applicantType: string;
  cityProvince?: string;
  nationality?: string;
  address: string;
  addressPostalCode?: string;
  addressDetail?: string;
  addressEnglish?: string;
  addressAutoChange: "가능" | "불가능";
  phoneNumber: string;
  email: string;
  receiptMethod?: string;
  singleApplicationPossible: "가능" | "불가능";
  electronicCertificate: "신청" | "미신청";
  trademarkType?: string;
  trademarkImageUrl: string;
  industryDescription: string;
  residentRegistrationFileUrl?: string;
  sealImageUrl?: string;
  signatureImageUrl?: string;
  publicationAddressMethod?: string;
  deliveryAddress?: string;
  deliveryAddressDetail?: string;
  applicationNumber?: string;
  productClassification?: string;
  designatedProducts?: string[];
}

export interface TrademarkApplicationResponse {
  success: boolean;
  applicationId?: string;
  message?: string;
  error?: string;
}

export async function submitTrademarkApplication(
  data: TrademarkApplicationData
): Promise<TrademarkApplicationResponse> {
  try {
    const response = await fetch("/api/trademark-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "출원 신청에 실패했습니다.");
    }

    return result;
  } catch (error) {
    console.error("Trademark application error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
    };
  }
}

export async function getTrademarkApplication(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("trademark")
    .from("trademark_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateTrademarkApplicationStatus(
  id: string,
  status: string,
  updates: Partial<TrademarkApplicationData> = {}
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .schema("trademark")
    .from("trademark_applications")
    .update({
      status,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
