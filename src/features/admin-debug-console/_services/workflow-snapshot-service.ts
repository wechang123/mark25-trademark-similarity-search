import { WorkflowSnapshotClientService, type WorkflowSnapshot } from './workflow-snapshot-client-service'

export interface WorkflowAnalysisState {
  sessionId: string | null
  stages: any[]
  apiCalls: any[]
  dataProcessingLogs: any[]
  checkpoints: any[]
  kiprisSearches: any[]
  finalResult: any
  businessDescription?: string
  trademarkName?: string
}

export class WorkflowSnapshotService {
  private clientService: WorkflowSnapshotClientService

  constructor() {
    this.clientService = new WorkflowSnapshotClientService()
  }

  async saveSnapshot(state: WorkflowAnalysisState): Promise<WorkflowSnapshot | null> {
    if (!state.sessionId) {
      console.error('Cannot save snapshot without session ID')
      return null
    }

    // Calculate totals
    const totalCost = state.apiCalls.reduce((sum: number, call: any) => {
      return sum + (call.cost || 0)
    }, 0)

    const totalTokens = state.apiCalls.reduce((sum: number, call: any) => {
      return sum + (call.usage?.totalTokens || 0)
    }, 0)

    const totalExecutionTime = state.apiCalls.reduce((sum: number, call: any) => {
      return sum + (call.executionTime || 0)
    }, 0)

    // Get trademark name from final result, state, or first search
    const trademarkName = 
      state.trademarkName ||
      state.finalResult?.trademarkName ||
      state.kiprisSearches?.[0]?.keyword ||
      '상표명 없음'
      
    // Get business description from state or final result
    const businessDescription = 
      state.businessDescription ||
      state.finalResult?.businessDescription ||
      ''

    const snapshotData = {
      sessionId: state.sessionId,
      stages: state.stages,
      apiCalls: state.apiCalls,
      dataProcessingLogs: state.dataProcessingLogs,
      checkpoints: state.checkpoints,
      kiprisSearches: state.kiprisSearches,
      finalResult: state.finalResult,
      completedAt: new Date().toISOString(),
      // Required fields for generated columns in DB:
      trademarkName,  // For generated column: snapshot_data->>'trademarkName'
      businessDescription,  // For generated column: snapshot_data->>'businessDescription'
      totalCost,  // For generated column: snapshot_data->'totalCost'
      totalTokens,  // For generated column: snapshot_data->'totalTokens'
      executionTimeMs: totalExecutionTime  // For generated column: snapshot_data->'executionTimeMs' (renamed)
    }

    return await this.clientService.saveSnapshot({
      session_id: state.sessionId,
      trademark_name: trademarkName,
      snapshot_data: snapshotData
    })
  }

  async getSnapshots(options?: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const offset = (page - 1) * pageSize

    return await this.clientService.getSnapshots({
      page,
      pageSize,
      sortBy: options?.sortBy || 'created_at',
      sortOrder: options?.sortOrder || 'desc'
    })
  }

  async getSnapshot(id: string) {
    return await this.clientService.getSnapshot(id)
  }

  async deleteSnapshot(id: string) {
    return await this.clientService.deleteSnapshot(id)
  }
}