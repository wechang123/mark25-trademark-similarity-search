'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useToast } from '@/shared/components/ui/use-toast';
import {
  LayoutDashboard,
  Users,
  Search,
  Settings,
  Headphones,
  ChevronDown,
  FileText,
  Activity,
  LogOut,
  User as UserIcon,
  ChevronsUpDown,
  Bug
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/shared/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useAdminAuth } from '../../_hooks/useAdminAuth';
import { UserRole, PermissionType } from '../../_types/admin.types';
import { createClient } from '@/infrastructure/database/client';
import { useRouter } from 'next/navigation';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  href: string;
  requiredPermission?: PermissionType;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  subItems?: {
    title: string;
    href: string;
    requiredPermission?: PermissionType;
    disabled?: boolean;
    comingSoon?: boolean;
  }[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission } = useAdminAuth();
  const supabase = createClient();
  const [openMenus, setOpenMenus] = React.useState<string[]>([]);
  const { toast } = useToast();

  if (!user) return null;

  const menuConfig: Record<UserRole, MenuItem[]> = {
    [UserRole.ADMIN]: [
      {
        title: '대시보드',
        icon: LayoutDashboard,
        href: '/admin/dashboard'
      },
      {
        title: '사용자 관리',
        icon: Users,
        href: '/admin/users',
        requiredPermission: PermissionType.USER_MANAGEMENT,
        subItems: [
          { title: '사용자 목록', href: '/admin/users' },
          { title: '권한 관리', href: '/admin/users/permissions', disabled: true, comingSoon: true },
          { title: '활동 로그', href: '/admin/users/logs', disabled: true, comingSoon: true }
        ]
      },
      {
        title: '디버그 콘솔',
        icon: Bug,
        href: '/admin/debug',
        requiredPermission: PermissionType.SYSTEM_CONFIG,
        subItems: [
          { title: '워크플로우 모니터링', href: '/admin/debug/workflow' },
          { title: 'RAG 시스템 테스트', href: '/admin/debug/test-rag' },
          { title: '피드백 보드', href: '/admin/debug/feedback' },
          { title: '유사 이미지 검색', href: '/admin/debug/similar-image-search' },
          { title: 'API 로그', href: '/admin/debug/api-logs', disabled: true, comingSoon: true },
          { title: '데이터 처리 로그', href: '/admin/debug/data-logs', disabled: true, comingSoon: true }
        ]
      },
      {
        title: '상표 분석',
        icon: Search,
        href: '/admin/trademarks',
        subItems: [
          { title: '분석 목록', href: '/admin/trademarks' },
          { title: '통계', href: '/admin/trademarks/stats', disabled: true, comingSoon: true },
          { title: '거절 사례', href: '/admin/trademarks/rejections', disabled: true, comingSoon: true }
        ]
      },
      {
        title: '신청서 관리',
        icon: FileText,
        href: '/admin/applications',
        disabled: true,
        comingSoon: true,
        subItems: [
          { title: '신청 목록', href: '/admin/applications', disabled: true, comingSoon: true },
          { title: '대기 중', href: '/admin/applications/pending', disabled: true, comingSoon: true },
          { title: '완료', href: '/admin/applications/completed', disabled: true, comingSoon: true }
        ]
      },
      {
        title: '시스템 모니터링',
        icon: Activity,
        href: '/admin/monitoring',
        requiredPermission: PermissionType.SYSTEM_CONFIG,
        disabled: true,
        comingSoon: true
      },
      {
        title: '시스템 설정',
        icon: Settings,
        href: '/admin/settings',
        requiredPermission: PermissionType.SYSTEM_CONFIG,
        disabled: true,
        comingSoon: true
      }
    ],
    [UserRole.MANAGER]: [
      {
        title: '대시보드',
        icon: LayoutDashboard,
        href: '/admin/dashboard'
      },
      {
        title: '사용자 목록',
        icon: Users,
        href: '/admin/users'
      },
      {
        title: '상표 분석',
        icon: Search,
        href: '/admin/trademarks',
        requiredPermission: PermissionType.ANALYTICS_VIEW,
        subItems: [
          { title: '분석 목록', href: '/admin/trademarks' },
          { title: '통계', href: '/admin/trademarks/stats', disabled: true, comingSoon: true }
        ]
      },
      {
        title: 'CS 관리',
        icon: Headphones,
        href: '/admin/support',
        disabled: true,
        comingSoon: true
      }
    ],
    [UserRole.USER]: []
  };

  const menuItems = menuConfig[user.role] || [];

  const toggleMenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: MenuItem) => {
    if (pathname === item.href) return true;
    return item.subItems?.some(sub => pathname === sub.href) || false;
  };

  const canViewMenuItem = (item: MenuItem) => {
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }
    return true;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "준비 중",
      description: "이 기능은 현재 개발 중입니다.",
      duration: 3000,
    });
  };

  const getUserInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const getRoleDisplayName = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return '관리자';
      case UserRole.MANAGER:
        return '매니저';
      default:
        return '사용자';
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Mark25 Admin</span>
                  <span className="text-xs">관리자 대시보드</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메인 메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (!canViewMenuItem(item)) return null;

                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = openMenus.includes(item.title);
                const isActiveItem = isParentActive(item);

                return (
                  <SidebarMenuItem key={item.href}>
                    {hasSubItems ? (
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => !item.disabled && toggleMenu(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActiveItem}
                            className={item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            onClick={item.disabled ? handleDisabledClick : undefined}
                          >
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                            {item.comingSoon && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">준비중</span>
                            )}
                            <ChevronDown
                              className={`ml-auto size-4 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton
                                  asChild={!subItem.disabled}
                                  isActive={isActive(subItem.href)}
                                  className={subItem.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                  onClick={subItem.disabled ? handleDisabledClick : undefined}
                                >
                                  {subItem.disabled ? (
                                    <span className="flex items-center">
                                      {subItem.title}
                                      {subItem.comingSoon && (
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">준비중</span>
                                      )}
                                    </span>
                                  ) : (
                                    <Link href={subItem.href}>
                                      {subItem.title}
                                    </Link>
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton
                        asChild={!item.disabled}
                        tooltip={item.title}
                        isActive={isActive(item.href)}
                        className={item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        onClick={item.disabled ? handleDisabledClick : undefined}
                      >
                        {item.disabled ? (
                          <span className="flex items-center w-full">
                            <Icon className="size-4" />
                            <span className="ml-2">{item.title}</span>
                            {item.comingSoon && (
                              <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">준비중</span>
                            )}
                            {item.badge && (
                              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        ) : (
                          <Link href={item.href}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name || user.email}
                    </span>
                    <span className="truncate text-xs">{getRoleDisplayName()}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="rounded-lg">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name || user.email}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}