'use client';

import React, { useEffect, useState } from 'react';
import { StatsOverview } from '@/features/admin-dashboard/_components/dashboard/StatsOverview';
import { RecentActivities } from '@/features/admin-dashboard/_components/dashboard/RecentActivities';
import { useAdminAuth } from '@/features/admin-dashboard/_hooks/useAdminAuth';
import { adminService } from '@/features/admin-dashboard/_services/adminService';
import { AdminActivityLog, DashboardStats } from '@/features/admin-dashboard/_types/admin.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayAnalysis: 0,
    pendingRequests: 0,
    completionRate: 0,
    userGrowth: [],
    analysisChart: []
  });
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);

      // Fetch recent activities
      const recentActivities = await adminService.getRecentActivities(10);

      // If no real activities yet, use mock data for demonstration
      if (recentActivities.length === 0 && user) {
        const mockActivities: AdminActivityLog[] = [
          {
            id: '1',
            user_id: user.id,
            user_role: 'admin',
            action: 'update_user_role',
            target_table: 'profiles',
            target_id: '123',
            metadata: {
              target_name: 'user@example.com',
              old_role: 'user',
              new_role: 'manager'
            },
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
          },
          {
            id: '2',
            user_id: user.id,
            user_role: 'admin',
            action: 'view_analysis',
            target_table: 'analysis_sessions',
            target_id: '456',
            metadata: { trademark_name: '테스트 상표' },
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
          },
          {
            id: '3',
            user_id: user.id,
            user_role: 'manager',
            action: 'create_support_ticket',
            target_table: 'support_tickets',
            target_id: '789',
            metadata: { title: '사용자 문의' },
            ip_address: '192.168.1.2',
            user_agent: 'Mozilla/5.0',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          }
        ];
        setActivities(mockActivities);
      } else {
        setActivities(recentActivities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          Mark25 서비스 전체 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} loading={loading} />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>분석 추이</CardTitle>
            <CardDescription>
              최근 7일간 상표 분석 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              차트 컴포넌트 (구현 예정)
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 증가</CardTitle>
            <CardDescription>
              최근 7일간 신규 가입자 추이
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              차트 컴포넌트 (구현 예정)
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities - Full width */}
        <div className="lg:col-span-2">
          <RecentActivities activities={activities} loading={loading} />
        </div>
      </div>
    </div>
  );
}