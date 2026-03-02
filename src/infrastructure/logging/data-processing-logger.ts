/**
 * 데이터 처리 과정 로깅 서비스
 * KIPRIS 검색 결과 처리 및 데이터 변환 과정을 추적
 */

import { workflowEventBus } from '@/infrastructure/events/workflow-event-bus';
import { createClient } from '@/infrastructure/database/server';

export interface DataProcessingLogParams {
  sessionId: string;
  stage: 'kipris_search' | 'gemini_processing' | 'final_analysis' | 'similarity_calculation';
  processType: 
    | 'duplicate_removal' 
    | 'code_overlap_check' 
    | 'similarity_scoring'
    | 'code_extraction'
    | 'product_mapping'
    | 'response_parsing'
    | 'score_calculation'
    | 'risk_assessment';
  inputCount?: number;
  outputCount?: number;
  processingDetails: Record<string, any>;
  executionTimeMs?: number;
  error?: string;
}

class DataProcessingLogger {
  private static instance: DataProcessingLogger;
  private sessionId: string | null = null;
  private isDebugMode: boolean = false;

  private constructor() {}

  static getInstance(): DataProcessingLogger {
    if (!DataProcessingLogger.instance) {
      DataProcessingLogger.instance = new DataProcessingLogger();
    }
    return DataProcessingLogger.instance;
  }

  initialize(sessionId: string, isDebugMode: boolean = false) {
    this.sessionId = sessionId;
    this.isDebugMode = isDebugMode;
  }

  async log(params: DataProcessingLogParams): Promise<void> {
    try {
      const sessionId = params.sessionId || this.sessionId;
      if (!sessionId) {
        console.warn('[DataProcessingLogger] No session ID available, skipping log');
        return;
      }

      const logData = {
        session_id: sessionId,
        stage: params.stage,
        process_type: params.processType,
        input_count: params.inputCount || 0,
        output_count: params.outputCount || 0,
        processing_details: params.processingDetails,
        is_debug_mode: this.isDebugMode,
        // timestamp는 DB에서 자동 생성 (default: now())
        // execution_time_ms와 error_message는 테이블에 없는 컬럼이므로 제거
      };
      
      const supabase = await createClient();
      const { data: savedLog, error } = await supabase
        .schema('trademark_analysis')
        .from('data_processing_logs')
        .insert(logData)
        .select()
        .single();

      if (error) {
        console.error('[DataProcessingLogger] Failed to log data processing:', error);
        console.error('[DataProcessingLogger] Session ID:', sessionId);
        console.error('[DataProcessingLogger] Log data:', logData);
      } else if (savedLog) {
        // EventEmitter로 데이터 처리 이벤트 발행
        workflowEventBus.emitWorkflowEvent({
          type: 'data_processing',
          sessionId,
          data: {
            stage: params.stage,
            process_type: params.processType,
            input_count: params.inputCount || 0,
            output_count: params.outputCount || 0,
            processing_details: params.processingDetails
          }
        });
      }
    } catch (err) {
      console.error('[DataProcessingLogger] Unexpected error:', err);
    }
  }

  // Helper methods for common logging patterns
  async logDuplicateRemoval(
    sessionId: string,
    allItems: any[],
    uniqueItems: any[],
    criteria: string = 'application_number'
  ) {
    const duplicates = this.findDuplicates(allItems, criteria);
    
    await this.log({
      sessionId,
      stage: 'kipris_search',
      processType: 'duplicate_removal',
      inputCount: allItems.length,
      outputCount: uniqueItems.length,
      processingDetails: {
        removed_count: allItems.length - uniqueItems.length,
        criteria,
        duplicate_groups: duplicates,
        duplicate_application_numbers: Object.keys(duplicates)
      }
    });
  }

  async logCodeOverlapCheck(
    sessionId: string,
    items: any[],
    filteredItems: any[],
    currentCodes: string[]
  ) {
    const overlapDistribution = this.calculateOverlapDistribution(items, currentCodes);
    
    await this.log({
      sessionId,
      stage: 'kipris_search',
      processType: 'code_overlap_check',
      inputCount: items.length,
      outputCount: filteredItems.length,
      processingDetails: {
        current_codes: currentCodes,
        filtered_count: items.length - filteredItems.length,
        overlap_distribution: overlapDistribution,
        items_with_overlap: filteredItems.map(item => ({
          name: item.title,
          codes: item.similarGroupCodes,
          overlapping_codes: item.similarGroupCodes?.filter((code: string) => 
            currentCodes.includes(code)
          )
        }))
      }
    });
  }

  async logSimilarityCalculation(
    sessionId: string,
    trademarks: any[],
    scoringMethod: string = 'weighted_average'
  ) {
    const riskDistribution = {
      high: trademarks.filter(t => t.riskLevel === 'HIGH').length,
      medium: trademarks.filter(t => t.riskLevel === 'MEDIUM').length,
      low: trademarks.filter(t => t.riskLevel === 'LOW').length
    };

    await this.log({
      sessionId,
      stage: 'similarity_calculation',
      processType: 'similarity_scoring',
      inputCount: trademarks.length,
      processingDetails: {
        scoring_method: scoringMethod,
        risk_distribution: riskDistribution,
        score_ranges: {
          high: '70-100',
          medium: '40-69',
          low: '0-39'
        },
        detailed_scores: trademarks.map(t => ({
          name: t.title,
          similarity_score: t.similarityScore,
          risk_level: t.riskLevel,
          factors: {
            visual: t.visualSimilarity,
            phonetic: t.phoneticSimilarity,
            meaning: t.meaningSimilarity
          }
        }))
      }
    });
  }

  async logGeminiProcessing(
    sessionId: string,
    processType: 'code_extraction' | 'product_mapping' | 'response_parsing',
    inputData: any,
    outputData: any,
    executionTimeMs: number
  ) {
    await this.log({
      sessionId,
      stage: 'gemini_processing',
      processType,
      processingDetails: {
        input_snapshot: this.truncateData(inputData),
        output_snapshot: this.truncateData(outputData),
        transformation_type: processType,
        success: !!outputData
      },
      executionTimeMs
    });
  }

  async logFinalAnalysis(
    sessionId: string,
    registrationPossibility: number,
    factors: Record<string, any>
  ) {
    await this.log({
      sessionId,
      stage: 'final_analysis',
      processType: 'score_calculation',
      processingDetails: {
        final_score: registrationPossibility,
        calculation_factors: factors,
        risk_assessment: this.assessRisk(registrationPossibility),
        confidence_level: factors.aiConfidence || 0
      }
    });
  }

  // Utility methods
  private findDuplicates(items: any[], key: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    items.forEach(item => {
      const value = item[key];
      if (value) {
        if (!groups[value]) {
          groups[value] = [];
        }
        groups[value].push(item);
      }
    });

    // Return only groups with duplicates
    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 1)
    );
  }

  private calculateOverlapDistribution(items: any[], currentCodes: string[]): Record<string, number> {
    const distribution: Record<string, number> = {
      no_overlap: 0,
      partial_overlap: 0,
      full_overlap: 0
    };

    items.forEach(item => {
      const itemCodes = item.similarGroupCodes || [];
      const overlapCount = itemCodes.filter((code: string) => 
        currentCodes.includes(code)
      ).length;

      if (overlapCount === 0) {
        distribution.no_overlap++;
      } else if (overlapCount === itemCodes.length) {
        distribution.full_overlap++;
      } else {
        distribution.partial_overlap++;
      }
    });

    return distribution;
  }

  private assessRisk(score: number): string {
    if (score >= 70) return '낮음';
    if (score >= 40) return '보통';
    return '높음';
  }

  private truncateData(data: any, maxLength: number = 1000): any {
    const str = JSON.stringify(data);
    if (str.length <= maxLength) {
      return data;
    }
    
    return {
      truncated: true,
      preview: str.substring(0, maxLength),
      original_length: str.length
    };
  }
}

// Export singleton instance getter
export const getDataProcessingLogger = () => DataProcessingLogger.getInstance();

// Export initialization function for global use
export function initializeDataProcessingLogger(sessionId: string, isDebugMode: boolean = false) {
  const logger = DataProcessingLogger.getInstance();
  logger.initialize(sessionId, isDebugMode);
}