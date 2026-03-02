'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardData, DashboardResponse } from '../_types/dashboard'
import { DashboardService } from '../_services/dashboardService'

export function useDashboardData(initialPage = 1, initialLimit = 10) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const cachedPages = useRef<Map<number, DashboardData>>(new Map())

  const fetchData = async (currentPage = page, currentLimit = limit, isInitial = false) => {
    try {
      // 첫 로드인지 페이지 전환인지 구분
      if (isInitial) {
        setInitialLoading(true)
      } else {
        setPageLoading(true)
      }
      setError(null)

      const response = await DashboardService.getDashboardData(currentPage, currentLimit)

      if (response.success) {
        setData(response.data)
        // 캐시에 저장
        cachedPages.current.set(currentPage, response.data)
      } else {
        setError(response.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setPageLoading(false)
      }
    }
  }

  const refresh = async () => {
    // 캐시 초기화
    cachedPages.current.clear()
    await fetchData(1, limit, true)
    setPage(1)
  }

  const goToPage = async (targetPage: number) => {
    if (data && targetPage >= 1 && targetPage <= data.pagination.totalPages) {
      setPage(targetPage)

      // 캐시 확인
      const cachedData = cachedPages.current.get(targetPage)
      if (cachedData) {
        // 캐시된 데이터가 있으면 즉시 표시
        setData(cachedData)
        // 백그라운드에서 최신 데이터 확인
        fetchData(targetPage, limit, false)
      } else {
        // 캐시가 없으면 새로 로드
        await fetchData(targetPage, limit, false)
      }
    }
  }

  useEffect(() => {
    fetchData(initialPage, initialLimit, true)
  }, [])

  return {
    data,
    loading: initialLoading,
    pageLoading,
    error,
    page,
    limit,
    refresh,
    goToPage,
    totalPages: data ? data.pagination.totalPages : 0,
  }
}