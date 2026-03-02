import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { apiRegistry } from '../registry/api-registry';
import { generateOpenApiSpec } from './openapi-generator';
import type { OpenAPISpec } from '../types/swagger.types';
import type { ApiEndpointOptions } from '../decorators/api-decorators';

/**
 * 정적 문서 생성기
 * HTML, Markdown 형태의 API 문서 생성
 */
export class StaticDocsGenerator {
  private outputDir: string;

  constructor(outputDir = 'docs/api') {
    this.outputDir = outputDir;
  }

  /**
   * 모든 정적 문서 생성
   */
  async generateAll(): Promise<{
    openapi: string;
    markdown: string;
    html: string;
    endpoints: string;
  }> {
    // 출력 디렉토리 생성
    await mkdir(this.outputDir, { recursive: true });

    const [openapi, markdown, html, endpoints] = await Promise.all([
      this.generateOpenApiJson(),
      this.generateMarkdownDocs(),
      this.generateHtmlDocs(),
      this.generateEndpointsList()
    ]);

    return { openapi, markdown, html, endpoints };
  }

  /**
   * OpenAPI JSON 파일 생성
   */
  async generateOpenApiJson(): Promise<string> {
    const spec = await generateOpenApiSpec();
    const filePath = path.join(this.outputDir, 'openapi.json');
    
    await writeFile(filePath, JSON.stringify(spec, null, 2));
    return filePath;
  }

  /**
   * Markdown 문서 생성
   */
  async generateMarkdownDocs(): Promise<string> {
    const spec = await generateOpenApiSpec();
    const endpoints = apiRegistry.getAllEndpoints();
    
    let markdown = this.generateMarkdownHeader(spec);
    markdown += this.generateMarkdownEndpoints(endpoints);
    markdown += this.generateMarkdownSchemas(spec);
    
    const filePath = path.join(this.outputDir, 'api-documentation.md');
    await writeFile(filePath, markdown);
    return filePath;
  }

  /**
   * HTML 문서 생성
   */
  async generateHtmlDocs(): Promise<string> {
    const spec = await generateOpenApiSpec();
    const endpoints = apiRegistry.getAllEndpoints();
    
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${spec.info.title} - API Documentation</title>
    <style>
        ${this.getHtmlStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.generateHtmlHeader(spec)}
        ${this.generateHtmlEndpoints(endpoints)}
        ${this.generateHtmlSchemas(spec)}
    </div>
</body>
</html>`;

    const filePath = path.join(this.outputDir, 'api-documentation.html');
    await writeFile(filePath, html);
    return filePath;
  }

  /**
   * 엔드포인트 목록 생성
   */
  async generateEndpointsList(): Promise<string> {
    const endpoints = apiRegistry.getAllEndpoints();
    
    let content = '# API Endpoints\n\n';
    content += `Generated: ${new Date().toISOString()}\n\n`;
    content += `Total: ${endpoints.length} endpoints\n\n`;

    // 태그별 그룹화
    const groupedEndpoints = this.groupEndpointsByTag(endpoints);
    
    Object.entries(groupedEndpoints).forEach(([tag, tagEndpoints]) => {
      content += `## ${tag}\n\n`;
      
      tagEndpoints.forEach(endpoint => {
        content += `- **${endpoint.method.toUpperCase()}** \`${endpoint.path}\` - ${endpoint.summary}\n`;
        if (endpoint.description) {
          content += `  - ${endpoint.description}\n`;
        }
        if (endpoint.deprecated) {
          content += `  - ⚠️ **Deprecated**\n`;
        }
      });
      
      content += '\n';
    });

    const filePath = path.join(this.outputDir, 'endpoints.md');
    await writeFile(filePath, content);
    return filePath;
  }

  private generateMarkdownHeader(spec: OpenAPISpec): string {
    return `# ${spec.info.title}

${spec.info.description || ''}

**Version:** ${spec.info.version}  
**Generated:** ${new Date().toISOString()}

## Base URL
${spec.servers?.[0]?.url || 'http://localhost:3000'}

---

`;
  }

  private generateMarkdownEndpoints(endpoints: ApiEndpointOptions[]): string {
    let content = '## API Endpoints\n\n';
    
    const grouped = this.groupEndpointsByTag(endpoints);
    
    Object.entries(grouped).forEach(([tag, tagEndpoints]) => {
      content += `### ${tag}\n\n`;
      
      tagEndpoints.forEach(endpoint => {
        content += `#### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
        content += `**Summary:** ${endpoint.summary}\n\n`;
        
        if (endpoint.description) {
          content += `**Description:** ${endpoint.description}\n\n`;
        }
        
        if (endpoint.requiresAuth) {
          content += `**Authentication:** Required 🔒\n\n`;
        }
        
        if (endpoint.deprecated) {
          content += `**Status:** ⚠️ Deprecated\n\n`;
        }
        
        content += '---\n\n';
      });
    });
    
    return content;
  }

  private generateMarkdownSchemas(spec: OpenAPISpec): string {
    if (!spec.components?.schemas) return '';
    
    let content = '## Data Schemas\n\n';
    
    Object.entries(spec.components.schemas).forEach(([name, schema]) => {
      content += `### ${name}\n\n`;
      content += '```json\n';
      content += JSON.stringify(schema, null, 2);
      content += '\n```\n\n';
    });
    
    return content;
  }

  private generateHtmlHeader(spec: OpenAPISpec): string {
    return `
    <header>
        <h1>${spec.info.title}</h1>
        <p class="subtitle">${spec.info.description || ''}</p>
        <div class="info">
            <span>Version: ${spec.info.version}</span>
            <span>Generated: ${new Date().toLocaleString()}</span>
        </div>
    </header>`;
  }

  private generateHtmlEndpoints(endpoints: ApiEndpointOptions[]): string {
    let content = '<section class="endpoints"><h2>API Endpoints</h2>';
    
    const grouped = this.groupEndpointsByTag(endpoints);
    
    Object.entries(grouped).forEach(([tag, tagEndpoints]) => {
      content += `<div class="tag-group">`;
      content += `<h3>${tag}</h3>`;
      
      tagEndpoints.forEach(endpoint => {
        const methodClass = endpoint.method.toLowerCase();
        content += `
        <div class="endpoint">
            <div class="endpoint-header">
                <span class="method ${methodClass}">${endpoint.method.toUpperCase()}</span>
                <span class="path">${endpoint.path}</span>
                ${endpoint.deprecated ? '<span class="deprecated">DEPRECATED</span>' : ''}
                ${endpoint.requiresAuth ? '<span class="auth">🔒</span>' : ''}
            </div>
            <div class="endpoint-content">
                <h4>${endpoint.summary}</h4>
                ${endpoint.description ? `<p>${endpoint.description}</p>` : ''}
            </div>
        </div>`;
      });
      
      content += '</div>';
    });
    
    content += '</section>';
    return content;
  }

  private generateHtmlSchemas(spec: OpenAPISpec): string {
    if (!spec.components?.schemas) return '';
    
    let content = '<section class="schemas"><h2>Data Schemas</h2>';
    
    Object.entries(spec.components.schemas).forEach(([name, schema]) => {
      content += `
      <div class="schema">
          <h3>${name}</h3>
          <pre><code>${JSON.stringify(schema, null, 2)}</code></pre>
      </div>`;
    });
    
    content += '</section>';
    return content;
  }

  private groupEndpointsByTag(endpoints: ApiEndpointOptions[]): Record<string, ApiEndpointOptions[]> {
    return endpoints.reduce((groups, endpoint) => {
      const tags = endpoint.tags || ['Default'];
      tags.forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(endpoint);
      });
      return groups;
    }, {} as Record<string, ApiEndpointOptions[]>);
  }

  private getHtmlStyles(): string {
    return `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    header h1 { margin: 0; color: #2563eb; }
    .subtitle { color: #6b7280; margin: 10px 0; }
    .info { display: flex; gap: 20px; color: #9ca3af; font-size: 14px; margin-top: 15px; }
    .endpoints, .schemas { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .tag-group { margin-bottom: 30px; }
    .tag-group h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .endpoint { border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 15px; overflow: hidden; }
    .endpoint-header { background: #f9fafb; padding: 15px; display: flex; align-items: center; gap: 15px; }
    .method { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .method.get { background: #10b981; color: white; }
    .method.post { background: #3b82f6; color: white; }
    .method.put { background: #f59e0b; color: white; }
    .method.patch { background: #8b5cf6; color: white; }
    .method.delete { background: #ef4444; color: white; }
    .path { font-family: monospace; font-weight: 500; }
    .deprecated { background: #fbbf24; color: #92400e; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .auth { font-size: 14px; }
    .endpoint-content { padding: 15px; }
    .endpoint-content h4 { margin: 0 0 10px 0; color: #374151; }
    .endpoint-content p { margin: 0; color: #6b7280; }
    .schema { margin-bottom: 20px; }
    .schema h3 { color: #374151; margin-bottom: 10px; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; }
    code { font-family: 'SF Mono', Monaco, monospace; font-size: 13px; }
    `;
  }
}

// 기본 인스턴스
export const staticDocsGenerator = new StaticDocsGenerator();