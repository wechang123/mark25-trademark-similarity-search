#!/usr/bin/env tsx

/**
 * Breaking changes 검사 스크립트
 * CI에서 PR의 breaking changes를 검사합니다.
 */

import { diffDetector } from '../src/infrastructure/swagger/validation/diff-detector';

async function checkBreakingChanges() {
  console.log('🚨 Checking for breaking changes...\n');
  
  try {
    console.log('🔍 Detecting API changes...');
    const changes = await diffDetector.detectChanges();
    
    const breakingChanges = changes.filter(change => change.type === 'breaking');
    
    if (breakingChanges.length === 0) {
      console.log('✅ No breaking changes detected.');
      process.exit(0);
    }
    
    console.log(`🚨 Found ${breakingChanges.length} breaking changes:\n`);
    
    breakingChanges.forEach((change, index) => {
      console.log(`${index + 1}. ${change.method.toUpperCase()} ${change.endpoint}`);
      console.log(`   Issue: ${change.description}`);
      
      if (change.field && change.oldValue && change.newValue) {
        console.log(`   Field: ${change.field}`);
        console.log(`   Before: ${change.oldValue}`);
        console.log(`   After: ${change.newValue}`);
      }
      
      console.log(''); // 빈 줄
    });
    
    // Breaking changes 세부 정보를 마크다운으로 생성
    const fs = await import('fs/promises');
    const path = await import('path');
    
    await fs.mkdir('docs/api', { recursive: true });
    
    let markdown = '# 🚨 Breaking Changes Detected\n\n';
    markdown += `Found **${breakingChanges.length}** breaking changes that require attention:\n\n`;
    
    breakingChanges.forEach((change, index) => {
      markdown += `## ${index + 1}. ${change.method.toUpperCase()} ${change.endpoint}\n\n`;
      markdown += `**Issue:** ${change.description}\n\n`;
      
      if (change.field && change.oldValue && change.newValue) {
        markdown += `**Field Changed:** \`${change.field}\`\n`;
        markdown += `- **Before:** \`${change.oldValue}\`\n`;
        markdown += `- **After:** \`${change.newValue}\`\n\n`;
      }
      
      markdown += `**Action Required:**\n`;
      markdown += `- [ ] Review the change impact\n`;
      markdown += `- [ ] Update API documentation\n`;
      markdown += `- [ ] Notify API consumers\n`;
      markdown += `- [ ] Update client SDKs if applicable\n\n`;
      
      markdown += '---\n\n';
    });
    
    markdown += '## Next Steps\n\n';
    markdown += '1. **Review each breaking change** listed above\n';
    markdown += '2. **Update documentation** to reflect the changes\n';
    markdown += '3. **Communicate with stakeholders** about the impact\n';
    markdown += '4. **Plan a coordinated deployment** if needed\n';
    markdown += '5. **Consider API versioning** for major changes\n\n';
    
    markdown += '## Migration Resources\n\n';
    markdown += '- [API Documentation](./api-documentation.md)\n';
    markdown += '- [Full Changelog](./CHANGELOG.md)\n';
    markdown += '- [Migration Guide](./migration-guide.md) *(if available)*\n';
    
    const breakingChangesPath = path.join('docs/api', 'breaking-changes.md');
    await fs.writeFile(breakingChangesPath, markdown);
    
    console.log(`📄 Breaking changes report saved: ${breakingChangesPath}`);
    console.log('\n❌ FAILURE: Breaking changes detected!');
    console.log('Please review the changes and update documentation before proceeding.');
    
    // 환경 변수로 실패를 허용하는 경우 (예: 개발 환경)
    const allowBreaking = process.env.ALLOW_BREAKING_CHANGES === 'true';
    if (allowBreaking) {
      console.log('\n⚠️  WARNING: Breaking changes allowed by configuration.');
      process.exit(0);
    }
    
    process.exit(1);
    
  } catch (error) {
    console.error('\n❌ Breaking changes check failed:');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkBreakingChanges();
}