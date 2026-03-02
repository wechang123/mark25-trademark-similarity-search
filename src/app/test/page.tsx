/**
 * 테스트 페이지 인덱스
 * 
 * 모든 테스트 페이지에 대한 중앙 집중식 네비게이션
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Play, 
  Zap, 
  Target, 
  CheckCircle,
  Clock,
  FileText,
  MessageCircle,
  ArrowRight 
} from 'lucide-react';

interface TestPage {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  status: 'completed' | 'in-progress' | 'planned';
  features: string[];
}

const testPages: TestPage[] = [
  {
    id: 'stage2-analysis',
    title: 'Stage 2 분석 테스트',
    description: 'LangGraph 워크플로우와 연동한 Stage 2 분석 로직 테스트',
    href: '/test/stage2-analysis',
    icon: <Zap className="w-5 h-5" />,
    status: 'completed',
    features: ['LangGraph 워크플로우', 'Supabase 저장', '3가지 평가 기준 변환']
  },
  {
    id: 'stage3-actions',
    title: 'Stage 3 액션 테스트',
    description: '출원하기/전문가 상담 모달과 API 연동 테스트',
    href: '/test/stage3-actions',
    icon: <Target className="w-5 h-5" />,
    status: 'completed',
    features: ['ApplicationModal', 'ConsultationModal', 'Stage 3 API']
  },
  {
    id: 'complete-flow',
    title: '완전한 플로우 테스트',
    description: 'Stage 1 → Stage 2 → Stage 3 전체 플로우 end-to-end 테스트',
    href: '/test/complete-flow',
    icon: <CheckCircle className="w-5 h-5" />,
    status: 'completed',
    features: ['3단계 통합 플로우', '시나리오별 테스트', '실시간 진행률']
  },
  {
    id: 'pdf-generation',
    title: 'PDF 리포트 생성',
    description: '상표 분석 결과를 PDF로 생성하고 다운로드하는 기능 테스트',
    href: '/test/pdf-generation',
    icon: <FileText className="w-5 h-5" />,
    status: 'completed',
    features: ['PDF 생성', 'Mock Download', '다양한 옵션']
  },
  {
    id: 'rag-experiment',
    title: 'RAG 실험 (기존)',
    description: 'GCP Agent Builder RAG 시스템 실험 페이지',
    href: '/test/rag-experiment',
    icon: <MessageCircle className="w-5 h-5" />,
    status: 'completed',
    features: ['GCP RAG', 'Expert Analysis', 'Document Search']
  }
];

const getStatusColor = (status: TestPage['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: TestPage['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-3 h-3" />;
    case 'in-progress': return <Clock className="w-3 h-3" />;
    case 'planned': return <Play className="w-3 h-3" />;
    default: return <Play className="w-3 h-3" />;
  }
};

export default function TestIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            🧪 테스트 센터
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            3단계 상표 분석 시스템의 모든 컴포넌트와 플로우를 테스트할 수 있습니다
          </p>
          
          {/* 통계 */}
          <div className="flex justify-center space-x-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testPages.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">완료됨</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {testPages.filter(p => p.status === 'in-progress').length}
              </div>
              <div className="text-xs text-gray-600">진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {testPages.length}
              </div>
              <div className="text-xs text-gray-600">전체</div>
            </div>
          </div>
        </div>

        {/* 추천 플로우 */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <MessageCircle className="w-5 h-5" />
              <span>💡 추천 테스트 순서</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Badge variant="outline" className="text-xs">1</Badge>
              <span>Stage 2 분석 테스트로 개별 분석 로직 확인</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Badge variant="outline" className="text-xs">2</Badge>
              <span>Stage 3 액션 테스트로 모달과 API 연동 확인</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Badge variant="outline" className="text-xs">3</Badge>
              <span>완전한 플로우 테스트로 전체 시스템 검증</span>
            </div>
          </CardContent>
        </Card>

        {/* 테스트 페이지 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {testPages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {page.icon}
                    </div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs border ${getStatusColor(page.status)}`}
                  >
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(page.status)}
                      <span className="capitalize">{page.status}</span>
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {page.description}
                </p>
                
                {/* 기능 목록 */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">포함된 기능:</p>
                  <div className="flex flex-wrap gap-1">
                    {page.features.map((feature, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* 액션 버튼 */}
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={page.href}>
                      <Play className="w-4 h-4 mr-2" />
                      테스트 시작
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 개발 정보 */}
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">🔧 개발 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p><strong>Architecture:</strong> 3-Stage Flow (Stage 1 → Stage 2 → Stage 3)</p>
            <p><strong>Backend:</strong> Next.js API Routes + Supabase + LangGraph</p>
            <p><strong>Frontend:</strong> React 19 + TypeScript + Tailwind CSS + shadcn/ui</p>
            <p><strong>AI Integration:</strong> Gemini 2.5 Pro + GCP Agent Builder RAG</p>
            <p><strong>Database:</strong> Normalized schema with RLS policies</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}