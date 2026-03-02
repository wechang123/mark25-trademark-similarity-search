import { NextRequest, NextResponse } from 'next/server'

/**
 * KIPRIS 이미지 프록시
 * 브라우저에서 CORS로 인해 직접 접근 불가능한 KIPRIS 이미지를
 * 서버 사이드에서 가져와 반환
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // KIPRIS 도메인만 허용
  if (!url.includes('kipris.or.kr') && !url.includes('kipo.go.kr')) {
    return new NextResponse('Only KIPRIS URLs are allowed', { status: 403 })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'IP-Doctor/1.0' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    return new NextResponse(`Proxy error: ${error.message}`, { status: 500 })
  }
}
