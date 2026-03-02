'use client'

import { useState, useEffect } from 'react'
import { TrademarkSelectionFlow } from '@/features/trademark-analysis/trademark-selection'
import { CommentPanel, StageComment } from './_components/CommentPanel'
import { StageItem } from './_components/StageItem'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { StopCircle } from 'lucide-react'
import { useDebugWorkflow } from '@/features/admin-debug-console/_hooks/useDebugWorkflow'
import { useAdminAuth } from '@/features/admin-dashboard/_hooks/useAdminAuth'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Separator } from '@/shared/components/ui/separator'

export default function WorkflowDebugPage() {
  const { user } = useAdminAuth()
  const [comments, setComments] = useState<StageComment[]>([])
  const [activeStageId, setActiveStageId] = useState<string | undefined>()

  // 🧪 테스트용 더미 데이터 (나중에 삭제 예정)
  const [showDummyData, setShowDummyData] = useState(true)
  const [testSessionId] = useState(`test-${Date.now()}`)

  const { state, startAnalysis, stopAnalysis } = useDebugWorkflow()
  
  // state 객체에서 필요한 값들 추출
  const {
    sessionId,
    isAnalyzing,
    stages,
    apiCalls,
    dataProcessingLogs,
    checkpoints,
    kiprisSearches,
    finalResult,
    currentProgress,
    error
  } = state

  // 🔄 DB에서 코멘트 로드
  useEffect(() => {
    const loadComments = async () => {
      const currentSessionId = sessionId || testSessionId
      if (!currentSessionId) return

      try {
        const response = await fetch(
          `/api/admin/workflow/stage-comments?sessionId=${currentSessionId}`
        )

        if (response.ok) {
          const result = await response.json()
          setComments(result.data || [])
          console.log('✅ Loaded', result.data?.length || 0, 'comments from DB')
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      }
    }

    loadComments()
  }, [sessionId, testSessionId])

  // 🧪 테스트용 더미 스테이지 데이터 (나중에 삭제 예정)
  const dummyStages = [
    {
      id: 'dummy-stage-1',
      name: '상품 분류 단계',
      status: 'completed' as const,
      startTime: '2025-10-29T11:00:00',
      endTime: '2025-10-29T11:00:15',
      substeps: [
        { id: 'substep-1-1', name: '사용자 입력 분석', status: 'completed' as const, description: '나이가리 브랜드로 화장품 판매 예정' },
        { id: 'substep-1-2', name: 'RAG 검색 수행', status: 'completed' as const, description: '화장품 관련 상품 분류 코드 검색 완료' },
        { id: 'substep-1-3', name: '상품 추천', status: 'completed' as const, description: '제3류 향료, 화장품, 치약 등 추천' }
      ],
      data: {
        businessDescription: '나이가리 브랜드로 화장품을 판매할 예정입니다.',
        recommendedClass: '제3류',
        classDescription: '향료, 화장품, 치약, 비누 등',
        confidence: 95
      }
    },
    {
      id: 'dummy-stage-2',
      name: 'KIPRIS 검색',
      status: 'completed' as const,
      startTime: '2025-10-29T11:00:15',
      endTime: '2025-10-29T11:00:25',
      substeps: [
        { id: 'substep-2-1', name: '유사 상표 검색', status: 'completed' as const, description: '나이가리와 유사한 상표 50건 검색' },
        { id: 'substep-2-2', name: '유사도 분석', status: 'completed' as const, description: '높은 유사도 상표 5건 발견' }
      ],
      data: {
        totalResults: 50,
        highRiskCount: 5,
        mediumRiskCount: 12,
        lowRiskCount: 33
      }
    },
    {
      id: 'dummy-stage-3',
      name: '최종 분석',
      status: 'completed' as const,
      startTime: '2025-10-29T11:00:25',
      endTime: '2025-10-29T11:00:35',
      substeps: [
        { id: 'substep-3-1', name: 'AI 종합 분석', status: 'completed' as const, description: 'Gemini 2.5 Pro를 통한 종합 리스크 평가' },
        { id: 'substep-3-2', name: '등록 가능성 산출', status: 'completed' as const, description: '65% 등록 가능성 (중간 리스크)' }
      ],
      data: {
        registrationProbability: 65,
        aiConfidence: 82,
        riskLevel: 'medium',
        recommendation: '유사 상표가 존재하여 주의 필요. 변리사 상담 권장'
      }
    }
  ]

  // 분석 시작 핸들러
  const handleAnalysisStart = (newSessionId: string) => {
    console.log('🚀 Debug analysis started:', newSessionId)
    setShowDummyData(false) // 실제 분석 시작하면 더미 데이터 숨김
    startAnalysis(newSessionId)
  }

  // 코멘트 관련 핸들러
  const handleStageCommentClick = (stageId: string) => {
    setActiveStageId(stageId)
  }

  const handleAddComment = async (stageId: string, text: string) => {
    const stage = displayStages.find(s => s.id === stageId) // ✅ displayStages 사용 (더미 데이터 포함)
    const authorName = user?.name || user?.email || 'Unknown'
    const currentSessionId = sessionId || testSessionId // ✅ fallback 처리

    // Optimistic update
    const tempComment: StageComment = {
      id: `comment-${Date.now()}`,
      stageId,
      stageName: stage?.name || '',
      text,
      author: authorName,
      timestamp: new Date().toLocaleString('ko-KR'),
      resolved: false,
      replies: []
    }
    setComments([...comments, tempComment])

    // Save to DB
    try {
      const response = await fetch('/api/admin/workflow/stage-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId, // ✅ testSessionId 포함
          stageId,
          stageName: stage?.name || '',
          text,
          author: authorName
        })
      })

      if (!response.ok) {
        console.error('Failed to save comment')
        // Rollback on error
        setComments(comments)
      } else {
        // ✅ 저장 성공 후 DB에서 전체 코멘트 재로드
        const reloadResponse = await fetch(
          `/api/admin/workflow/stage-comments?sessionId=${currentSessionId}`
        )
        if (reloadResponse.ok) {
          const result = await reloadResponse.json()
          setComments(result.data || [])
          console.log('✅ Comment saved & reloaded', result.data?.length || 0, 'total comments')
        }
      }
    } catch (error) {
      console.error('Error saving comment:', error)
      // Rollback on error
      setComments(comments)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    const newResolvedState = !comment.resolved

    // Optimistic update
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, resolved: newResolvedState } : c
    ))

    // Save to DB
    try {
      const response = await fetch('/api/admin/workflow/stage-comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          action: 'resolve',
          resolved: newResolvedState
        })
      })

      if (!response.ok) {
        console.error('Failed to update comment')
        // Rollback on error
        setComments(comments.map(c =>
          c.id === commentId ? { ...c, resolved: !newResolvedState } : c
        ))
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      // Rollback on error
      setComments(comments.map(c =>
        c.id === commentId ? { ...c, resolved: !newResolvedState } : c
      ))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    // Optimistic update
    const previousComments = comments
    setComments(comments.filter(c => c.id !== commentId))

    // Delete from DB
    try {
      const response = await fetch(`/api/admin/workflow/stage-comments?id=${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error('Failed to delete comment')
        // Rollback on error
        setComments(previousComments)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      // Rollback on error
      setComments(previousComments)
    }
  }

  const handleReplyComment = async (commentId: string, text: string) => {
    const authorName = user?.name || user?.email || 'Unknown'

    const newReply = {
      id: `reply-${Date.now()}`,
      text,
      author: authorName,
      timestamp: new Date().toLocaleString('ko-KR')
    }

    // Optimistic update
    const previousComments = comments
    setComments(comments.map(c =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, newReply] }
        : c
    ))

    // Save to DB
    try {
      const response = await fetch('/api/admin/workflow/stage-comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          action: 'reply',
          reply: {
            text,
            author: authorName
          }
        })
      })

      if (!response.ok) {
        console.error('Failed to add reply')
        // Rollback on error
        setComments(previousComments)
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      // Rollback on error
      setComments(previousComments)
    }
  }

  // 테스트용 수동 이벤트 발생 (디버그 모드)
  const handleTestEvent = async () => {
    if (!sessionId) {
      alert('세션 ID가 없습니다. 먼저 분석을 시작하세요.')
      return
    }
    
    console.log('🧪 [Test] Manually triggering test event for session:', sessionId)
    
    // 테스트 이벤트를 직접 발생
    const testEvents = [
      { stage: 'goods_classification', substep: 'extract_query', status: 'completed' },
      { stage: 'goods_classification', substep: 'rag_search', status: 'processing' },
      { stage: 'goods_classification', substep: 'rag_search', status: 'completed' },
      { stage: 'goods_classification', substep: 'select_products', status: 'completed' },
      { stage: 'kipris_search', substep: 'kipris_request', status: 'processing' }
    ]
    
    for (const event of testEvents) {
      await fetch('/api/admin/workflow/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, ...event })
      })
      await new Promise(resolve => setTimeout(resolve, 500)) // 0.5초 대기
    }
  }

  // Stage별 코멘트 수 계산
  const stageCommentCounts = comments.reduce((acc, comment) => {
    acc[comment.stageId] = (acc[comment.stageId] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  // 🧪 표시할 스테이지 결정: 실제 데이터가 있으면 실제 데이터, 없으면 더미 데이터
  const displayStages = stages.length > 0 ? stages : (showDummyData ? dummyStages : [])

  // Get stage number mapping from stages array
  const getStageNumberMapping = () => {
    if (displayStages.length === 0) return {}

    return displayStages.reduce((acc, stage, index) => {
      acc[stage.id] = index + 1
      return acc
    }, {} as { [key: string]: number })
  }

  const stageNumberMapping = getStageNumberMapping()

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* 3-패널 레이아웃 - 전체 화면 */}
      <div className="flex h-screen overflow-hidden">
        {/* 왼쪽 패널 - 상표 입력 폼 (30%) */}
        <div className="w-[30%] border-r bg-white flex flex-col">
          <div className="p-4 border-b bg-white">
            <h2 className="font-semibold">분석 입력</h2>
            <p className="text-sm text-muted-foreground">
              상표 정보를 입력하고 분석을 시작하세요
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TrademarkSelectionFlow
              mode="debug"
              onAnalysisStart={handleAnalysisStart}
              className="h-full"
            />
          </div>
        </div>

        {/* 가운데 패널 - 실시간 진행 상황 (45%) */}
        <div className="w-[45%] border-r bg-gray-50 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">실시간 진행 상황</h2>
                {sessionId && (
                  <p className="text-sm text-muted-foreground">
                    세션 ID: {sessionId}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAnalyzing && (
                  <>
                    <Badge variant="default" className="animate-pulse">
                      분석 중...
                    </Badge>
                    <Progress value={currentProgress} className="w-24" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopAnalysis}
                    >
                      <StopCircle className="h-4 w-4 mr-1" />
                      중지
                    </Button>
                  </>
                )}
                {sessionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestEvent}
                    title="테스트 이벤트 수동 발생"
                  >
                    🧪
                  </Button>
                )}
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}

              {displayStages.length > 0 ? (
                <>
                  {showDummyData && stages.length === 0 && (
                    <Card className="border-yellow-200 bg-yellow-50 mb-4">
                      <CardContent className="pt-4">
                        <p className="text-sm text-yellow-800">
                          🧪 <strong>테스트 모드:</strong> 코멘트 기능 테스트를 위한 샘플 데이터입니다. 실제 분석을 시작하면 이 데이터는 사라집니다.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {displayStages.map((stage, index) => (
                    <StageItem
                      key={stage.id}
                      stage={stage}
                      stageNumber={index + 1}
                      onCommentClick={handleStageCommentClick}
                      commentCount={stageCommentCounts[stage.id] || 0}
                    />
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                      왼쪽 패널에서 상표 정보를 입력하고<br />
                      분석을 시작하세요
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* API 호출 로그 - UI에서 숨김, 데이터베이스 저장은 계속됨 */}
              {/* {apiCalls.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-semibold mb-3">API 호출 로그</h3>
                    <div className="space-y-2">
                      {apiCalls.map((call, index) => (
                        <Card key={call.id || index} className="bg-white">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{call.api_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {call.execution_time_ms ? `${call.execution_time_ms}ms` : 'Processing...'}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{call.stage}</p>
                            {call.tokens_used && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tokens: {call.tokens_used} | Cost: ${call.cost_estimate?.toFixed(4) || '0'}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )} */}
              
              {/* 데이터 처리 로그 - UI에서 숨김, 데이터베이스 저장은 계속됨 */}
              {/* {dataProcessingLogs.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-semibold mb-3">데이터 처리 로그</h3>
                    <div className="space-y-2">
                      {dataProcessingLogs.map((log, index) => (
                        <Card key={log.id || index} className="bg-white">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">{log.process_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {log.input_count} → {log.output_count}
                              </span>
                            </div>
                            <p className="text-sm mt-2">{log.stage}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )} */}
              
              {/* 최종 결과 */}
              {finalResult && (
                <>
                  <Separator className="my-4" />
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle>분석 완료</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">등록 가능성:</span> {finalResult.registration_probability}%
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">AI 신뢰도:</span> {finalResult.ai_confidence}%
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">위험 수준:</span>
                          <Badge variant={
                            finalResult.risk_level === 'low' ? 'secondary' :
                            finalResult.risk_level === 'medium' ? 'outline' : 'destructive'
                          } className="ml-2">
                            {finalResult.risk_level}
                          </Badge>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 오른쪽 패널 - 코멘트 (25%) */}
        <div className="w-[25%] bg-white flex flex-col overflow-hidden">
          <CommentPanel
            comments={comments}
            stageNumberMapping={stageNumberMapping}
            activeStageId={activeStageId}
            currentUser="Admin"
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            onDeleteComment={handleDeleteComment}
            onReplyComment={handleReplyComment}
            onClearActiveStage={() => setActiveStageId(undefined)} // ✅ Stage 버튼 클릭 시 activeStageId 초기화
          />
        </div>
      </div>
    </div>
  )
}