#!/usr/bin/env tsx

/**
 * API 변경사항 감지 스크립트
 * 이전 버전과 비교하여 변경사항을 감지합니다.
 */

import { diffDetector } from '../src/infrastructure/swagger/validation/diff-detector';

async function detectChanges() {
  console.log('🔍 Starting API change detection...\n');
  
  try {
    const version = process.env.npm_package_version || '1.0.0';
    
    console.log('📸 Creating current API snapshot...');
    const snapshot = await diffDetector.createSnapshot(version);
    console.log(`✅ Snapshot created with ${snapshot.totalEndpoints} endpoints`);
    
    console.log('\n🔄 Detecting changes from previous version...');
    const changes = await diffDetector.detectChanges();
    
    if (changes.length === 0) {
      console.log('✅ No changes detected.');
      return;
    }
    
    console.log(`📊 Found ${changes.length} changes:\n`);
    
    // 변경사항을 타입별로 분류하여 출력
    const changesByType = {
      breaking: changes.filter(c => c.type === 'breaking'),
      added: changes.filter(c => c.type === 'added'),
      modified: changes.filter(c => c.type === 'modified'),
      deprecated: changes.filter(c => c.type === 'deprecated'),
      removed: changes.filter(c => c.type === 'removed')
    };
    
    // Breaking changes (가장 중요)
    if (changesByType.breaking.length > 0) {
      console.log('🚨 BREAKING CHANGES:');
      changesByType.breaking.forEach(change => {
        console.log(`   - ${change.method.toUpperCase()} ${change.endpoint}: ${change.description}`);
      });
      console.log('');
    }
    
    // Added APIs
    if (changesByType.added.length > 0) {
      console.log('✨ ADDED:');
      changesByType.added.forEach(change => {
        console.log(`   - ${change.method.toUpperCase()} ${change.endpoint}: ${change.description}`);
      });
      console.log('');
    }
    
    // Modified APIs
    if (changesByType.modified.length > 0) {
      console.log('🔄 MODIFIED:');
      changesByType.modified.forEach(change => {
        console.log(`   - ${change.method.toUpperCase()} ${change.endpoint}: ${change.description}`);
        if (change.field && change.oldValue && change.newValue) {
          console.log(`     └─ ${change.field}: ${change.oldValue} → ${change.newValue}`);
        }
      });
      console.log('');
    }
    
    // Deprecated APIs
    if (changesByType.deprecated.length > 0) {
      console.log('⚠️  DEPRECATED:');
      changesByType.deprecated.forEach(change => {
        console.log(`   - ${change.method.toUpperCase()} ${change.endpoint}: ${change.description}`);
      });
      console.log('');
    }
    
    // Removed APIs
    if (changesByType.removed.length > 0) {
      console.log('❌ REMOVED:');
      changesByType.removed.forEach(change => {
        console.log(`   - ${change.method.toUpperCase()} ${change.endpoint}: ${change.description}`);
      });
      console.log('');
    }
    
    // 통계 출력
    const stats = diffDetector.getChangeStats(changes);
    console.log('📈 Summary:');
    console.log(`   Total changes: ${changes.length}`);
    console.log(`   Breaking changes: ${changesByType.breaking.length}`);
    console.log(`   Has breaking changes: ${stats.hasBreakingChanges ? 'Yes' : 'No'}`);
    
    // 결과를 파일로 저장 (CI에서 활용)
    const fs = await import('fs/promises');
    const path = await import('path');
    
    await fs.mkdir('docs/api', { recursive: true });
    
    const changesPath = path.join('docs/api', 'changes.json');
    await fs.writeFile(changesPath, JSON.stringify(changes, null, 2));
    
    const statsPath = path.join('docs/api', 'change-stats.json');
    await fs.writeFile(statsPath, JSON.stringify({
      ...stats,
      timestamp: new Date().toISOString(),
      version
    }, null, 2));
    
    console.log(`\n💾 Results saved:`);
    console.log(`   - Changes: ${changesPath}`);
    console.log(`   - Statistics: ${statsPath}`);
    
    // Breaking changes가 있으면 별도 파일로 저장
    if (changesByType.breaking.length > 0) {
      const breakingPath = path.join('docs/api', 'breaking-changes.json');
      await fs.writeFile(breakingPath, JSON.stringify(changesByType.breaking, null, 2));
      console.log(`   - Breaking changes: ${breakingPath}`);
    }
    
    console.log('\n✅ Change detection completed!');
    
    // Breaking changes가 있으면 경고와 함께 종료
    if (changesByType.breaking.length > 0) {
      console.log('\n⚠️  WARNING: Breaking changes detected! Review carefully before deployment.');
    }
    
  } catch (error) {
    console.error('\n❌ Change detection failed:');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  detectChanges();
}