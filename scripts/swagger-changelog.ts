#!/usr/bin/env tsx

/**
 * Swagger changelog 생성 스크립트  
 * API 변경사항을 분석하고 changelog를 생성합니다.
 */

import { changelogGenerator } from '../src/infrastructure/swagger/generators/changelog-generator';
import { diffDetector } from '../src/infrastructure/swagger/validation/diff-detector';

async function generateChangelog() {
  console.log('📋 Starting changelog generation...\n');
  
  try {
    const version = process.env.npm_package_version || '1.0.0';
    
    console.log('🔍 Detecting API changes...');
    const changes = await diffDetector.detectChanges();
    
    if (changes.length === 0) {
      console.log('✅ No changes detected. Skipping changelog generation.');
      return;
    }
    
    console.log(`📝 Found ${changes.length} changes:`);
    
    // 변경사항 요약 출력
    const changesByType = {
      breaking: changes.filter(c => c.type === 'breaking'),
      added: changes.filter(c => c.type === 'added'),
      modified: changes.filter(c => c.type === 'modified'),
      deprecated: changes.filter(c => c.type === 'deprecated'),
      removed: changes.filter(c => c.type === 'removed')
    };
    
    Object.entries(changesByType).forEach(([type, typeChanges]) => {
      if (typeChanges.length > 0) {
        console.log(`   - ${type}: ${typeChanges.length}`);
      }
    });
    
    console.log('\n📚 Generating changelog...');
    const result = await changelogGenerator.generateChangelog(version, changes);
    
    console.log('✅ Generated files:');
    console.log(`   - Versioned: ${result.versionedPath}`);
    console.log(`   - Latest: ${result.latestPath}`);
    
    // Breaking changes가 있으면 release notes도 생성
    if (changesByType.breaking.length > 0) {
      console.log('\n🚨 Breaking changes detected. Generating release notes...');
      const releaseNotesPath = await changelogGenerator.generateReleaseNotes(version, changes);
      console.log(`✅ Release notes: ${releaseNotesPath}`);
      
      // 마이그레이션 가이드 생성
      try {
        const migrationPath = await changelogGenerator.generateMigrationGuide('prev', version, changes);
        console.log(`✅ Migration guide: ${migrationPath}`);
      } catch (error) {
        console.log('ℹ️  Migration guide not generated (no breaking changes)');
      }
    }
    
    console.log('\n🎉 Changelog generation completed!');
    
  } catch (error) {
    console.error('\n❌ Changelog generation failed:');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  generateChangelog();
}