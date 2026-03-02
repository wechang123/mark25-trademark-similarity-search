'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  User,
  FileEdit,
  UserPlus,
  Shield,
  Settings,
  Trash2,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AdminActivityLog } from '../../_types/admin.types';

interface RecentActivitiesProps {
  activities: AdminActivityLog[];
  loading?: boolean;
}

export function RecentActivities({ activities, loading = false }: RecentActivitiesProps) {
  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) return UserPlus;
    if (action.includes('update') || action.includes('edit')) return FileEdit;
    if (action.includes('delete') || action.includes('remove')) return Trash2;
    if (action.includes('permission') || action.includes('role')) return Shield;
    if (action.includes('setting') || action.includes('config')) return Settings;
    if (action.includes('view') || action.includes('read')) return Eye;
    return User;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-800';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-800';
    if (action.includes('permission') || action.includes('role')) return 'bg-purple-100 text-purple-800';
    if (action.includes('setting') || action.includes('config')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatAction = (log: AdminActivityLog) => {
    let description = log.action;
    if (log.target_table) {
      description += ` on ${log.target_table}`;
    }
    if (log.metadata?.target_name) {
      description += ` - ${log.metadata.target_name}`;
    }
    return description;
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>최근 활동</CardTitle>
        <Badge variant="secondary" className="ml-auto">
          실시간
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                최근 활동이 없습니다
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = getActionIcon(activity.action);
                const colorClass = getActionColor(activity.action);

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={colorClass}>
                        <Icon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {formatAction(activity)}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {activity.user_role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: ko
                          })}
                        </span>
                        {activity.ip_address && (
                          <span>IP: {activity.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}