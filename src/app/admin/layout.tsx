'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar';
import { Separator } from '@/shared/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { AppSidebar } from '@/features/admin-dashboard/_components/layout/AppSidebar';
import { useAdminAuth } from '@/features/admin-dashboard/_hooks/useAdminAuth';
import { canAccessAdminDashboard } from '@/features/admin-dashboard/_utils/roleGuard';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  // 개발 환경에서 /admin/debug 경로는 인증 없이 통과
  if (process.env.NODE_ENV === 'development' && pathname?.startsWith('/admin/debug')) {
    return <>{children}</>;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 개발 환경 /admin/debug는 인증 리다이렉트 건너뜀
    if (process.env.NODE_ENV === 'development' && pathname?.startsWith('/admin/debug')) return;
    if (!loading && !canAccessAdminDashboard(user?.role || null)) {
      router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  // Session timeout (30 minutes)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        router.push('/signin?reason=session_timeout');
      }, 30 * 60 * 1000); // 30 minutes
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Set up event listeners for user activity
    if (mounted && user) {
      window.addEventListener('mousedown', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      resetTimeout();
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [mounted, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !canAccessAdminDashboard(user.role)) {
    return null;
  }

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    if (typeof window === 'undefined') return [];

    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Always add home/dashboard
    breadcrumbs.push({
      label: '대시보드',
      href: '/admin/dashboard',
      isLast: segments.length === 2 && segments[0] === 'admin' && segments[1] === 'dashboard'
    });

    // Add other segments
    if (segments.length > 2) {
      let currentPath = '/admin';

      for (let i = 1; i < segments.length; i++) {
        // Skip dashboard segment as it's already in the breadcrumb
        if (segments[i] === 'dashboard') continue;

        currentPath += `/${segments[i]}`;
        const label = getBreadcrumbLabel(segments[i]);

        breadcrumbs.push({
          label,
          href: currentPath,
          isLast: i === segments.length - 1
        });
      }
    }

    return breadcrumbs;
  };

  // Helper function to get user-friendly labels
  const getBreadcrumbLabel = (segment: string) => {
    const labels: Record<string, string> = {
      'admin': '관리자',
      'dashboard': '대시보드',
      'users': '사용자 관리',
      'permissions': '권한 관리',
      'logs': '활동 로그',
      'trademarks': '상표 분석',
      'stats': '통계',
      'rejections': '거절 사례',
      'applications': '신청서 관리',
      'pending': '대기 중',
      'completed': '완료',
      'monitoring': '시스템 모니터링',
      'settings': '시스템 설정',
      'support': 'CS 관리',
      'profile': '프로필',
      'debug': '디버그 콘솔',
      'workflow': '워크플로우 모니터링',
      'api-logs': 'API 로그',
      'feedback': '피드백 보드',
      'test-rag': 'RAG 시스템 테스트',
      'similar-image-search': '유사 이미지 검색'
    };

    return labels[segment] || segment;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}