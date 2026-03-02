import { useEffect, useState, useCallback } from 'react'
import { WorkflowData, WorkflowListItem } from '../_types/workflow.types'
import { workflowMonitoringService } from '../_services/workflowMonitoringService'

/**
 * Hook for fetching and subscribing to workflow updates
 */
export function useWorkflowSubscription(sessionId: string | null) {
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch initial data
  useEffect(() => {
    if (!sessionId) {
      setWorkflowData(null)
      return
    }
    
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await workflowMonitoringService.fetchWorkflowData(sessionId)
        if (mounted) {
          setWorkflowData(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch workflow data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    fetchData()
    
    // Subscribe to updates
    const unsubscribe = workflowMonitoringService.subscribeToWorkflowUpdates(
      sessionId,
      (data) => {
        if (mounted) {
          setWorkflowData(data)
        }
      }
    )
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [sessionId])
  
  const refresh = useCallback(async () => {
    if (!sessionId) return
    
    setLoading(true)
    try {
      const data = await workflowMonitoringService.fetchWorkflowData(sessionId)
      setWorkflowData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh workflow data')
    } finally {
      setLoading(false)
    }
  }, [sessionId])
  
  return {
    workflowData,
    loading,
    error,
    refresh
  }
}

/**
 * Hook for fetching workflow list
 */
export function useWorkflowList(status?: string) {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  
  const fetchWorkflows = useCallback(async (reset = false) => {
    setLoading(true)
    setError(null)
    
    const currentOffset = reset ? 0 : offset
    
    try {
      const data = await workflowMonitoringService.fetchWorkflowList(
        20,
        currentOffset,
        status
      )
      
      if (reset) {
        setWorkflows(data)
        setOffset(20)
      } else {
        setWorkflows(prev => [...prev, ...data])
        setOffset(prev => prev + 20)
      }
      
      setHasMore(data.length === 20)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
    } finally {
      setLoading(false)
    }
  }, [offset, status])
  
  // Initial fetch
  useEffect(() => {
    fetchWorkflows(true)
  }, [status])
  
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchWorkflows(false)
    }
  }, [fetchWorkflows, loading, hasMore])
  
  return {
    workflows,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchWorkflows(true)
  }
}