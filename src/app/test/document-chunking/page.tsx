'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Loader2, Search, FileText, CheckCircle, XCircle, Info, Wand2 } from 'lucide-react'
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
    location: string
    appId: string
  }
  generalSearchResults?: Array<{
    content: string
    source: string
    confidence: number
    metadata?: Record<string, any>
    context?: {
      before: string
      after: string
    }
  }>
  documentsStatus?: {
    totalDocuments: number
    totalChunks: number
    sampleResults: Array<{
      source: string
      confidence: number
      contentPreview: string
    }>
  }
  searchResults?: SearchResult[]
  timestamp?: string
}

export default function DocumentChunkingTestPage() {
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
    filteringInfo?: {
      applied: boolean;
      description: string;
    };
  } | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test/document-chunking')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '테스트 실행 중 오류가 발생했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runCustomSearch = async () => {
    if (!customSearch.query.trim()) {
      alert('검색 쿼리를 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/test/document-chunking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customSearch),
      })
      const data = await response.json()
      setCustomSearchResult(data)
    } catch (error) {
      setCustomSearchResult({
        success: false,
        error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 네비게이션 링크 */}
      <div className="flex justify-end space-x-2">
        <Link href="/test/goods-search">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            상품 분류 테스트
          </Button>
        </Link>
      </div>
      
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">문서 청킹 테스트</h1>
        <p className="text-muted-foreground">
          GCP LangGraph와 연결된 IP-DR 앱의 문서 청킹 상태를 확인하고 검색 기능을 테스트합니다.
        </p>
      </div>

      {/* 기본 테스트 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            기본 청킹 테스트
          </CardTitle>
          <CardDescription>
            지정된 문서 ID들의 청킹 상태를 확인하고 기본 검색을 수행합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">테스트 정보:</h4>
              <p className="text-sm text-muted-foreground">
                전체 문서(3개)에서 검색을 수행합니다. 문서 개수가 제한되어 있어 ID 기반 필터링 없이 전체 검색이 가능합니다.
              </p>
            </div>
            
            <Button 
              onClick={runTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  테스트 실행 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  기본 테스트 실행
                </>
              )}
            </Button>

            {testResult && (
              <div className="space-y-4">
                {testResult.success ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{testResult.error}</AlertDescription>
                  </Alert>
                )}

                {testResult.config && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GCP 설정 정보</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Project ID:</span>
                          <p className="font-mono">{testResult.config.projectId}</p>
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>
                          <p>{testResult.config.location}</p>
                        </div>
                        <div>
                          <span className="font-medium">App ID:</span>
                          <p className="font-mono">{testResult.config.appId}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {testResult.generalSearchResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">일반 검색 결과 (메타데이터 및 컨텍스트 확인용)</CardTitle>
                      <CardDescription>
                        GCP Discovery Engine의 메타데이터 구조와 컨텍스트 정보를 확인하기 위한 일반 검색 결과입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {testResult.generalSearchResults.map((result, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">신뢰도: {(result.confidence * 100).toFixed(1)}%</span>
                              <span className="text-xs text-muted-foreground">{result.source}</span>
                            </div>
                            
                            {/* 메인 컨텐츠 */}
                            <div className="mb-3">
                              <p className="text-sm font-medium text-blue-600 mb-1">
                                메인 컨텐츠 (페이지 {result.metadata?.pageNumber || 'N/A'}):
                              </p>
                              <div className="text-sm bg-blue-50 p-2 rounded whitespace-pre-wrap">
                                {result.content}
                              </div>
                            </div>
                            
                            {/* 앞 페이지 */}
                            {result.context?.before && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                  앞 페이지 (페이지 {result.metadata?.pageNumber ? parseInt(result.metadata.pageNumber) - 1 : 'N/A'}):
                                </p>
                                <div className="text-sm bg-gray-50 p-2 rounded text-gray-700 border-l-4 border-blue-200 whitespace-pre-wrap">{result.context.before}</div>
                              </div>
                            )}
                            
                            {/* 뒤 페이지 */}
                            {result.context?.after && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                  뒤 페이지 (페이지 {result.metadata?.pageNumber ? parseInt(result.metadata.pageNumber) + 1 : 'N/A'}):
                                </p>
                                <div className="text-sm bg-gray-50 p-2 rounded text-gray-700 border-l-4 border-green-200 whitespace-pre-wrap">{result.context.after}</div>
                              </div>
                            )}
                            
                            {/* 컨텍스트 없음 안내 */}
                            {(!result.context?.before && !result.context?.after) && (
                              <div className="mb-3">
                                <p className="text-sm text-muted-foreground italic">
                                  앞뒤 페이지 컨텍스트를 찾을 수 없습니다.
                                </p>
                              </div>
                            )}
                            
                            {/* 매칭 정보 */}
                            {result.metadata?.matchInfo && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-purple-600 mb-1">매칭 정보:</p>
                                <div className="text-xs bg-purple-50 p-2 rounded border-l-4 border-purple-200">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="font-medium">매칭 비율:</span> {(result.metadata.matchInfo.matchRatio * 100).toFixed(1)}%
                                    </div>
                                    <div>
                                      <span className="font-medium">매칭 단어:</span> {result.metadata.matchInfo.meaningfulMatches.length}개
                                    </div>
                                    <div>
                                      <span className="font-medium">쿼리 단어:</span> {result.metadata.matchInfo.queryWords.join(', ')}
                                    </div>
                                    <div>
                                      <span className="font-medium">확장된 단어:</span> {result.metadata.matchInfo.expandedQueryWords.join(', ')}
                                    </div>
                                    <div>
                                      <span className="font-medium">매칭된 단어:</span> {result.metadata.matchInfo.meaningfulMatches.join(', ') || '없음'}
                                    </div>
                                    <div>
                                      <span className="font-medium">원본 매칭:</span> {result.metadata.matchInfo.originalMatches.join(', ') || '없음'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {result.metadata && (
                              <div className="text-xs text-muted-foreground">
                                <p className="font-medium">메타데이터:</p>
                                <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(result.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                                                 {testResult.documentsStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">문서 상태</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{testResult.documentsStatus.totalDocuments}</p>
                            <p className="text-sm text-muted-foreground">총 문서 수</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{testResult.documentsStatus.totalChunks}</p>
                            <p className="text-sm text-muted-foreground">총 청크 수</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{testResult.documentsStatus.sampleResults.length}</p>
                            <p className="text-sm text-muted-foreground">샘플 결과</p>
                          </div>
                        </div>
                        
                        {testResult.documentsStatus.sampleResults.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">샘플 결과:</h4>
                            <div className="space-y-2">
                              {testResult.documentsStatus.sampleResults.map((result, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">{result.source}</span>
                                    <span className="text-xs text-muted-foreground">
                                      신뢰도: {(result.confidence * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{result.contentPreview}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                                 {testResult.searchResults && (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg">검색 결과</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         {testResult.searchResults.map((result) => (
                           <div key={result.query} className="border rounded-lg p-4">
                             <div className="flex items-center justify-between mb-3">
                               <h4 className="font-medium text-sm">{result.query}</h4>
                               <Badge variant="outline">
                                 {result.resultsCount}개 결과
                               </Badge>
                             </div>
                            
                                                         {result.error ? (
                               <Alert variant="destructive">
                                 <XCircle className="h-4 w-4" />
                                 <AlertDescription>{result.error}</AlertDescription>
                               </Alert>
                             ) : (
                               <div className="space-y-2">
                                 <div className="text-sm text-muted-foreground">
                                   <p className="font-medium">검색 쿼리: {result.query}</p>
                                 </div>
                                 {result.note && (
                                   <Alert>
                                     <Info className="h-4 w-4" />
                                     <AlertDescription>{result.note}</AlertDescription>
                                   </Alert>
                                 )}
                                 {result.results && result.results.length > 0 && (
                                   <div className="space-y-3">
                                     {result.results.map((item, index) => (
                                       <div key={index} className="border rounded-lg overflow-hidden">
                                         {/* 헤더 */}
                                         <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                                           <span className="font-medium text-sm">신뢰도: {(item.confidence * 100).toFixed(1)}%</span>
                                           <span className="text-xs text-muted-foreground">{item.source}</span>
                                         </div>
                                         
                                         {/* 메인 컨텐츠 */}
                                         <div className="p-3">
                                           <p className="text-sm font-medium text-blue-600 mb-1">메인 컨텐츠:</p>
                                           <p className="text-sm bg-blue-50 p-2 rounded mb-3">{item.content}</p>
                                           
                                           {/* 앞 컨텍스트 */}
                                           {item.context?.before && (
                                             <div className="mb-3">
                                               <p className="text-sm font-medium text-gray-600 mb-1">앞 컨텍스트:</p>
                                               <p className="text-sm bg-gray-50 p-2 rounded text-gray-700">{item.context.before}</p>
                                             </div>
                                           )}
                                           
                                           {/* 뒤 컨텍스트 */}
                                           {item.context?.after && (
                                             <div className="mb-3">
                                               <p className="text-sm font-medium text-gray-600 mb-1">뒤 컨텍스트:</p>
                                               <p className="text-sm bg-gray-50 p-2 rounded text-gray-700">{item.context.after}</p>
                                             </div>
                                           )}
                                           
                                           {/* 컨텍스트 없음 안내 */}
                                           {!item.context?.before && !item.context?.after && (
                                             <div className="mb-3">
                                               <p className="text-sm text-muted-foreground italic">
                                                 컨텍스트 정보가 없습니다. GCP Discovery Engine의 스니펫 설정을 확인해주세요.
                                               </p>
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 사용자 지정 검색 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            사용자 지정 검색
          </CardTitle>
          <CardDescription>
            전체 문서에서 원하는 쿼리로 검색합니다. 유의어 검색과 매칭 정보를 제공합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">검색 쿼리</label>
              <Textarea
                value={customSearch.query}
                onChange={(e) => setCustomSearch({
                  ...customSearch,
                  query: e.target.value
                })}
                placeholder="예: 상표법, 등록요건, 심사기준, 상표권 침해 등 (의미있는 키워드만 입력)"
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">결과 개수 (Top-K)</label>
              <Input
                type="number"
                value={customSearch.topK}
                onChange={(e) => setCustomSearch({
                  ...customSearch,
                  topK: parseInt(e.target.value) || 5
                })}
                min="1"
                max="20"
              />
            </div>
            
            <Button 
              onClick={runCustomSearch} 
              disabled={isLoading || !customSearch.query.trim()}
              className="w-full"
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

            {customSearchResult && (
              <div className="space-y-4">
                {customSearchResult.success ? (
                  <div className="space-y-2">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {customSearchResult.resultsCount}개의 결과를 찾았습니다.
                      </AlertDescription>
                    </Alert>
                    
                    {customSearchResult.filteringInfo && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>필터링 적용:</strong> {customSearchResult.filteringInfo.description}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{customSearchResult.error}</AlertDescription>
                  </Alert>
                )}

                                 {customSearchResult.results && customSearchResult.results.length > 0 ? (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg">검색 결과</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-3">
                         {customSearchResult.results.map((result: any, index: number) => (
                           <div key={index} className="border rounded-lg overflow-hidden">
                             {/* 헤더 */}
                             <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                               <span className="font-medium text-sm">신뢰도: {(result.confidence * 100).toFixed(1)}%</span>
                               <span className="text-xs text-muted-foreground">{result.source}</span>
                             </div>
                             
                             {/* 컨텐츠 */}
                             <div className="p-3">
                               {/* 메인 컨텐츠 */}
                               <div className="mb-3">
                                 <p className="text-sm font-medium text-blue-600 mb-1">
                                   메인 컨텐츠 (페이지 {result.metadata?.pageNumber || 'N/A'}):
                                 </p>
                                 <div className="text-sm bg-blue-50 p-2 rounded whitespace-pre-wrap">
                                   {result.content}
                                 </div>
                               </div>
                               
                               {/* 앞 페이지 */}
                               {result.context?.before && (
                                 <div className="mb-3">
                                   <p className="text-sm font-medium text-gray-600 mb-1">
                                     앞 페이지 (페이지 {result.metadata?.pageNumber ? parseInt(result.metadata.pageNumber) - 1 : 'N/A'}):
                                   </p>
                                   <div className="text-sm bg-gray-50 p-2 rounded text-gray-700 border-l-4 border-blue-200 whitespace-pre-wrap">{result.context.before}</div>
                                 </div>
                               )}
                               
                               {/* 뒤 페이지 */}
                               {result.context?.after && (
                                 <div className="mb-3">
                                   <p className="text-sm font-medium text-gray-600 mb-1">
                                     뒤 페이지 (페이지 {result.metadata?.pageNumber ? parseInt(result.metadata.pageNumber) + 1 : 'N/A'}):
                                   </p>
                                   <div className="text-sm bg-gray-50 p-2 rounded text-gray-700 border-l-4 border-green-200 whitespace-pre-wrap">{result.context.after}</div>
                                 </div>
                               )}
                               
                               {/* 컨텍스트 없음 안내 */}
                               {(!result.context?.before && !result.context?.after) && (
                                 <div className="mb-3">
                                   <p className="text-sm text-muted-foreground italic">
                                     앞뒤 페이지 컨텍스트를 찾을 수 없습니다.
                                   </p>
                                 </div>
                               )}
                               
                               {/* 매칭 정보 */}
                               {result.metadata?.matchInfo && (
                                 <div className="mb-3">
                                   <p className="text-sm font-medium text-purple-600 mb-1">매칭 정보:</p>
                                   <div className="text-xs bg-purple-50 p-2 rounded border-l-4 border-purple-200">
                                     <div className="grid grid-cols-2 gap-2">
                                       <div>
                                         <span className="font-medium">매칭 비율:</span> {(result.metadata.matchInfo.matchRatio * 100).toFixed(1)}%
                                       </div>
                                       <div>
                                         <span className="font-medium">매칭 단어:</span> {result.metadata.matchInfo.meaningfulMatches.length}개
                                       </div>
                                       <div>
                                         <span className="font-medium">쿼리 단어:</span> {result.metadata.matchInfo.queryWords.join(', ')}
                                       </div>
                                       <div>
                                         <span className="font-medium">확장된 단어:</span> {result.metadata.matchInfo.expandedQueryWords.join(', ')}
                                       </div>
                                       <div>
                                         <span className="font-medium">매칭된 단어:</span> {result.metadata.matchInfo.meaningfulMatches.join(', ') || '없음'}
                                       </div>
                                       <div>
                                         <span className="font-medium">원본 매칭:</span> {result.metadata.matchInfo.originalMatches.join(', ') || '없음'}
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               )}
                               
                               {/* 메타데이터 */}
                               {result.metadata && (
                                 <div className="text-xs text-muted-foreground">
                                   <p className="font-medium">메타데이터:</p>
                                   <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                                     {JSON.stringify(result.metadata, null, 2)}
                                   </pre>
                                 </div>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 ) : (
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-lg">검색 결과</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-center py-8">
                         <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                         <p className="text-muted-foreground">
                           검색 결과를 찾을 수 없습니다.
                         </p>
                         <p className="text-sm text-muted-foreground mt-2">
                           다른 키워드로 검색해보세요. (예: "상표법", "등록요건", "심사기준", "비디오", "소프트웨어")
                         </p>
                       </div>
                     </CardContent>
                   </Card>
                 )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 정보 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            테스트 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              이 페이지는 GCP Agent Builder와 연결된 IP-DR 앱에서 문서들의 청킹 상태를 확인합니다:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>전체 문서 검색</strong> - 3개 문서로 제한된 환경에서 전체 검색 수행</li>
              <li><strong>다중 쿼리 테스트</strong> - 상표법, 상표심사기준, 상표권 침해 등 다양한 쿼리로 검색</li>
              <li><strong>메타데이터 분석</strong> - GCP Discovery Engine의 문서 구조 확인</li>
              <li><strong>컨텍스트 표시</strong> - 검색된 청킹의 앞뒤 컨텍스트 정보 제공</li>
              <li><strong>유의어 검색</strong> - 검색어의 유의어를 포함하여 더 넓은 범위의 관련 결과 검색</li>
              <li><strong>매칭 정보 표시</strong> - 모든 검색 결과를 표시하고 매칭 정보를 제공하여 사용자가 관련성 판단</li>
            </ul>
            <p>
              각 문서의 청킹 상태와 검색 가능 여부를 확인하고, 
              실제 검색을 통해 원하는 내용을 찾을 수 있는지 테스트할 수 있습니다.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>최근 업데이트:</strong> 데이터 스토어가 3개 문서로 축소되었습니다. 
                ID 기반 필터링을 제거하고 전체 문서에서 검색하도록 단순화했습니다.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 