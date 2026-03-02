import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IPDR API Documentation',
  description: '상표 검색 및 분석 플랫폼의 API 명세서입니다.',
  robots: process.env.NODE_ENV === 'production' ? 'noindex, nofollow' : 'index, follow',
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}