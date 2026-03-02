'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Users,
  FileSearch,
  Clock,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/shared/utils';

interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

interface StatsOverviewProps {
  stats: {
    totalUsers: number;
    todayAnalysis: number;
    pendingRequests: number;
    completionRate: number;
  };
  loading?: boolean;
}

export function StatsOverview({ stats, loading = false }: StatsOverviewProps) {
  const statCards: StatCard[] = [
    {
      title: '총 사용자',
      value: stats.totalUsers.toLocaleString(),
      description: '등록된 전체 사용자',
      icon: Users,
      trend: {
        value: 12,
        isPositive: true
      },
      color: 'text-blue-600'
    },
    {
      title: '오늘 분석',
      value: stats.todayAnalysis.toLocaleString(),
      description: '오늘 진행된 상표 분석',
      icon: FileSearch,
      trend: {
        value: 8,
        isPositive: true
      },
      color: 'text-green-600'
    },
    {
      title: '대기 중',
      value: stats.pendingRequests.toLocaleString(),
      description: '처리 대기중인 요청',
      icon: Clock,
      trend: {
        value: 3,
        isPositive: false
      },
      color: 'text-yellow-600'
    },
    {
      title: '완료율',
      value: `${stats.completionRate}%`,
      description: '전체 분석 완료율',
      icon: TrendingUp,
      trend: {
        value: 5,
        isPositive: true
      },
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={cn('h-5 w-5', card.color)} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.trend && (
                  <div className={cn(
                    'flex items-center text-xs font-medium',
                    card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {card.trend.isPositive ? (
                      <ArrowUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-0.5" />
                    )}
                    {card.trend.value}%
                  </div>
                )}
              </div>
              {card.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}