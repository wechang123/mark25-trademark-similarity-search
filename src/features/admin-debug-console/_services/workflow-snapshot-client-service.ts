export interface WorkflowSnapshot {
  id: string
  session_id: string
  trademark_name?: string
  business_description?: string
  snapshot_data: {
    sessionId: string
    stages: any[]
    apiCalls: any[]
    dataProcessingLogs: any[]
    checkpoints: any[]
    kiprisSearches: any[]
    finalResult: any
    completedAt: string
    totalCost?: number
    totalTokens?: number
    totalExecutionTime?: number
  }
  total_cost?: number
  total_tokens?: number
  execution_time?: number
  created_at?: string
  // updated_at 컬럼이 없음
}

export class WorkflowSnapshotClientService {
  private baseUrl = '/api/admin/workflow/snapshot'

  async saveSnapshot(data: {
    session_id: string
    trademark_name?: string
    snapshot_data: any
  }): Promise<WorkflowSnapshot | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        console.error('Failed to save snapshot, status:', response.status)
        return null
      }

      const result = await response.json()
      console.log('✅ Snapshot saved successfully:', result.data?.id)
      return result.data
    } catch (error) {
      console.error('Failed to save snapshot:', error)
      return null
    }
  }

  async getSnapshots(options?: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filterByUser?: boolean
  }) {
    const params = new URLSearchParams({
      page: String(options?.page || 1),
      pageSize: String(options?.pageSize || 20),
      sortBy: options?.sortBy || 'created_at',  // analysis_date → created_at
      sortOrder: options?.sortOrder || 'desc',
      filterByUser: String(options?.filterByUser !== false) // Default to true
    })

    const response = await fetch(`${this.baseUrl}?${params}`)

    if (!response.ok) {
      throw new Error('Failed to fetch snapshots')
    }

    return response.json()
  }
  
  async getSnapshot(id: string) {
    const response = await fetch(`${this.baseUrl}?id=${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch snapshot')
    }

    const result = await response.json()
    return result.data
  }

  // RPC: Get snapshot with comments in one query
  async getSnapshotWithComments(id: string) {
    const response = await fetch(`${this.baseUrl}?id=${id}&useRpc=true`)

    if (!response.ok) {
      throw new Error('Failed to fetch snapshot with comments')
    }

    const result = await response.json()
    return result.data
  }
  
  async deleteSnapshot(id: string) {
    const response = await fetch(`${this.baseUrl}?id=${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete snapshot')
    }
    
    return response.json()
  }
}