import { apiRegistry } from '../registry/api-registry';
import type { ApiEndpointOptions } from '../decorators/api-decorators';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * API 변경사항 유형
 */
export type ChangeType = 
  | 'added'        // 새로운 API 추가
  | 'removed'      // API 제거
  | 'modified'     // API 수정
  | 'deprecated'   // API 폐기 예정
  | 'breaking';    // 브레이킹 체인지

/**
 * API 변경사항 인터페이스
 */
export interface ApiChange {
  type: ChangeType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  endpoint: string;
  method: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  timestamp: Date;
}

/**
 * API 스냅샷 인터페이스
 */
export interface ApiSnapshot {
  timestamp: Date;
  version: string;
  endpoints: ApiEndpointSnapshot[];
  totalEndpoints: number;
  hash: string;
}

export interface ApiEndpointSnapshot {
  path: string;
  method: string;
  summary: string;
  description?: string; // Make optional to match api.description type
  tags?: string[];     // Make optional to match api.tags type
  requiresAuth: boolean;
  requestSchemaHash?: string;
  responseSchemaHash?: string;
  errorSchemaHash?: string;
}

/**
 * API 변경사항 감지 및 추적 시스템
 */
export class DiffDetector {
  private snapshotPath: string;
  private currentSnapshot: ApiSnapshot | null = null;
  private previousSnapshot: ApiSnapshot | null = null;

  constructor(snapshotPath = 'docs/api-snapshots') {
    this.snapshotPath = snapshotPath;
  }

  /**
   * 현재 API 상태의 스냅샷 생성
   */
  async createSnapshot(version = '1.0.0'): Promise<ApiSnapshot> {
    const registeredApis = apiRegistry.getAllEndpoints();
    
    const endpoints: ApiEndpointSnapshot[] = registeredApis.map(api => ({
      path: api.path,
      method: api.method,
      summary: api.summary,
      description: api.description,
      tags: api.tags,
      requiresAuth: api.requiresAuth || false,
      requestSchemaHash: this.generateSchemaHash(api.requestSchema),
      responseSchemaHash: this.generateSchemaHash(api.responseSchema),
      errorSchemaHash: this.generateSchemaHash(api.errorResponseSchema)
    }));

    const snapshot: ApiSnapshot = {
      timestamp: new Date(),
      version,
      endpoints,
      totalEndpoints: endpoints.length,
      hash: this.generateSnapshotHash(endpoints)
    };

    this.currentSnapshot = snapshot;
    await this.saveSnapshot(snapshot);
    
    return snapshot;
  }

  /**
   * 이전 스냅샷과 비교하여 변경사항 감지
   */
  async detectChanges(): Promise<ApiChange[]> {
    if (!this.currentSnapshot) {
      await this.createSnapshot();
    }

    await this.loadPreviousSnapshot();
    
    if (!this.previousSnapshot) {
      console.log('🔍 No previous snapshot found. All APIs are considered new.');
      return this.getAllEndpointsAsNewChanges();
    }

    const changes: ApiChange[] = [];

    // 현재 API 엔드포인트들
    const currentEndpoints = new Map<string, ApiEndpointSnapshot>();
    this.currentSnapshot!.endpoints.forEach(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      currentEndpoints.set(key, endpoint);
    });

    // 이전 API 엔드포인트들
    const previousEndpoints = new Map<string, ApiEndpointSnapshot>();
    this.previousSnapshot.endpoints.forEach(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      previousEndpoints.set(key, endpoint);
    });

    // 새로 추가된 API 감지
    for (const [key, current] of currentEndpoints) {
      if (!previousEndpoints.has(key)) {
        changes.push({
          type: 'added',
          severity: 'low',
          endpoint: current.path,
          method: current.method,
          description: `New API endpoint added: ${current.method.toUpperCase()} ${current.path}`,
          timestamp: new Date()
        });
      }
    }

    // 제거된 API 감지
    for (const [key, previous] of previousEndpoints) {
      if (!currentEndpoints.has(key)) {
        changes.push({
          type: 'removed',
          severity: 'critical',
          endpoint: previous.path,
          method: previous.method,
          description: `API endpoint removed: ${previous.method.toUpperCase()} ${previous.path}`,
          timestamp: new Date()
        });
      }
    }

    // 수정된 API 감지
    for (const [key, current] of currentEndpoints) {
      const previous = previousEndpoints.get(key);
      if (previous) {
        const endpointChanges = this.compareEndpoints(previous, current);
        changes.push(...endpointChanges);
      }
    }

    return changes;
  }

  /**
   * 두 엔드포인트 비교
   */
  private compareEndpoints(previous: ApiEndpointSnapshot, current: ApiEndpointSnapshot): ApiChange[] {
    const changes: ApiChange[] = [];

    // Summary 변경 감지
    if (previous.summary !== current.summary) {
      changes.push({
        type: 'modified',
        severity: 'low',
        endpoint: current.path,
        method: current.method,
        field: 'summary',
        oldValue: previous.summary,
        newValue: current.summary,
        description: `API summary changed`,
        timestamp: new Date()
      });
    }

    // Description 변경 감지
    if (previous.description !== current.description) {
      changes.push({
        type: 'modified',
        severity: 'low',
        endpoint: current.path,
        method: current.method,
        field: 'description',
        oldValue: previous.description,
        newValue: current.description,
        description: `API description changed`,
        timestamp: new Date()
      });
    }

    // Tags 변경 감지
    if (JSON.stringify(previous.tags) !== JSON.stringify(current.tags)) {
      changes.push({
        type: 'modified',
        severity: 'low',
        endpoint: current.path,
        method: current.method,
        field: 'tags',
        oldValue: previous.tags,
        newValue: current.tags,
        description: `API tags changed`,
        timestamp: new Date()
      });
    }

    // Auth 요구사항 변경 감지 (브레이킹 체인지)
    if (previous.requiresAuth !== current.requiresAuth) {
      changes.push({
        type: 'breaking',
        severity: 'critical',
        endpoint: current.path,
        method: current.method,
        field: 'requiresAuth',
        oldValue: previous.requiresAuth,
        newValue: current.requiresAuth,
        description: `API authentication requirement changed`,
        timestamp: new Date()
      });
    }

    // 스키마 변경 감지
    if (previous.requestSchemaHash !== current.requestSchemaHash) {
      changes.push({
        type: 'breaking',
        severity: 'high',
        endpoint: current.path,
        method: current.method,
        field: 'requestSchema',
        description: `Request schema changed`,
        timestamp: new Date()
      });
    }

    if (previous.responseSchemaHash !== current.responseSchemaHash) {
      changes.push({
        type: 'modified',
        severity: 'medium',
        endpoint: current.path,
        method: current.method,
        field: 'responseSchema',
        description: `Response schema changed`,
        timestamp: new Date()
      });
    }

    if (previous.errorSchemaHash !== current.errorSchemaHash) {
      changes.push({
        type: 'modified',
        severity: 'low',
        endpoint: current.path,
        method: current.method,
        field: 'errorSchema',
        description: `Error response schema changed`,
        timestamp: new Date()
      });
    }

    return changes;
  }

  /**
   * 스키마 해시 생성
   */
  private generateSchemaHash(schema: any): string | undefined {
    if (!schema) return undefined;
    
    try {
      const schemaString = JSON.stringify(schema);
      return this.simpleHash(schemaString);
    } catch {
      return undefined;
    }
  }

  /**
   * 스냅샷 해시 생성
   */
  private generateSnapshotHash(endpoints: ApiEndpointSnapshot[]): string {
    const content = JSON.stringify(endpoints.sort((a, b) => 
      `${a.method}:${a.path}`.localeCompare(`${b.method}:${b.path}`)
    ));
    return this.simpleHash(content);
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 스냅샷 저장
   */
  private async saveSnapshot(snapshot: ApiSnapshot): Promise<void> {
    try {
      const filename = `api-snapshot-${snapshot.version}-${Date.now()}.json`;
      const filepath = path.join(this.snapshotPath, filename);
      
      // 디렉토리 생성 (없는 경우)
      await import('fs/promises').then(fs => fs.mkdir(this.snapshotPath, { recursive: true }));
      
      await writeFile(filepath, JSON.stringify(snapshot, null, 2));
      
      // 최신 스냅샷으로 링크 생성
      const latestPath = path.join(this.snapshotPath, 'latest.json');
      await writeFile(latestPath, JSON.stringify(snapshot, null, 2));
      
      console.log(`📸 API snapshot saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    }
  }

  /**
   * 이전 스냅샷 로드
   */
  private async loadPreviousSnapshot(): Promise<void> {
    try {
      const latestPath = path.join(this.snapshotPath, 'latest.json');
      
      if (existsSync(latestPath)) {
        const content = await readFile(latestPath, 'utf-8');
        this.previousSnapshot = JSON.parse(content);
      }
    } catch (error) {
      console.log('No previous snapshot found or failed to load:', error);
    }
  }

  /**
   * 모든 엔드포인트를 새로운 변경사항으로 반환
   */
  private getAllEndpointsAsNewChanges(): ApiChange[] {
    if (!this.currentSnapshot) return [];
    
    return this.currentSnapshot.endpoints.map(endpoint => ({
      type: 'added' as ChangeType,
      severity: 'low' as const,
      endpoint: endpoint.path,
      method: endpoint.method,
      description: `New API endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      timestamp: new Date()
    }));
  }

  /**
   * 변경사항을 심각도별로 분류
   */
  categorizeChanges(changes: ApiChange[]): {
    critical: ApiChange[];
    high: ApiChange[];
    medium: ApiChange[];
    low: ApiChange[];
  } {
    return {
      critical: changes.filter(c => c.severity === 'critical'),
      high: changes.filter(c => c.severity === 'high'),
      medium: changes.filter(c => c.severity === 'medium'),
      low: changes.filter(c => c.severity === 'low')
    };
  }

  /**
   * 변경사항 통계
   */
  getChangeStats(changes: ApiChange[]) {
    const byType = changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<ChangeType, number>);

    const bySeverity = changes.reduce((acc, change) => {
      acc[change.severity] = (acc[change.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: changes.length,
      byType,
      bySeverity,
      hasBreakingChanges: changes.some(c => c.type === 'breaking'),
      hasCriticalChanges: changes.some(c => c.severity === 'critical')
    };
  }
}

// 기본 인스턴스
export const diffDetector = new DiffDetector();