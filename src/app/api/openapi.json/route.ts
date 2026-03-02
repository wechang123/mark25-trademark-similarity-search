import { NextRequest, NextResponse } from "next/server";
import {
  generateDevDocument,
  generateProdDocument,
} from "@/infrastructure/swagger";
import { registerDecoratedApis } from "@/infrastructure/swagger/decorators/api-decorators";

/**
 * OpenAPI JSON 스펙을 제공하는 API 엔드포인트
 * GET /api/openapi.json
 */
export async function GET(request: NextRequest) {
  try {
    // 환경별 접근 제어
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // 프로덕션 환경에서는 기본적으로 접근 제한
      const authHeader = request.headers.get("authorization");
      const apiKey = request.headers.get("x-api-key");

      // API 키 또는 Authorization 헤더가 있는지 확인
      const isDeveloper = authHeader || apiKey === process.env.API_DOCS_KEY;

      if (!isDeveloper) {
        return NextResponse.json(
          {
            error: "API 문서 접근이 제한되었습니다.",
            message: "개발자 인증이 필요합니다.",
          },
          { status: 401 }
        );
      }
    }

    // API 라우트 파일들을 미리 로드하여 등록이 완료되도록 함
    try {
      console.log("Pre-loading API routes to ensure registration...");

      // 존재하는 API 라우트만 import
      await import("../trademark-application/route");
      await import("../dashboard/route");
      await import("../openapi/stats/route");
      await import("../pre-booking/route");
      await import("../dashboard/analysis/[sessionId]/route");

      console.log("API routes pre-loaded successfully");
    } catch (error) {
      console.error("Failed to pre-load API routes:", error);
    }

    // 먼저 decorator로 등록된 API들을 처리
    try {
      console.log("Registering decorated APIs...");
      registerDecoratedApis();
      console.log("Decorated APIs registered successfully");
    } catch (error) {
      console.error("Failed to register decorated APIs:", error);
    }

    // 환경에 따른 문서 생성
    const document = isProduction
      ? generateProdDocument() // 프로덕션용 (민감한 API 제외)
      : generateDevDocument(); // 개발용 (모든 API 포함)

    // CORS 헤더 설정
    const response = NextResponse.json(document);

    // 개발 환경에서는 모든 origin 허용
    if (!isProduction) {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    // 캐시 설정 (개발: 캐시 없음, 프로덕션: 1시간)
    const cacheControl = isProduction
      ? "public, max-age=3600, s-maxage=3600" // 1시간 캐시
      : "no-cache, no-store, must-revalidate"; // 캐시 없음

    response.headers.set("Cache-Control", cacheControl);
    response.headers.set("Content-Type", "application/json");

    return response;
  } catch (error) {
    console.error("OpenAPI document generation failed:", error);

    return NextResponse.json(
      {
        error: "OpenAPI 문서 생성에 실패했습니다.",
        message:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });

  // CORS 헤더 설정
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key"
  );
  response.headers.set("Access-Control-Max-Age", "86400"); // 24시간

  return response;
}
