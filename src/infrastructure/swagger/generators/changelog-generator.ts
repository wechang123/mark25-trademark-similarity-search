import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import { diffDetector, type ApiChange } from '../validation/diff-detector';
import type { ApiEndpointOptions } from '../decorators/api-decorators';

/**
 * 변경사항 로그 생성기
 */
export class ChangelogGenerator {
  private outputDir: string;

  constructor(outputDir = 'docs/api') {
    this.outputDir = outputDir;
  }

  /**
   * 변경사항 기반 changelog 생성
   */
  async generateChangelog(version = '1.0.0', changes?: ApiChange[]): Promise<{
    versionedPath: string;
    latestPath: string;
    changes: ApiChange[];
  }> {
    const detectedChanges = changes || await diffDetector.detectChanges();
    
    await mkdir(this.outputDir, { recursive: true });
    
    const changelog = await this.createChangelogContent(version, detectedChanges);
    
    // 버전별 파일 저장
    const versionedPath = path.join(this.outputDir, `changelog-${version}.md`);
    await writeFile(versionedPath, changelog);
    
    // 최신 changelog로도 저장
    const latestPath = path.join(this.outputDir, 'CHANGELOG.md');
    await this.updateLatestChangelog(latestPath, version, changelog);
    
    return {
      versionedPath,
      latestPath,
      changes: detectedChanges
    };
  }

  /**
   * Release notes 생성
   */
  async generateReleaseNotes(version: string, changes?: ApiChange[]): Promise<string> {
    const detectedChanges = changes || await diffDetector.detectChanges();
    
    const releaseNotes = await this.createReleaseNotesContent(version, detectedChanges);
    
    const filePath = path.join(this.outputDir, `release-notes-${version}.md`);
    await writeFile(filePath, releaseNotes);
    
    return filePath;
  }

  /**
   * 마이그레이션 가이드 생성
   */
  async generateMigrationGuide(fromVersion: string, toVersion: string, changes?: ApiChange[]): Promise<string> {
    const detectedChanges = changes || await diffDetector.detectChanges();
    const breakingChanges = detectedChanges.filter(c => c.type === 'breaking');
    
    if (breakingChanges.length === 0) {
      throw new Error('No breaking changes found. Migration guide not needed.');
    }
    
    const migrationGuide = await this.createMigrationGuideContent(fromVersion, toVersion, breakingChanges);
    
    const filePath = path.join(this.outputDir, `migration-${fromVersion}-to-${toVersion}.md`);
    await writeFile(filePath, migrationGuide);
    
    return filePath;
  }

  /**
   * Changelog 내용 생성
   */
  private async createChangelogContent(version: string, changes: ApiChange[]): Promise<string> {
    const now = new Date();
    const changesByType = this.groupChangesByType(changes);
    
    let content = `# API Changelog\n\n`;
    content += `## [${version}] - ${now.toISOString().split('T')[0]}\n\n`;
    
    if (changes.length === 0) {
      content += `No changes detected.\n\n`;
      return content;
    }
    
    // Breaking Changes (최우선)
    if (changesByType.breaking.length > 0) {
      content += `### 🚨 Breaking Changes\n\n`;
      changesByType.breaking.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}**\n`;
        content += `  - ${change.description}\n`;
        if (change.field && change.oldValue && change.newValue) {
          content += `  - Changed: \`${change.field}\` from \`${change.oldValue}\` to \`${change.newValue}\`\n`;
        }
        content += `\n`;
      });
    }
    
    // Added APIs
    if (changesByType.added.length > 0) {
      content += `### ✨ Added\n\n`;
      changesByType.added.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}**\n`;
        content += `  - ${change.description}\n\n`;
      });
    }
    
    // Modified APIs
    if (changesByType.modified.length > 0) {
      content += `### 🔄 Changed\n\n`;
      changesByType.modified.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}**\n`;
        content += `  - ${change.description}\n`;
        if (change.field && change.oldValue && change.newValue) {
          content += `  - Updated: \`${change.field}\` from \`${change.oldValue}\` to \`${change.newValue}\`\n`;
        }
        content += `\n`;
      });
    }
    
    // Deprecated APIs
    if (changesByType.deprecated.length > 0) {
      content += `### ⚠️ Deprecated\n\n`;
      changesByType.deprecated.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}**\n`;
        content += `  - ${change.description}\n\n`;
      });
    }
    
    // Removed APIs
    if (changesByType.removed.length > 0) {
      content += `### ❌ Removed\n\n`;
      changesByType.removed.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}**\n`;
        content += `  - ${change.description}\n\n`;
      });
    }
    
    // Statistics
    content += `### 📊 Summary\n\n`;
    content += `- Total Changes: ${changes.length}\n`;
    content += `- Breaking Changes: ${changesByType.breaking.length}\n`;
    content += `- New APIs: ${changesByType.added.length}\n`;
    content += `- Modified APIs: ${changesByType.modified.length}\n`;
    content += `- Deprecated APIs: ${changesByType.deprecated.length}\n`;
    content += `- Removed APIs: ${changesByType.removed.length}\n\n`;
    
    return content;
  }
  
  /**
   * Release Notes 내용 생성
   */
  private async createReleaseNotesContent(version: string, changes: ApiChange[]): Promise<string> {
    const changesByType = this.groupChangesByType(changes);
    
    let content = `# Release Notes - v${version}\n\n`;
    content += `*Released: ${new Date().toISOString().split('T')[0]}*\n\n`;
    
    if (changes.length === 0) {
      content += `## What's New\n\nNo API changes in this release.\n\n`;
      return content;
    }
    
    // 주요 변경사항 요약
    content += `## What's New\n\n`;
    if (changesByType.added.length > 0) {
      content += `🎉 **${changesByType.added.length} new APIs** added to enhance functionality\n\n`;
    }
    if (changesByType.modified.length > 0) {
      content += `🔧 **${changesByType.modified.length} APIs** improved with better features\n\n`;
    }
    if (changesByType.breaking.length > 0) {
      content += `⚠️ **${changesByType.breaking.length} breaking changes** - migration required\n\n`;
    }
    
    // Breaking changes 상세 (있을 경우)
    if (changesByType.breaking.length > 0) {
      content += `## ⚠️ Breaking Changes\n\n`;
      content += `**Action Required:** Please review and update your integration.\n\n`;
      
      changesByType.breaking.forEach(change => {
        content += `### ${change.method.toUpperCase()} ${change.endpoint}\n`;
        content += `${change.description}\n\n`;
      });
    }
    
    // 새로운 기능
    if (changesByType.added.length > 0) {
      content += `## ✨ New Features\n\n`;
      changesByType.added.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}:** ${change.description}\n`;
      });
      content += `\n`;
    }
    
    // 개선사항
    if (changesByType.modified.length > 0) {
      content += `## 🔧 Improvements\n\n`;
      changesByType.modified.forEach(change => {
        content += `- **${change.method.toUpperCase()} ${change.endpoint}:** ${change.description}\n`;
      });
      content += `\n`;
    }
    
    // 개발자를 위한 정보
    content += `## For Developers\n\n`;
    content += `- View the [full API documentation](./api-documentation.md)\n`;
    content += `- Check the [detailed changelog](./CHANGELOG.md)\n`;
    if (changesByType.breaking.length > 0) {
      content += `- Read the [migration guide](./migration-guide.md)\n`;
    }
    content += `\n`;
    
    return content;
  }
  
  /**
   * 마이그레이션 가이드 생성
   */
  private async createMigrationGuideContent(fromVersion: string, toVersion: string, breakingChanges: ApiChange[]): Promise<string> {
    let content = `# Migration Guide: v${fromVersion} → v${toVersion}\n\n`;
    content += `This guide helps you migrate from v${fromVersion} to v${toVersion}.\n\n`;
    
    // 개요
    content += `## Overview\n\n`;
    content += `Version ${toVersion} introduces ${breakingChanges.length} breaking changes that require code updates.\n\n`;
    
    // 체크리스트
    content += `## Migration Checklist\n\n`;
    breakingChanges.forEach((change, index) => {
      content += `- [ ] Update ${change.method.toUpperCase()} ${change.endpoint}\n`;
    });
    content += `\n`;
    
    // 상세 마이그레이션 단계
    content += `## Step-by-Step Migration\n\n`;
    
    breakingChanges.forEach((change, index) => {
      content += `### ${index + 1}. ${change.method.toUpperCase()} ${change.endpoint}\n\n`;
      content += `**Issue:** ${change.description}\n\n`;
      
      if (change.field && change.oldValue && change.newValue) {
        content += `**Before:**\n`;
        content += `\`\`\`json\n`;
        content += `{\n  "${change.field}": "${change.oldValue}"\n}\n`;
        content += `\`\`\`\n\n`;
        
        content += `**After:**\n`;
        content += `\`\`\`json\n`;
        content += `{\n  "${change.field}": "${change.newValue}"\n}\n`;
        content += `\`\`\`\n\n`;
      }
      
      content += `**Action Required:**\n`;
      content += `- Update your client code to handle the new format\n`;
      content += `- Test the endpoint with new parameters\n\n`;
      
      content += `---\n\n`;
    });
    
    // 도움말
    content += `## Need Help?\n\n`;
    content += `- Check the [API documentation](./api-documentation.md) for complete reference\n`;
    content += `- Review [release notes](./release-notes-${toVersion}.md) for context\n`;
    content += `- Contact support if you encounter issues\n\n`;
    
    return content;
  }
  
  /**
   * 최신 changelog 업데이트
   */
  private async updateLatestChangelog(filePath: string, version: string, newContent: string): Promise<void> {
    try {
      // 기존 changelog 읽기
      const existingContent = await readFile(filePath, 'utf-8');
      
      // 새 버전을 맨 위에 추가
      const lines = existingContent.split('\n');
      const headerIndex = lines.findIndex(line => line.startsWith('# API Changelog'));
      
      if (headerIndex >= 0) {
        const newLines = newContent.split('\n');
        const versionSectionStart = newLines.findIndex(line => line.startsWith('## ['));
        const versionSection = newLines.slice(versionSectionStart);
        
        lines.splice(headerIndex + 2, 0, ...versionSection, '');
        await writeFile(filePath, lines.join('\n'));
      } else {
        await writeFile(filePath, newContent);
      }
    } catch (error) {
      // 파일이 없으면 새로 생성
      await writeFile(filePath, newContent);
    }
  }
  
  /**
   * 변경사항을 타입별로 그룹화
   */
  private groupChangesByType(changes: ApiChange[]) {
    return {
      breaking: changes.filter(c => c.type === 'breaking'),
      added: changes.filter(c => c.type === 'added'),
      modified: changes.filter(c => c.type === 'modified'),
      deprecated: changes.filter(c => c.type === 'deprecated'),
      removed: changes.filter(c => c.type === 'removed')
    };
  }
}

// 기본 인스턴스
export const changelogGenerator = new ChangelogGenerator();