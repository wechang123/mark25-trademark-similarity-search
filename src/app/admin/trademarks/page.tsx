'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/features/admin-dashboard/_services/adminService';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';

// 상표 분석 세션 타입
interface TrademarkAnalysis {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  trademark_name: string;
  trademark_type: string;
  business_description: string;
  status: string;
  progress: number;
  current_stage: string | null;
  is_debug_mode: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  risk_level?: string;
  registration_probability?: number;
  total_cost_estimate?: number;
  product_classifications?: string[];
  similar_group_codes?: string[];
  designated_products?: string[];
}

export default function TrademarksPage() {
  const [analyses, setAnalyses] = useState<TrademarkAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load trademark analyses
  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const result = await adminService.getTrademarkAnalyses({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setAnalyses(result.data || []);
      setTotalCount(result.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load trademark analyses:', error);
      setAnalyses([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, [currentPage, sortBy, sortOrder, searchTerm, statusFilter]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Handle search (debounced)
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // Format functions
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string | undefined, maxLength: number = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">완료</Badge>;
      case 'processing':
      case 'active':
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">진행중</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="destructive">실패</Badge>;
      case 'pending':
        return <Badge variant="secondary">대기</Badge>;
      default:
        return <Badge variant="secondary">{status || '-'}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string | undefined) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">높음</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">보통</Badge>;
      case 'low':
        return <Badge variant="default" className="bg-green-500">낮음</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'desc' ?
      <ChevronDown className="h-4 w-4 inline ml-1" /> :
      <ChevronUp className="h-4 w-4 inline ml-1" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상표 분석 관리</h1>
          <p className="text-muted-foreground">
            전체 {totalCount}건의 분석 세션
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
          <CardDescription>상표명, 사업 설명, 세션 ID로 검색할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="상표명, 사업 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="failed">실패</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={loadAnalyses}
              variant="outline"
            >
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>분석 세션 목록</CardTitle>
          <CardDescription>
            완료된 상표 분석 세션을 확인할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('created_at')}
                  >
                    생성일시
                    <SortIcon column="created_at" />
                  </TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('trademark_name')}
                  >
                    상표명
                    <SortIcon column="trademark_name" />
                  </TableHead>
                  <TableHead>사업 설명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-center">진행률</TableHead>
                  <TableHead className="text-center">위험도</TableHead>
                  <TableHead className="text-right">등록가능성</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : analyses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      분석 세션이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  analyses.map((analysis) => (
                    <TableRow key={analysis.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="whitespace-nowrap">
                        {formatDate(analysis.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{analysis.user_name || analysis.user_email}</span>
                          {analysis.user_name && (
                            <span className="text-xs text-muted-foreground">{analysis.user_email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{analysis.trademark_name || '-'}</span>
                          {analysis.trademark_type && (
                            <span className="text-xs text-muted-foreground">{analysis.trademark_type}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {truncateText(analysis.business_description, 50)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(analysis.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${analysis.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{analysis.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getRiskBadge(analysis.risk_level)}
                      </TableCell>
                      <TableCell className="text-right">
                        {analysis.registration_probability
                          ? `${analysis.registration_probability}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="px-4 py-3 flex justify-between items-center border-t">
              <div className="text-sm text-muted-foreground">
                총 {totalCount}개 중 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  이전
                </Button>
                <span className="px-3 py-2 text-sm">
                  {currentPage} / {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  variant="outline"
                  size="sm"
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
