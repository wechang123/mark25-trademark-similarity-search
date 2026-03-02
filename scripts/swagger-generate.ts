#!/usr/bin/env tsx

/**
 * Swagger 문서 생성 스크립트
 * OpenAPI 스펙과 기본 문서를 생성합니다.
 */

import { staticDocsGenerator } from '../src/infrastructure/swagger/generators/static-docs-generator';
import { generateOpenApiSpec } from '../src/infrastructure/swagger/generators/openapi-generator';

async function generateDocumentation() {
  console.log('📚 Starting documentation generation...\n');
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // 출력 디렉토리 생성
    const outputDir = 'docs/api';
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('📄 Generating OpenAPI specification...');
    const openApiSpec = await generateOpenApiSpec();
    
    const openApiPath = path.join(outputDir, 'openapi.json');
    await fs.writeFile(openApiPath, JSON.stringify(openApiSpec, null, 2));
    console.log(`✅ OpenAPI spec saved: ${openApiPath}`);
    
    console.log('\n📖 Generating static documentation...');
    const docs = await staticDocsGenerator.generateAll();
    
    console.log('✅ Generated files:');
    console.log(`   - OpenAPI JSON: ${docs.openapi}`);
    console.log(`   - Markdown docs: ${docs.markdown}`);
    console.log(`   - HTML docs: ${docs.html}`);
    console.log(`   - Endpoints list: ${docs.endpoints}`);
    
    // 메타데이터 저장
    const metadata = {
      generatedAt: new Date().toISOString(),
      version: openApiSpec.info.version,
      totalEndpoints: openApiSpec.info['x-stats']?.totalOperations || 0,
      environment: process.env.NODE_ENV || 'development'
    };
    
    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📊 Metadata saved: ${metadataPath}`);
    
    console.log('\n🎉 Documentation generation completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Documentation generation failed:');
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  generateDocumentation();
}