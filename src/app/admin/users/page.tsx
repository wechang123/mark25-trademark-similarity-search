'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter, Download, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { adminService } from '@/features/admin-dashboard/_services/adminService';
import { AdminUser, UserRole } from '@/features/admin-dashboard/_types/admin.types';
import { useAdminAuth } from '@/features/admin-dashboard/_hooks/useAdminAuth';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useInView } from 'react-intersection-observer';

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Intersection Observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  useEffect(() => {
    fetchInitialUsers();
  }, []);

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchMoreUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, loadingMore]);

  const fetchInitialUsers = async () => {
    try {
      setLoading(true);
      setPage(1);
      const response = await adminService.getUsersPaginated({
        page: 1,
        limit: 10,
      });
      setUsers(response.data);
      setTotalCount(response.meta.total);
      setHasMore(response.meta.page < response.meta.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreUsers = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await adminService.getUsersPaginated({
        page: nextPage,
        limit: 10,
      });

      setUsers(prev => [...prev, ...response.data]);
      setPage(nextPage);
      setHasMore(response.meta.page < response.meta.totalPages);
    } catch (error) {
      console.error('Error fetching more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentUser || !isAdmin()) return;

    try {
      await adminService.updateUserRole(userId, newRole, currentUser);
      await fetchInitialUsers(); // Refresh the list from beginning
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'destructive';
      case UserRole.MANAGER:
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '관리자';
      case UserRole.MANAGER:
        return '매니저';
      default:
        return '사용자';
    }
  };

  const getUserInitials = (user: AdminUser) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">
            현재 {users.length}명 표시 {totalCount > 0 && `(전체 ${totalCount}명)`}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          사용자 추가
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="역할 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 역할</SelectItem>
                <SelectItem value={UserRole.ADMIN}>관리자</SelectItem>
                <SelectItem value={UserRole.MANAGER}>매니저</SelectItem>
                <SelectItem value={UserRole.USER}>사용자</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              고급 필터
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            사용자 정보를 확인하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>제공자</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>마지막 활동</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || '이름 없음'}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.provider === 'email' ? '이메일' :
                         user.provider === 'kakao' ? '카카오' : user.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'yyyy-MM-dd', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem>상세 보기</DropdownMenuItem>
                          <DropdownMenuItem>활동 로그</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isAdmin() && user.id !== currentUser?.id && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, UserRole.ADMIN)}
                                disabled={user.role === UserRole.ADMIN}
                              >
                                관리자로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, UserRole.MANAGER)}
                                disabled={user.role === UserRole.MANAGER}
                              >
                                매니저로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(user.id, UserRole.USER)}
                                disabled={user.role === UserRole.USER}
                              >
                                사용자로 변경
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            계정 비활성화
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Infinite Scroll Trigger */}
          {!loading && hasMore && (
            <div ref={ref} className="flex justify-center py-4">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>추가 사용자를 불러오는 중...</span>
                </div>
              )}
            </div>
          )}

          {/* End of List Message */}
          {!loading && !hasMore && users.length > 0 && (
            <div className="flex justify-center py-4 text-sm text-muted-foreground">
              모든 사용자를 불러왔습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}