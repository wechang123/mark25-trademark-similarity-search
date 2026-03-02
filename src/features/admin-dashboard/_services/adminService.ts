import { AdminUser, AdminActivityLog, DashboardStats } from '../_types/admin.types';

/**
 * AdminService - Admin 대시보드 서비스
 * 서버 API를 통해 데이터를 가져옴 (보안 강화)
 */
export class AdminService {
  private async fetchAPI(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.fetchAPI('/api/admin/stats?includeDetails=false');
      
      // API 응답 포맷을 기존 인터페이스에 맞게 변환
      return {
        totalUsers: response.data.overview.totalUsers,
        todayAnalysis: response.data.overview.todayAnalysis,
        pendingRequests: response.data.overview.pendingRequests,
        completionRate: response.data.overview.completionRate,
        userGrowth: response.data.charts.userGrowth,
        analysisChart: response.data.charts.analysisChart.reduce((acc: any[], day: any) => {
          acc.push(
            { date: day.date, count: day.completed, status: 'completed' as const },
            { date: day.date, count: day.pending, status: 'pending' as const },
            { date: day.date, count: day.failed, status: 'failed' as const }
          );
          return acc;
        }, [])
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getRecentActivities(limit = 10): Promise<AdminActivityLog[]> {
    try {
      const response = await this.fetchAPI(`/api/admin/stats?includeDetails=true&days=7`);
      
      // recentActivities가 있으면 반환, 없으면 빈 배열
      if (response.data.recentActivities) {
        return response.data.recentActivities.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const response = await this.fetchAPI('/api/admin/users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUsersPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ data: AdminUser[]; meta: any }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.role) searchParams.set('role', params.role);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await this.fetchAPI(`/api/admin/users?${searchParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      const response = await this.fetchAPI(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUserRole(
    targetUserId: string,
    newRole: string,
    currentUser: AdminUser
  ): Promise<void> {
    try {
      await this.fetchAPI(`/api/admin/users/${targetUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.fetchAPI(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getTrademarkAnalyses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: any[]; meta: any }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      
      const response = await this.fetchAPI(`/api/admin/trademarks?${searchParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching trademark analyses:', error);
      throw error;
    }
  }

  async getTrademarkAnalysisById(analysisId: string): Promise<any> {
    try {
      const response = await this.fetchAPI(`/api/admin/trademarks/${analysisId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trademark analysis:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();