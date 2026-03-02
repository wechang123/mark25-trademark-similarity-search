import { NextRequest, NextResponse } from 'next/server';

/**
 * Gemini Vision API를 사용하여 상표 검색 결과 화면을 분석하고
 * 등록 가능성을 판단하는 API Route
 */
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, prompt } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('❌ [Vision Analysis] GEMINI_API_KEY not found');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // base64 데이터에서 prefix 제거 (data:image/png;base64, 부분)
    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    // Gemini Vision 분석용 프롬프트 (사용자 제공 or 기본값)
    const analysisPrompt = prompt || `
당신은 대한민국 상표 전문 변리사입니다.
첨부된 상표 검색 결과 화면을 분석하여 등록 가능성을 판단해주세요.

화면에 표시된 정보:
- 검색된 유사 상표 목록
- 각 상표의 상태 (등록/출원/공고/거절 등)
- 유사도 점수
- 유사군 코드

다음 기준으로 종합 판단:
1. 등록된 유사 상표의 개수와 유사도
2. 거절된 유사 상표가 있는지
3. 유사군 코드 충돌 여부
4. 시각적 유사성

JSON 형식으로 응답:
{
  "possibility_score": 0~100,
  "risk_level": "high" | "medium" | "low",
  "conclusion": "등록 가능" | "조건부 가능" | "등록 위험" | "등록 불가",
  "reasoning": ["근거1", "근거2", "근거3"],
  "conflicting_trademarks_count": 숫자,
  "registered_similar_count": 숫자
}
`;

    console.log('🤖 [Vision Analysis] Sending request to Gemini Vision API...');
    console.log(`📏 [Vision Analysis] Image data length: ${base64Data.length} chars`);

    // Gemini Vision API 호출
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: analysisPrompt,
                },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // 일관된 분석을 위해 낮게 설정
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ [Vision Analysis] Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze image', details: errorText },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('✅ [Vision Analysis] Gemini response received');

    // Gemini 응답 파싱
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      console.error('❌ [Vision Analysis] No text content in Gemini response');
      return NextResponse.json(
        { error: 'Invalid response from Gemini' },
        { status: 500 }
      );
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(textContent);
      console.log('✅ [Vision Analysis] Analysis result:', analysisResult);
    } catch (parseError) {
      console.error('❌ [Vision Analysis] Failed to parse Gemini response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse analysis result', rawResponse: textContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (error: any) {
    console.error('❌ [Vision Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
