/**
 * Stage 3 사용자 액션 처리 서비스
 * 
 * 분석 완료 후 사용자가 수행할 수 있는 액션들을 처리:
 * - 출원하기 (apply)
 * - 전문가 상담 (consult) 
 * - 결과 저장 (save)
 * - PDF 다운로드
 */

// import { createServerClient } from '@/infrastructure/database/server';
import { Stage2Data, Stage3Data } from '../_types/simplified-types';

export interface Stage3ActionInput {
  stage2Id: string;
  userId?: string;
  action: 'apply' | 'consult' | 'save' | 'retry';
  actionData?: {
    // 출원하기 관련 데이터
    applicantInfo?: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };
    // 상담 예약 관련 데이터
    consultationPreferences?: {
      preferredDate: string;
      preferredTime: string;
      contactMethod: 'phone' | 'email' | 'video';
      urgency: 'low' | 'medium' | 'high';
    };
  };
}

export interface Stage3ActionResult {
  success: boolean;
  stage3Id?: string;
  actionResult?: {
    applicationId?: string;
    consultationBookingId?: string;
    pdfUrl?: string;
  };
  error?: string;
}

/**
 * Stage 3 사용자 액션 처리 서비스
 */
export class Stage3ActionsService {
  // private supabase = createServerClient();

  /**
   * 사용자 액션 처리 메인 함수
   */
  async processAction(input: Stage3ActionInput): Promise<Stage3ActionResult> {
    console.log('🎯 [Stage3] Processing user action:', {
      stage2Id: input.stage2Id,
      action: input.action,
      hasUserId: !!input.userId
    });

    try {
      // 1. Stage 2 데이터 조회
      const stage2Data = await this.getStage2Data(input.stage2Id);
      if (!stage2Data) {
        return {
          success: false,
          error: 'Stage 2 분석 결과를 찾을 수 없습니다.'
        };
      }

      // 2. 액션별 처리
      let actionResult = {};
      switch (input.action) {
        case 'apply':
          actionResult = await this.processApplicationSubmission(stage2Data, input.actionData?.applicantInfo);
          break;
        case 'consult':
          actionResult = await this.processConsultationBooking(stage2Data, input.actionData?.consultationPreferences);
          break;
        case 'save':
          actionResult = await this.processSaveResults(stage2Data);
          break;
        case 'retry':
          actionResult = await this.processRetryAnalysis(stage2Data);
          break;
        default:
          throw new Error(`Unsupported action: ${input.action}`);
      }

      // 3. Stage 3 결과 저장
      const stage3Id = await this.saveStage3Results({
        stage2Id: input.stage2Id,
        userId: input.userId,
        action: input.action,
        actionResult,
        stage2Data
      });

      console.log('✅ [Stage3] Action processed successfully:', {
        stage3Id,
        action: input.action
      });

      return {
        success: true,
        stage3Id,
        actionResult
      };

    } catch (error) {
      console.error('❌ [Stage3] Action processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 출원 신청 처리
   */
  private async processApplicationSubmission(
    stage2Data: any,
    applicantInfo?: any
  ) {
    console.log('📋 [Stage3] Processing application submission');

    // TODO: 실제 출원 시스템 연동
    // 현재는 모의 처리
    const applicationId = `APP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // 출원 정보 저장 (향후 구현)
    // await this.saveApplicationData({
    //   applicationId,
    //   stage2Id: stage2Data.id,
    //   applicantInfo,
    //   trademarkData: stage2Data
    // });

    return {
      applicationId,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      estimatedProcessingTime: '3-5 영업일',
      message: '출원 신청이 접수되었습니다. 담당자가 검토 후 연락드리겠습니다.'
    };
  }

  /**
   * 전문가 상담 예약 처리
   */
  private async processConsultationBooking(
    stage2Data: any,
    consultationPreferences?: any
  ) {
    console.log('💬 [Stage3] Processing consultation booking');

    // TODO: 상담 예약 시스템 연동
    // 현재는 모의 처리
    const bookingId = `CONSULT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    return {
      consultationBookingId: bookingId,
      status: 'pending',
      bookedAt: new Date().toISOString(),
      preferredDate: consultationPreferences?.preferredDate || '상담사와 조율 후 확정',
      contactMethod: consultationPreferences?.contactMethod || 'phone',
      estimatedResponse: '24시간 이내',
      message: '전문가 상담 예약이 접수되었습니다. 담당 변리사가 연락드리겠습니다.'
    };
  }

  /**
   * 결과 저장 처리
   */
  private async processSaveResults(stage2Data: any) {
    console.log('💾 [Stage3] Processing save results');

    return {
      savedAt: new Date().toISOString(),
      message: '분석 결과가 저장되었습니다.'
    };
  }

  /**
   * 재분석 요청 처리
   */
  private async processRetryAnalysis(stage2Data: any) {
    console.log('🔄 [Stage3] Processing retry analysis');

    return {
      retryRequestedAt: new Date().toISOString(),
      message: '재분석 요청이 접수되었습니다. 새로운 분석을 시작하시겠습니까?'
    };
  }

  /**
   * Stage 2 데이터 조회
   */
  private async getStage2Data(stage2Id: string) {
    try {
      // Database queries temporarily disabled for cleanup
      console.log('📊 [Stage3] Mock Stage 2 data fetch for:', stage2Id);
      return null;
    } catch (error) {
      console.error('❌ [Stage3] Error fetching Stage 2 data:', error);
      return null;
    }
  }

  /**
   * Stage 3 결과 저장
   */
  private async saveStage3Results(params: {
    stage2Id: string;
    userId?: string;
    action: string;
    actionResult: any;
    stage2Data: any;
  }): Promise<string> {
    try {
      // Database save operations temporarily disabled during cleanup

      // Database save temporarily disabled for cleanup
      const mockId = `stage3_${Date.now()}`;
      console.log('💾 [Stage3] Mock results saved:', mockId, 'for params:', params.action);
      return mockId;

    } catch (error) {
      console.error('❌ [Stage3] Failed to save results:', error);
      throw error;
    }
  }
}

// 서비스 인스턴스 생성 및 export
export const stage3ActionsService = new Stage3ActionsService();