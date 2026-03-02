import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/database/server";
import { cookies } from "next/headers";
import { withRateLimit } from "@/infrastructure/security/rate-limit";
import { uploadBase64Image } from "@/infrastructure/storage/file-upload";

export async function POST(request: NextRequest) {
  // 🔒 Rate limiting 체크 (상표 출원은 더 엄격하게)
  const rateLimitResult = await withRateLimit(request, "trademarkApplication");
  if (rateLimitResult instanceof Response) {
    return rateLimitResult;
  }

  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다. 로그인 후 다시 시도해주세요." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 필수 필드 검증 (특허고객번호 유무에 따라 다름)
    const hasPatentCustomerNumber = !!body.patentCustomerNumber;

    if (hasPatentCustomerNumber) {
      // 특허고객번호 보유 고객: 간소화된 필수 필드
      const requiredFieldsWithPatent = [
        "nameKorean",
        "nameEnglish",
        "patentCustomerNumber",
        "trademarkType",
        "trademarkImage",
        "industryDescription",
        "productClassification",
        "designatedProducts",
      ];

      for (const field of requiredFieldsWithPatent) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `${field} 필드는 필수입니다.` },
            { status: 400 }
          );
        }
      }
    } else {
      // 특허고객번호 없는 고객: 기존 상세 필수 필드
      const requiredFields = [
        "residentNumber",
        "nameKorean",
        "nameEnglish",
        "applicantType",
        "cityProvince",
        "nationality",
        "address",
        "addressDetail",
        "phoneNumber",
        "email",
        "receiptMethod",
        "trademarkType",
        "trademarkImage",
        "industryDescription",
        "addressPostalCode",
        "productClassification",
        "designatedProducts",
      ];

      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `${field} 필드는 필수입니다.` },
            { status: 400 }
          );
        }
      }
    }

    if (!body.sealImage && !body.signatureImage) {
      return NextResponse.json(
        { error: "인감도장 또는 서명 이미지는 최소 1개 첨부해야 합니다." },
        { status: 400 }
      );
    }

    // 파일 업로드 처리
    const bucketName = "trademark-files";
    const userId = user.id;

    const trademarkImageUrl = await uploadBase64Image(
      supabase,
      body.trademarkImage,
      bucketName,
      userId,
      "trademark"
    );
    if (!trademarkImageUrl) {
      return NextResponse.json(
        { error: "상표 이미지 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    const sealImageUrl = await uploadBase64Image(
      supabase,
      body.sealImage,
      bucketName,
      userId,
      "seal"
    );
    const signatureImageUrl = await uploadBase64Image(
      supabase,
      body.signatureImage,
      bucketName,
      userId,
      "signature"
    );

    // 인감증명서 업로드 처리 (선택사항)
    let sealCertificateImageUrl = null;
    if (body.sealCertificateImage) {
      sealCertificateImageUrl = await uploadBase64Image(
        supabase,
        body.sealCertificateImage,
        bucketName,
        userId,
        "seal-certificate"
      );
    }

    // 데이터 타입 변환
    const addressAutoChange = false; // 주소자동변경 - 불가능으로 고정
    const singleApplicationPossible = true; // 단독출원 가능 - 가능으로 고정
    const electronicCertificate = false; // 전자등록증 - 미신청으로 고정
    const publicationAddressMethod = true; // 공보 주소 게재방식 - 신청(일부게재)으로 고정

    // 데이터베이스에 저장 (특허고객번호 유무에 따라 다름)
    const insertData = {
      // 공통 필드
      name_korean: body.nameKorean,
      name_english: body.nameEnglish,
      applicant_type: body.applicantType || "국내자연인",

      // 특허고객번호 관련 필드
      patent_customer_number: hasPatentCustomerNumber
        ? body.patentCustomerNumber
        : null,
      seal_certificate_image_url: sealCertificateImageUrl,

      // 조건부 필드 (특허고객번호 없는 경우만)
      resident_number: hasPatentCustomerNumber ? null : body.residentNumber,
      city_province: hasPatentCustomerNumber ? null : body.cityProvince,
      nationality: hasPatentCustomerNumber ? null : body.nationality,
      // 인감/서명 이미지 (공통)
      seal_image_url: sealImageUrl,
      signature_image_url: signatureImageUrl,

      // 주소 관련 (특허고객번호 없는 경우만)
      address: hasPatentCustomerNumber ? null : body.address,
      address_detail: hasPatentCustomerNumber ? null : body.addressDetail,
      address_english: hasPatentCustomerNumber ? null : body.addressEnglish,
      address_postal_code: hasPatentCustomerNumber
        ? null
        : body.addressPostalCode,
      address_auto_change: addressAutoChange,
      publication_address_method: publicationAddressMethod,
      delivery_address: null, // 송달주소 - null 고정
      delivery_address_detail: null, // 송달주소 상세 - null 고정
      delivery_address_postal_code: null, // 송달주소 우편번호 - null 고정

      // 연락처 (특허고객번호 없는 경우만)
      phone_number: hasPatentCustomerNumber ? null : body.phoneNumber,
      email: hasPatentCustomerNumber ? null : body.email,
      receipt_method: hasPatentCustomerNumber
        ? "온라인수령"
        : body.receiptMethod,
      single_application_possible: singleApplicationPossible,
      application_number: null, // 1999년 이전 출원번호 - null 고정
      electronic_certificate: electronicCertificate,
      trademark_type: body.trademarkType,
      trademark_image_url: trademarkImageUrl,
      industry_description: body.industryDescription,
      product_classification: body.productClassification || null,
      designated_products: body.designatedProducts || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("trademark_application")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "데이터베이스 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "상표 출원 신청이 성공적으로 제출되었습니다.",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const { data, error } = await supabase
        .from("trademark_application")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "출원 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await supabase
        .from("trademark_application")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "출원 목록을 불러올 수 없습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
