import { 
  WorkflowData, 
  WorkflowDetailResponse, 
  WorkflowListItem,
  WorkflowStage,
  STAGE_NAMES,
  getStageStatus
} from '../_types/workflow.types'

class WorkflowMonitoringService {
  private baseUrl = '/api/admin/workflow'
  
  /**
   * Fetch list of workflows for dropdown selector
   */
  async fetchWorkflowList(
    limit = 20,
    offset = 0,
    status?: string
  ): Promise<WorkflowListItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit, offset, status }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.workflows || []
    } catch (error) {
      console.error('Error fetching workflow list:', error)
      throw error
    }
  }
  
  /**
   * Fetch detailed workflow data for monitoring
   */
  async fetchWorkflowData(sessionId: string): Promise<WorkflowData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${sessionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch workflow: ${response.statusText}`)
      }
      
      const data: WorkflowDetailResponse = await response.json()
      return this.transformToWorkflowData(data)
    } catch (error) {
      console.error('Error fetching workflow data:', error)
      throw error
    }
  }
  
  /**
   * Transform API response to UI-friendly format
   */
  private transformToWorkflowData(response: WorkflowDetailResponse): WorkflowData {
    const { session, apiCalls, dataProcessing, checkpoints, kiprisSearches, finalResult } = response

    // Group API calls and data processing by stage
    const stageGroups = this.groupByStage(apiCalls, dataProcessing)

    // Create stage objects
    const stages: WorkflowStage[] = [
      this.createStage('goods_classifier', stageGroups, session),
      this.createStage('kipris_search', stageGroups, session, kiprisSearches),
      this.createStage('final_analysis', stageGroups, session, finalResult)
    ]

    // Build workflow data
    // TODO: Add user profile lookup to get email/name from user_id
    const workflowData: WorkflowData = {
      workflowId: session.id,
      sessionId: session.id,
      userId: session.user_id || '',
      userEmail: session.user_id || '', // Fallback to user_id until we add user lookup
      userName: undefined, // Will need user profile lookup
      name: session.trademark_name,
      type: session.trademark_type,
      descriptions: session.business_description ? [session.business_description] : [],
      classifications: session.product_classification_codes || [],
      status: session.status as any,
      requestTime: session.created_at,
      completedTime: session.completed_at,
      stages,
      currentProgress: session.progress,
      checkpoints,
      finalResult: finalResult || undefined,
      confidence: finalResult?.ai_confidence,
      registrationProbability: finalResult?.registration_probability
    }
    
    return workflowData
  }
  
  /**
   * Group API calls and data processing by stage
   */
  private groupByStage(apiCalls: any[], dataProcessing: any[]) {
    const groups: Record<string, { apiCalls: any[], dataProcessing: any[] }> = {
      'goods_classifier': { apiCalls: [], dataProcessing: [] },
      'kipris_search': { apiCalls: [], dataProcessing: [] },
      'final_analysis': { apiCalls: [], dataProcessing: [] }
    }
    
    // Group API calls
    apiCalls.forEach(call => {
      if (groups[call.stage]) {
        groups[call.stage].apiCalls.push(call)
      }
    })
    
    // Group data processing
    dataProcessing.forEach(proc => {
      if (groups[proc.stage]) {
        groups[proc.stage].dataProcessing.push(proc)
      }
    })
    
    return groups
  }
  
  /**
   * Create a stage object from grouped data
   */
  private createStage(
    stageKey: string,
    stageGroups: Record<string, { apiCalls: any[], dataProcessing: any[] }>,
    session: any,
    additionalData?: any
  ): WorkflowStage {
    const group = stageGroups[stageKey]
    const lastApiCall = group.apiCalls[group.apiCalls.length - 1]
    
    // Determine stage status
    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending'
    
    if (lastApiCall) {
      if (lastApiCall.error_message) {
        status = 'failed'
      } else if (lastApiCall.response_timestamp) {
        status = 'completed'
      } else {
        status = 'processing'
      }
    } else {
      // Check session timestamps for stage status
      if (stageKey === 'kipris_search' && session.stage2_started_at) {
        status = session.stage2_completed_at ? 'completed' : 'processing'
      } else if (stageKey === 'final_analysis' && session.stage3_started_at) {
        status = session.stage3_completed_at ? 'completed' : 'processing'
      }
    }
    
    // Build metadata
    const metadata: any = {}
    
    if (lastApiCall) {
      metadata.tokensUsed = lastApiCall.tokens_used
      metadata.executionTimeMs = lastApiCall.execution_time_ms
      metadata.cost = lastApiCall.cost_estimate
    }
    
    // Add data processing counts
    const lastDataProc = group.dataProcessing[group.dataProcessing.length - 1]
    if (lastDataProc) {
      metadata.inputCount = lastDataProc.input_count
      metadata.outputCount = lastDataProc.output_count
    }
    
    // Add stage-specific metadata
    if (stageKey === 'kipris_search' && additionalData) {
      const kiprisSearch = Array.isArray(additionalData) ? additionalData[0] : additionalData
      if (kiprisSearch) {
        metadata.searchCount = kiprisSearch.total_results
        metadata.filteredCount = kiprisSearch.same_industry_count
      }
    } else if (stageKey === 'final_analysis' && additionalData) {
      metadata.confidence = additionalData.ai_confidence
    }
    
    // Create stage object
    const stage: WorkflowStage = {
      id: `stage-${stageKey}`,
      name: STAGE_NAMES[stageKey] || stageKey,
      status,
      metadata,
      dataProcessing: group.dataProcessing
    }
    
    // Add timing information
    if (lastApiCall) {
      stage.startTime = lastApiCall.request_timestamp
      if (lastApiCall.response_timestamp) {
        stage.endTime = lastApiCall.response_timestamp
      }
      stage.request = lastApiCall.request_data
      stage.response = lastApiCall.response_data
      stage.error = lastApiCall.error_message
    }
    
    return stage
  }
  
  /**
   * Subscribe to real-time workflow updates
   */
  subscribeToWorkflowUpdates(
    sessionId: string,
    onUpdate: (data: WorkflowData) => void
  ): () => void {
    // This will be implemented with Supabase realtime
    // For now, return a no-op unsubscribe function
    console.log('Real-time subscription not yet implemented for session:', sessionId)
    
    // Poll for updates every 5 seconds as a temporary solution
    const interval = setInterval(async () => {
      try {
        const data = await this.fetchWorkflowData(sessionId)
        if (data) {
          onUpdate(data)
        }
      } catch (error) {
        console.error('Error polling workflow updates:', error)
      }
    }, 5000)
    
    // Return unsubscribe function
    return () => clearInterval(interval)
  }
}

export const workflowMonitoringService = new WorkflowMonitoringService()