import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { GoogleTagManager } from "@/shared/components/analytics/GoogleTagManager"
import { NoSSR } from "@/shared/components/NoSSR"
import { AuthProvider } from "@/features/authentication"
import { createClient } from "@/infrastructure/database/server"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mark25 - AI 기반 상표 분석 서비스",
  description: "AI 기술과 키프리스 데이터베이스를 활용한 정확한 상표 등록 가능성 분석 서비스",
  generator: 'v0.dev',
  metadataBase: new URL('https://ipdr.ai'),
  keywords: ['상표', '상표등록', 'AI', '키프리스', '상표분석', '지적재산권', '브랜드보호'],
  authors: [{ name: 'Mark25 Team' }],
  creator: 'Mark25',
  publisher: 'Mark25',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' }
    ]
  },
  manifest: '/favicon/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mark25',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 서버에서 세션 읽기 (Supabase 접속 불가 시 1초 후 null로 폴백)
  let session = null
  try {
    const supabase = await createClient()
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
    ])
    session = result && 'data' in result ? result.data.session : null
  } catch {
    // Supabase 접속 불가 시 세션 없이 진행
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5RNRSLM8"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <NoSSR>
          <GoogleTagManager gtmId="GTM-5RNRSLM8" />
        </NoSSR>
        <AuthProvider initialSession={session}>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AuthProvider>
        <NoSSR>
          <Analytics />
        </NoSSR>
      </body>
    </html>
  )
}