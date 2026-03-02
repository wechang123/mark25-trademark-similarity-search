import { writeFile } from 'fs/promises';
import path from 'path';
import { diffDetector, type ApiChange } from '../validation/diff-detector';
import { schemaValidator } from '../validation/schema-validator';

/**
 * 빌드 후 처리 결과
 */
export interface PostBuildResult {
  success: boolean;
  snapshotSaved: boolean;
  changelogGenerated: boolean;
  docsGenerated: boolean;
  changes: ApiChange[];
  outputs: {
    snapshot?: string;
    changelog?: string;
    docs?: string[];
  };
  errors: string[];
  timestamp: Date;
}

/**
 * 빌드 후 처리 훅 옵션
 */
export interface PostBuildHookOptions {
  generateChangelog?: boolean;
  generateStaticDocs?: boolean;
  outputDir?: string;
  version?: string;
  skipSnapshotSave?: boolean;
}

/**
 * 빌드 후 처리 훅
 * 빌드 완료 후 API 스냅샷 저장, 변경로그 생성, 정적 문서 생성 등을 수행합니다.
 */
export class PostBuildHook {
  private options: PostBuildHookOptions;

  constructor(options: PostBuildHookOptions = {}) {
    this.options = {
      generateChangelog: true,
      generateStaticDocs: false, // 프로덕션에서만 활성화
      outputDir: 'docs/api',
      version: '1.0.0',
      skipSnapshotSave: false,
      ...options
    };
  }

  /**
   * 빌드 후 처리 실행
   */
  async execute(): Promise<PostBuildResult> {
    console.log('🔨 Starting post-build processing...');
    
    const errors: string[] = [];
    const outputs: PostBuildResult['outputs'] = {};
    let snapshotSaved = false;
    let changelogGenerated = false;
    let docsGenerated = false;

    try {
      // 1. API 스냅샷 저장
      if (!this.options.skipSnapshotSave) {
        console.log('📸 Saving API snapshot...');
        try {
          const snapshot = await diffDetector.createSnapshot(this.options.version);
          outputs.snapshot = `API snapshot saved with ${snapshot.totalEndpoints} endpoints`;
          snapshotSaved = true;
        } catch (error) {
          errors.push(`Failed to save snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 2. 변경사항 감지 및 changelog 생성
      if (this.options.generateChangelog) {
        console.log('📋 Generating changelog...');
        try {
          const changes = await diffDetector.detectChanges();
          const changelogPath = await this.generateChangelog(changes);
          outputs.changelog = changelogPath;
          changelogGenerated = true;
        } catch (error) {
          errors.push(`Failed to generate changelog: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 3. 정적 문서 생성 (선택적)
      if (this.options.generateStaticDocs && process.env.NODE_ENV === 'production') {
        console.log('📖 Generating static documentation...');
        try {
          const docsPaths = await this.generateStaticDocs();
          outputs.docs = docsPaths;
          docsGenerated = true;
        } catch (error) {
          errors.push(`Failed to generate static docs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 4. 검증 통계 저장
      console.log('📊 Saving validation statistics...');
      try {
        await this.saveValidationStats();
      } catch (error) {
        errors.push(`Failed to save validation stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      const result: PostBuildResult = {
        success: errors.length === 0,
        snapshotSaved,
        changelogGenerated,
        docsGenerated,
        changes: await diffDetector.detectChanges().catch(() => []),
        outputs,
        errors,
        timestamp: new Date()
      };

      // 결과 출력
      this.printPostBuildSummary(result);
      return result;

    } catch (error) {
      console.error('❌ Post-build processing failed:', error);
      throw error;
    }
  }

  /**
   * 변경로그 생성
   */
  private async generateChangelog(changes: ApiChange[]): Promise<string> {
    const now = new Date();
    const version = this.options.version;
    
    const changesByType = {
      breaking: changes.filter(c => c.type === 'breaking'),
      added: changes.filter(c => c.type === 'added'),
      modified: changes.filter(c => c.type === 'modified'),
      removed: changes.filter(c => c.type === 'removed'),
      deprecated: changes.filter(c => c.type === 'deprecated')
    };

    let changelog = `# API Changelog\n\n`;
    changelog += `## [${version}] - ${now.toISOString().split('T')[0]}\n\n`;

    if (changes.length === 0) {
      changelog += `No changes detected.\n\n`;
    } else {
      // Breaking Changes
      if (changesByType.breaking.length > 0) {
        changelog += `### 🚨 Breaking Changes\n\n`;
        changesByType.breaking.forEach(change => {
          changelog += `- **${change.method.toUpperCase()} ${change.endpoint}**: ${change.description}\n`;
        });
        changelog += `\n`;
      }

      // Added APIs
      if (changesByType.added.length > 0) {
        changelog += `### ✨ Added\n\n`;
        changesByType.added.forEach(change => {
          changelog += `- **${change.method.toUpperCase()} ${change.endpoint}**: ${change.description}\n`;
        });
        changelog += `\n`;
      }

      // Modified APIs
      if (changesByType.modified.length > 0) {
        changelog += `### 🔄 Changed\n\n`;
        changesByType.modified.forEach(change => {
          changelog += `- **${change.method.toUpperCase()} ${change.endpoint}**: ${change.description}\n`;
          if (change.field && change.oldValue && change.newValue) {
            changelog += `  - ${change.field}: \`${change.oldValue}\` → \`${change.newValue}\`\n`;
          }
        });
        changelog += `\n`;
      }

      // Removed APIs
      if (changesByType.removed.length > 0) {
        changelog += `### ❌ Removed\n\n`;
        changesByType.removed.forEach(change => {
          changelog += `- **${change.method.toUpperCase()} ${change.endpoint}**: ${change.description}\n`;
        });
        changelog += `\n`;
      }

      // Deprecated APIs
      if (changesByType.deprecated.length > 0) {
        changelog += `### ⚠️ Deprecated\n\n`;
        changesByType.deprecated.forEach(change => {
          changelog += `- **${change.method.toUpperCase()} ${change.endpoint}**: ${change.description}\n`;
        });
        changelog += `\n`;
      }
    }

    // 통계 추가
    changelog += `### 📊 Statistics\n\n`;
    changelog += `- Total Changes: ${changes.length}\n`;
    changelog += `- Breaking Changes: ${changesByType.breaking.length}\n`;
    changelog += `- New APIs: ${changesByType.added.length}\n`;
    changelog += `- Modified APIs: ${changesByType.modified.length}\n`;
    changelog += `- Removed APIs: ${changesByType.removed.length}\n`;
    changelog += `- Deprecated APIs: ${changesByType.deprecated.length}\n\n`;

    // 파일 저장
    const filePath = path.join(this.options.outputDir!, `api-changelog-${version}.md`);
    await writeFile(filePath, changelog);
    
    // 최신 changelog로도 저장
    const latestPath = path.join(this.options.outputDir!, 'api-changelog.md');
    await writeFile(latestPath, changelog);

    return filePath;
  }

  /**
   * 정적 문서 생성
   */
  private async generateStaticDocs(): Promise<string[]> {
    const docsPaths: string[] = [];
    
    // OpenAPI JSON 생성
    try {
      const { generateOpenApiSpec } = await import('../generators/openapi-generator');
      const openApiSpec = await generateOpenApiSpec();
      const openApiPath = path.join(this.options.outputDir!, 'openapi.json');
      
      await writeFile(openApiPath, JSON.stringify(openApiSpec, null, 2));
      docsPaths.push(openApiPath);
    } catch (error) {
      console.warn('Failed to generate OpenAPI spec:', error);
    }

    // API 엔드포인트 목록 생성
    try {
      const endpointsList = await this.generateEndpointsList();
      const endpointsPath = path.join(this.options.outputDir!, 'endpoints.md');
      
      await writeFile(endpointsPath, endpointsList);
      docsPaths.push(endpointsPath);
    } catch (error) {
      console.warn('Failed to generate endpoints list:', error);
    }

    return docsPaths;
  }

  /**
   * 엔드포인트 목록 마크다운 생성
   */
  private async generateEndpointsList(): Promise<string> {
    const { apiRegistry } = await import('../registry/api-registry');
    const endpoints = apiRegistry.getAllEndpoints();

    let markdown = `# API Endpoints\n\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n\n`;
    markdown += `Total Endpoints: ${endpoints.length}\n\n`;

    // 태그별로 그룹화
    const endpointsByTag = endpoints.reduce((acc, endpoint) => {
      const tags = endpoint.tags || ['Untagged'];
      tags.forEach(tag => {
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(endpoint);
      });
      return acc;
    }, {} as Record<string, typeof endpoints>);

    // 각 태그별로 문서 생성
    Object.entries(endpointsByTag).forEach(([tag, tagEndpoints]) => {
      markdown += `## ${tag}\n\n`;
      
      tagEndpoints.forEach(endpoint => {
        markdown += `### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
        markdown += `**Summary**: ${endpoint.summary}\n\n`;
        
        if (endpoint.description) {
          markdown += `**Description**: ${endpoint.description}\n\n`;
        }
        
        if (endpoint.requiresAuth) {
          markdown += `**Authentication**: Required\n\n`;
        }
        
        if (endpoint.deprecated) {
          markdown += `**Status**: ⚠️ Deprecated\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    });

    return markdown;
  }

  /**
   * 검증 통계 저장
   */
  private async saveValidationStats(): Promise<void> {
    const stats = schemaValidator.getValidationStats();
    const statsData = {
      ...stats,
      timestamp: new Date(),
      version: this.options.version
    };

    const statsPath = path.join(this.options.outputDir!, 'validation-stats.json');
    await writeFile(statsPath, JSON.stringify(statsData, null, 2));
  }

  /**
   * 빌드 후 처리 결과 출력
   */
  private printPostBuildSummary(result: PostBuildResult): void {
    console.log('\n🔨 Post-build Processing Summary');
    console.log('=====================================');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📸 Snapshot Saved: ${result.snapshotSaved}`);
    console.log(`📋 Changelog Generated: ${result.changelogGenerated}`);
    console.log(`📖 Docs Generated: ${result.docsGenerated}`);
    console.log(`🔄 Total Changes: ${result.changes.length}`);

    if (result.outputs.snapshot) {
      console.log(`📸 ${result.outputs.snapshot}`);
    }

    if (result.outputs.changelog) {
      console.log(`📋 Changelog: ${result.outputs.changelog}`);
    }

    if (result.outputs.docs && result.outputs.docs.length > 0) {
      console.log(`📖 Generated docs:`);
      result.outputs.docs.forEach(doc => console.log(`   - ${doc}`));
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('=====================================\n');
  }
}

// 기본 훅 인스턴스
export const postBuildHook = new PostBuildHook();