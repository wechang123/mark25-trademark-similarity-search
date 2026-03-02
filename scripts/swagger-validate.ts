#!/usr/bin/env tsx

/**
 * Swagger 스키마 검증 스크립트
 * CI/CD에서 API 스키마 일치성을 검증합니다.
 */

import { schemaValidator } from '../src/infrastructure/swagger/validation/schema-validator';
import { preBuildHook } from '../src/infrastructure/swagger/hooks/pre-build.hook';

async function validateSchemas() {
  console.log('🔧 Starting API schema validation...\n');
  
  try {
    // Pre-build validation 실행
    const result = await preBuildHook.execute();
    
    console.log('\n📊 Validation Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📋 Schema Validation: ${result.schemaValidation.passed}`);
    console.log(`🔍 Changes Detected: ${result.changeDetection.changes.length > 0}`);
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.slice(0, 5).forEach(warning => console.log(`   - ${warning}`));
      
      if (result.warnings.length > 5) {
        console.log(`   ... and ${result.warnings.length - 5} more warnings`);
      }
    }
    
    // 변경사항이 있으면 파일로 저장 (CI에서 활용)
    if (result.changeDetection.changes.length > 0) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const changesPath = path.join('docs/api', 'changes.json');
      await fs.mkdir('docs/api', { recursive: true });
      await fs.writeFile(changesPath, JSON.stringify(result.changeDetection.changes, null, 2));
      console.log(`\n💾 Changes saved to: ${changesPath}`);
    }
    
    // 성공/실패 결정
    if (!result.success) {
      console.error('\n❌ Schema validation failed!');
      process.exit(1);
    }
    
    console.log('\n✅ All validations passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Validation failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  validateSchemas();
}