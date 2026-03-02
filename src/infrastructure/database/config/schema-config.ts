/**
 * 데이터베이스 스키마 설정
 * 
 * 스키마와 테이블 정보를 중앙화하여 관리합니다.
 * 스키마 변경 시 이 파일만 수정하면 됩니다.
 * 
 * Last Updated: 2025-09-20
 * Based on actual database structure from Supabase
 */

export const DATABASE_SCHEMAS = {
  // Public 스키마 (기본)
  PUBLIC: {
    name: 'public',
    tables: {
      // 서비스 예약
      SERVICE_PRE_BOOKINGS: 'service_pre_bookings',
      
      // 상표 관련
      TRADEMARK_APPLICATION: 'trademark_application',
      KIPRIS_SIMILARITY_CODES: 'kipris_similarity_codes',
      KIPRIS_TRADEMARK_METADATA: 'kipris_trademark_metadata',
      KIPRIS_IMAGE_VECTOR_MAPPINGS: 'kipris_image_vector_mappings',
    }
  },
  
  // Trademark Analysis 스키마 - 상표 분석 워크플로우
  TRADEMARK_ANALYSIS: {
    name: 'trademark_analysis',
    tables: {
      // 핵심 분석 테이블
      ANALYSIS_SESSIONS: 'analysis_sessions',
      TRADEMARK_FINAL_ANALYSIS: 'trademark_final_analysis',
      
      // KIPRIS 검색 결과
      KIPRIS_SEARCH_RESULTS: 'kipris_search_results',
      
      // LangGraph 워크플로우
      LANGGRAPH_EXECUTIONS: 'langgraph_executions',
      WORKFLOW_EVENTS: 'workflow_events',
      
      // 로깅
      API_CALL_LOGS: 'api_call_logs',
      DATA_PROCESSING_LOGS: 'data_processing_logs',
    }
  },
  
  // User Management 스키마 - 사용자 관리
  USER_MANAGEMENT: {
    name: 'user_management',
    tables: {
      PROFILES: 'profiles',
      SOCIAL_ACCOUNTS: 'social_accounts',
      AUTH_LOGS: 'auth_logs',
      
      // 관리자 관련
      ADMIN_PERMISSIONS: 'admin_permissions',
      ADMIN_ACTIVITY_LOGS: 'admin_activity_logs',
    }
  },
  
  // Trademark Application 스키마 - 상표 출원
  TRADEMARK_APPLICATION: {
    name: 'trademark_application',
    tables: {
      APPLICATIONS: 'applications',
      RPA_SUBMISSION_LOGS: 'rpa_submission_logs',
      PAYMENT_RECORDS: 'payment_records',
      STATUS_TRACKING: 'status_tracking',
    }
  },
  
  // Debug Management 스키마 - 디버깅 도구
  DEBUG_MANAGEMENT: {
    name: 'debug_management',
    tables: {
      WORKFLOW_SNAPSHOTS: 'workflow_snapshots',
      DEBUG_COMMENTS: 'debug_comments',
      DEBUG_FEEDBACK_BOARD: 'debug_feedback_board',
    }
  }
} as const;

// 타입 추출
export type SchemaName = keyof typeof DATABASE_SCHEMAS;
export type SchemaConfig = typeof DATABASE_SCHEMAS[SchemaName];

/**
 * 스키마별 테이블 매핑 헬퍼
 */
export class SchemaHelper {
  /**
   * 스키마와 테이블 이름 가져오기
   */
  static getTable(schema: SchemaName, table: keyof SchemaConfig['tables']): {
    schema: string;
    table: string;
  } {
    const schemaConfig = DATABASE_SCHEMAS[schema];
    return {
      schema: schemaConfig.name,
      table: (schemaConfig.tables as any)[table]
    };
  }

  /**
   * 전체 경로 가져오기 (schema.table)
   */
  static getFullPath(schema: SchemaName, table: keyof SchemaConfig['tables']): string {
    const { schema: schemaName, table: tableName } = this.getTable(schema, table);
    return `${schemaName}.${tableName}`;
  }

  /**
   * 모든 스키마 정보 가져오기
   */
  static getAllSchemas(): Array<{
    name: string;
    tables: string[];
  }> {
    return Object.values(DATABASE_SCHEMAS).map(schema => ({
      name: schema.name,
      tables: Object.values(schema.tables)
    }));
  }
}

// Export helper functions
export function getSchemaName(key: SchemaName): string {
  return DATABASE_SCHEMAS[key].name;
}

export function getTableName(schema: SchemaName, table: string): string {
  return (DATABASE_SCHEMAS[schema].tables as any)[table] || table;
}

// 자주 사용되는 테이블 경로 상수 
// export const TABLE_PATHS = {
//   // 사용자 관리
//   PROFILES: SchemaHelper.getFullPath('USER_MANAGEMENT', 'PROFILES'),
//   AUTH_LOGS: SchemaHelper.getFullPath('USER_MANAGEMENT', 'AUTH_LOGS'),
  
//   // 상표 분석
//   ANALYSIS_SESSIONS: SchemaHelper.getFullPath('TRADEMARK_ANALYSIS', 'ANALYSIS_SESSIONS'),
//   FINAL_ANALYSIS: SchemaHelper.getFullPath('TRADEMARK_ANALYSIS', 'TRADEMARK_FINAL_ANALYSIS'),
//   KIPRIS_RESULTS: SchemaHelper.getFullPath('TRADEMARK_ANALYSIS', 'KIPRIS_SEARCH_RESULTS'),
//   WORKFLOW_EVENTS: SchemaHelper.getFullPath('TRADEMARK_ANALYSIS', 'WORKFLOW_EVENTS'),
  
//   // 디버그
//   WORKFLOW_SNAPSHOTS: SchemaHelper.getFullPath('DEBUG_MANAGEMENT', 'WORKFLOW_SNAPSHOTS'),
// } as const;

// 사용 예시:
// import { DATABASE_SCHEMAS, SchemaHelper, TABLE_PATHS } from '@/infrastructure/database/config/schema-config';
// 
// // 방법 1: Helper 클래스 사용
// const table = SchemaHelper.getFullPath('TRADEMARK_ANALYSIS', 'ANALYSIS_SESSIONS');
// // => 'trademark_analysis.analysis_sessions'
//
// // 방법 2: 상수 사용
// const profilesTable = TABLE_PATHS.PROFILES;
// // => 'user_management.profiles'
//
// // 방법 3: 직접 접근
// const schemaName = DATABASE_SCHEMAS.TRADEMARK_ANALYSIS.name;
// const tableName = DATABASE_SCHEMAS.TRADEMARK_ANALYSIS.tables.ANALYSIS_SESSIONS;