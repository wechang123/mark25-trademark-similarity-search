'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Loader2, Search, FileText, CheckCircle, XCircle, Info, Wand2, Database } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  query: string
  resultsCount: number
  results?: Array<{
    content: string
    source: string
    confidence: number
    metadata?: Record<string, any>
    context?: {
      before: string
      after: string
    }
  }>
  error?: string
  note?: string
}

interface TestResponse {
  success: boolean
  message?: string
  error?: string
  config?: {
    projectId: string
    dataStoreId: string
    documentId: string
    location: string
  }
  documentInfo?: {
    totalChunks: number
    totalDocuments?: number
    totalPages?: number
    sampleDocuments?: Array<{
      title: string
      documentId: string
      content: string
    }>
    chunkDetails: Array<{
      chunkId: string
      content: string
      metadata: Record<string, any>
      pageNumber?: number
      section?: string
    }>
  }
  searchResults?: SearchResult[]
  timestamp?: string
}

export default function NewAppDocumentsTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResponse | null>(null)
  const [customSearch, setCustomSearch] = useState({
    query: '',
    topK: 5
  })
  const [customSearchResult, setCustomSearchResult] = useState<{
    success: boolean;
    query?: string;
    resultsCount?: number;
    results?: Array<{
      content: string;
      source: string;
      confidence: number;
      metadata?: Record<string, any>;
      context?: {
        before: string;
        after: string;
      };
    }>;
    error?: string;
    note?: string;
  } | null>(null)

  // Laws-Manuals 앱 설정
  const APP_CONFIG = {
    projectId: 'gen-lang-client-0641392721',
    dataStoreId: 'laws-manuals_1754232870418',
    documentId: '8039daa4fc6838e99aaae8cb9ecfafe8',
    location: 'global'
  }

  const runTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test/new-app-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(APP_CONFIG)
      })
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runCustomSearch = async () => {
    if (!customSearch.query.trim()) {
      alert('검색어를 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/test/new-app-documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...APP_CONFIG,
          query: customSearch.query,
          topK: customSearch.topK
        })
      })
      const data = await response.json()
      setCustomSearchResult(data)
    } catch (error) {
      setCustomSearchResult({
        success: false,
        error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Laws-Manuals 앱 문서 검색 테스트</h1>
        <p className="text-muted-foreground">
          기존 laws-manuals 앱의 문서 청킹 상태와 검색 기능을 테스트합니다.
        </p>
      </div>

      {/* 앱 설정 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Laws-Manuals 앱 설정 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">프로젝트 ID</label>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {APP_CONFIG.projectId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">데이터 스토어 ID</label>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {APP_CONFIG.dataStoreId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">문서 ID</label>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {APP_CONFIG.documentId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">위치</label>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {APP_CONFIG.location}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 문서 청킹 테스트 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            문서 청킹 상태 확인
          </CardTitle>
          <CardDescription>
            문서가 어떻게 청킹되었는지 확인하고 전체 청크 정보를 가져옵니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                테스트 중...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                청킹 상태 확인
              </>
            )}
          </Button>

          {testResult && (
            <div className="mt-6">
              {testResult.success ? (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {testResult.message || '문서 청킹 상태 확인 완료'}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4" variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {testResult.error || '테스트 실패'}
                  </AlertDescription>
                </Alert>
              )}

              {testResult.config && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">연결 설정</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>프로젝트 ID: <span className="font-mono">{testResult.config.projectId}</span></div>
                    <div>데이터 스토어 ID: <span className="font-mono">{testResult.config.dataStoreId}</span></div>
                    <div>문서 ID: <span className="font-mono">{testResult.config.documentId}</span></div>
                    <div>위치: <span className="font-mono">{testResult.config.location}</span></div>
                  </div>
                </div>
              )}

              {testResult.documentInfo && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">문서 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.documentInfo.totalDocuments}</div>
                      <div className="text-sm text-muted-foreground">총 문서 수</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.documentInfo.totalChunks}</div>
                      <div className="text-sm text-muted-foreground">총 청크 수</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.documentInfo.totalPages}</div>
                      <div className="text-sm text-muted-foreground">총 페이지 수</div>
                    </div>
                  </div>

                  {testResult.documentInfo.sampleDocuments && testResult.documentInfo.sampleDocuments.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">샘플 문서 (처음 5개)</h5>
                      <div className="space-y-3">
                        {testResult.documentInfo.sampleDocuments.map((doc, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">문서 {index + 1}</Badge>
                              <Badge variant="secondary">{doc.documentId}</Badge>
                            </div>
                            <div className="text-sm mb-2">
                              <strong>제목:</strong> {doc.title}
                            </div>
                            <div className="text-sm mb-2">
                              <strong>내용:</strong>
                              <div className="mt-1 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                                {doc.content}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {testResult.documentInfo.chunkDetails && testResult.documentInfo.chunkDetails.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">청크 상세 정보 (처음 5개)</h5>
                      <div className="space-y-3">
                        {testResult.documentInfo.chunkDetails.slice(0, 5).map((chunk, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">청크 {index + 1}</Badge>
                              {chunk.pageNumber && (
                                <Badge variant="secondary">페이지 {chunk.pageNumber}</Badge>
                              )}
                            </div>
                            <div className="text-sm mb-2">
                              <strong>청크 ID:</strong> <span className="font-mono text-xs">{chunk.chunkId}</span>
                            </div>
                            <div className="text-sm mb-2">
                              <strong>내용:</strong>
                              <div className="mt-1 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                                {chunk.content}
                              </div>
                            </div>
                            {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                              <div className="text-sm">
                                <strong>메타데이터:</strong>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {JSON.stringify(chunk.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {testResult.timestamp && (
                <div className="text-xs text-muted-foreground">
                  테스트 시간: {new Date(testResult.timestamp).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사용자 지정 검색 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            사용자 지정 검색
          </CardTitle>
          <CardDescription>
            특정 쿼리로 문서를 검색하여 관련 청크를 찾습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">검색어</label>
              <Input
                value={customSearch.query}
                onChange={(e) => setCustomSearch(prev => ({ ...prev, query: e.target.value }))}
                placeholder="검색할 내용을 입력하세요..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">결과 수 (topK)</label>
              <Input
                type="number"
                value={customSearch.topK}
                onChange={(e) => setCustomSearch(prev => ({ ...prev, topK: parseInt(e.target.value) || 5 }))}
                min="1"
                max="20"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={runCustomSearch} 
              disabled={isLoading || !customSearch.query.trim()}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  검색 실행
                </>
              )}
            </Button>
          </div>

          {customSearchResult && (
            <div className="mt-6">
              {customSearchResult.success ? (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    검색 완료: {customSearchResult.resultsCount}개의 결과를 찾았습니다.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4" variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {customSearchResult.error || '검색 실패'}
                  </AlertDescription>
                </Alert>
              )}

              {customSearchResult.results && customSearchResult.results.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">검색 결과</h4>
                  {customSearchResult.results.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">결과 {index + 1}</Badge>
                        <Badge variant="secondary">
                          신뢰도: {(result.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-sm mb-2">
                        <strong>출처:</strong> {result.source}
                      </div>
                      <div className="text-sm mb-2">
                        <strong>내용:</strong>
                        <div className="mt-1 p-2 bg-muted rounded">
                          {result.content}
                        </div>
                      </div>
                      {result.metadata && Object.keys(result.metadata).length > 0 && (
                        <div className="text-sm">
                          <strong>메타데이터:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 다른 테스트 페이지로 이동 */}
      <div className="flex gap-2">
        <Link href="/test/document-chunking">
          <Button variant="outline">
            기존 문서 청킹 테스트
          </Button>
        </Link>
        <Link href="/test/goods-search">
          <Button variant="outline">
            상품 검색 테스트
          </Button>
        </Link>
      </div>
    </div>
  )
} 