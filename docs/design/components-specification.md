# Component Specifications - Trademark Analysis Results

## Overview
Detailed component specifications for the modern trademark analysis results interface, including TypeScript interfaces, implementation examples, and integration patterns.

## Base Component Library

### 1. Card Component
**File**: `src/shared/components/ui/analysis-card.tsx`

```typescript
interface AnalysisCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  headerActions?: React.ReactNode;
  className?: string;
}

export function AnalysisCard({
  children,
  title,
  subtitle,
  icon,
  isCollapsible = false,
  defaultExpanded = true,
  headerActions,
  className
}: AnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className={cn(
      "bg-white rounded-lg border border-neutral-200 shadow-sm",
      className
    )}>
      {(title || isCollapsible) && (
        <div className="px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="flex-shrink-0 text-primary-500">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {headerActions}
              {isCollapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "접기" : "펼치기"}
                >
                  <ChevronDownIcon 
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "transform rotate-180"
                    )}
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {(!isCollapsible || isExpanded) && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
}
```

### 2. Risk Badge Component
**File**: `src/shared/components/ui/risk-badge.tsx`

```typescript
interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const riskConfig = {
  low: {
    color: 'bg-success-100 text-success-700 border-success-200',
    icon: CheckCircleIcon,
    label: '낮은 위험'
  },
  medium: {
    color: 'bg-warning-100 text-warning-700 border-warning-200',
    icon: ExclamationTriangleIcon,
    label: '중간 위험'
  },
  high: {
    color: 'bg-error-100 text-error-700 border-error-200',
    icon: XCircleIcon,
    label: '높은 위험'
  }
};

export function RiskBadge({
  level,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className
}: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium border",
      config.color,
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <Icon className="w-4 h-4 mr-1.5" />
      )}
      {showLabel && config.label}
    </span>
  );
}
```

### 3. Progress Indicator Component
**File**: `src/shared/components/ui/progress-indicator.tsx`

```typescript
interface ProgressIndicatorProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  animated?: boolean;
  label?: string;
  sublabel?: string;
}

export function CircularProgressIndicator({
  value,
  size = 120,
  strokeWidth = 8,
  color = brandColors.primary[500],
  showValue = true,
  animated = true,
  label,
  sublabel
}: ProgressIndicatorProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <svg
          className={cn(
            "transform -rotate-90",
            animated && "transition-all duration-1000 ease-out"
          )}
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={brandColors.neutral[200]}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={animated ? "transition-all duration-1000 ease-out" : ""}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-neutral-900">
              {Math.round(value)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">{label}</p>
          {sublabel && (
            <p className="text-xs text-neutral-500">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## Feature Components

### 4. Analysis Hero Section
**File**: `src/features/trademark-analysis/_components/reports/modern/AnalysisHeroSection.tsx`

```typescript
interface AnalysisHeroSectionProps {
  metadata: AnalysisMetadata;
  summary: AnalysisSummary;
}

export function AnalysisHeroSection({ metadata, summary }: AnalysisHeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                {metadata.trademarkName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <RiskBadge level={summary.overallRisk} />
                <span className="text-sm text-neutral-500">
                  분석일: {formatDate(metadata.analysisDate)}
                </span>
                <span className="text-sm text-neutral-500">
                  버전: {metadata.analysisVersion}
                </span>
              </div>
            </div>
            
            {/* Key Findings */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                주요 발견사항
              </h3>
              <ul className="space-y-2">
                {summary.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-neutral-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Right side - Progress Indicators */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <CircularProgressIndicator
              value={summary.registrationPossibility}
              color={getRiskColor(summary.overallRisk)}
              label="등록 가능성"
              sublabel="AI 예측 결과"
              animated
            />
            <CircularProgressIndicator
              value={summary.aiConfidence}
              color={brandColors.info[500]}
              label="분석 신뢰도"
              sublabel="AI 확신도"
              animated
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper function
function getRiskColor(risk: string): string {
  const colors = {
    low: brandColors.success[500],
    medium: brandColors.warning[500],
    high: brandColors.error[500]
  };
  return colors[risk as keyof typeof colors] || brandColors.neutral[400];
}
```

### 5. Risk Assessment Card
**File**: `src/features/trademark-analysis/_components/reports/modern/RiskAssessmentCard.tsx`

```typescript
interface RiskAssessmentCardProps {
  summary: AnalysisSummary;
  legalRisk: LegalRiskData;
}

export function RiskAssessmentCard({ summary, legalRisk }: RiskAssessmentCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <AnalysisCard
      title="위험도 평가"
      subtitle="상표 등록 과정에서 예상되는 위험 요소"
      icon={<ShieldExclamationIcon className="w-6 h-6" />}
      isCollapsible
      defaultExpanded
    >
      <div className="space-y-6">
        {/* Risk Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-neutral-900 mb-1">
              {summary.registrationPossibility}%
            </div>
            <div className="text-sm text-neutral-500">등록 가능성</div>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <RiskBadge level={summary.overallRisk} size="lg" />
            <div className="text-sm text-neutral-500 mt-2">전체 위험도</div>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-neutral-900 mb-1">
              {summary.aiConfidence}%
            </div>
            <div className="text-sm text-neutral-500">AI 신뢰도</div>
          </div>
        </div>
        
        {/* Risk Factors */}
        {legalRisk.riskFactors.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-neutral-800 mb-3">
              위험 요소
            </h4>
            <div className="space-y-2">
              {legalRisk.riskFactors.slice(0, showDetails ? undefined : 3).map((factor, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-warning-800">{factor}</span>
                </div>
              ))}
            </div>
            
            {legalRisk.riskFactors.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mt-3 text-primary-600 hover:text-primary-700"
              >
                {showDetails ? '간단히 보기' : `${legalRisk.riskFactors.length - 3}개 더 보기`}
              </Button>
            )}
          </div>
        )}
        
        {/* Legal Basis */}
        {legalRisk.legalBasis && (
          <div>
            <h4 className="text-md font-semibold text-neutral-800 mb-2">
              법적 근거
            </h4>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{legalRisk.legalBasis}</p>
            </div>
          </div>
        )}
      </div>
    </AnalysisCard>
  );
}
```

### 6. Similar Trademarks Panel
**File**: `src/features/trademark-analysis/_components/reports/modern/SimilarTrademarksPanel.tsx`

```typescript
interface SimilarTrademarksPanelProps {
  similarTrademarks: SimilarTrademarksData;
  onTrademarkClick?: (trademark: SimilarTrademark) => void;
}

export function SimilarTrademarksPanel({ 
  similarTrademarks, 
  onTrademarkClick 
}: SimilarTrademarksPanelProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'similarity' | 'date' | 'risk'>('similarity');
  
  const filteredTrademarks = useMemo(() => {
    let filtered = similarTrademarks.trademarks;
    
    // Apply risk filter
    if (filter !== 'all') {
      filtered = filtered.filter(tm => tm.riskLevel === filter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'similarity':
          return b.similarity - a.similarity;
        case 'date':
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
        case 'risk':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [similarTrademarks.trademarks, filter, sortBy]);
  
  if (similarTrademarks.totalCount === 0) {
    return (
      <AnalysisCard
        title="유사 상표 분석"
        subtitle="등록된 유사 상표가 발견되지 않았습니다"
        icon={<MagnifyingGlassIcon className="w-6 h-6" />}
      >
        <div className="text-center py-8">
          <CheckCircleIcon className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            유사 상표 없음
          </h3>
          <p className="text-neutral-500">
            현재 등록된 유사 상표가 발견되지 않아 등록 가능성이 높습니다.
          </p>
        </div>
      </AnalysisCard>
    );
  }
  
  return (
    <AnalysisCard
      title="유사 상표 분석"
      subtitle={`총 ${similarTrademarks.totalCount}건 발견 (고위험 ${similarTrademarks.highRiskCount}건)`}
      icon={<DocumentDuplicateIcon className="w-6 h-6" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="high">고위험</SelectItem>
              <SelectItem value="medium">중위험</SelectItem>
              <SelectItem value="low">저위험</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="similarity">유사도순</SelectItem>
              <SelectItem value="date">최신순</SelectItem>
              <SelectItem value="risk">위험도순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="space-y-4">
        {filteredTrademarks.map((trademark) => (
          <TrademarkCard
            key={trademark.id}
            trademark={trademark}
            onClick={() => onTrademarkClick?.(trademark)}
          />
        ))}
      </div>
    </AnalysisCard>
  );
}

// Trademark Card Component
interface TrademarkCardProps {
  trademark: SimilarTrademark;
  onClick?: () => void;
}

function TrademarkCard({ trademark, onClick }: TrademarkCardProps) {
  return (
    <div
      className={cn(
        "border border-neutral-200 rounded-lg p-4 transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary-300 hover:shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="font-semibold text-neutral-900">{trademark.name}</h4>
            <RiskBadge level={trademark.riskLevel} size="sm" />
          </div>
          <div className="space-y-1 text-sm text-neutral-600">
            <p>출원인: {trademark.applicant}</p>
            <p>출원일: {formatDate(trademark.applicationDate)}</p>
            <p>상태: {trademark.status}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-neutral-900">
            {trademark.similarity}%
          </div>
          <div className="text-xs text-neutral-500">유사도</div>
        </div>
      </div>
    </div>
  );
}
```

### 7. Recommendations Panel
**File**: `src/features/trademark-analysis/_components/reports/modern/RecommendationsPanel.tsx`

```typescript
interface RecommendationsPanelProps {
  conclusion: ConclusionData;
  summary: AnalysisSummary;
}

export function RecommendationsPanel({ conclusion, summary }: RecommendationsPanelProps) {
  const priorityRecommendations = conclusion.strategicAdvice.slice(0, 3);
  const additionalRecommendations = conclusion.strategicAdvice.slice(3);
  
  return (
    <AnalysisCard
      title="전략적 권고사항"
      subtitle="상표 등록을 위한 맞춤 전략"
      icon={<LightBulbIcon className="w-6 h-6" />}
    >
      <div className="space-y-6">
        {/* Priority Recommendations */}
        <div>
          <h4 className="text-md font-semibold text-neutral-800 mb-3">
            우선 권고사항
          </h4>
          <div className="space-y-3">
            {priorityRecommendations.map((advice, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{advice}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Additional Recommendations */}
        {additionalRecommendations.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-neutral-800 mb-3">
              추가 고려사항
            </h4>
            <div className="space-y-2">
              {additionalRecommendations.map((advice, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <ChevronRightIcon className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-neutral-600">{advice}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Risk-based CTA */}
        <div className="pt-4 border-t border-neutral-100">
          {summary.overallRisk === 'high' ? (
            <Alert className="border-error-200 bg-error-50">
              <ExclamationTriangleIcon className="h-4 w-4 text-error-600" />
              <AlertDescription className="text-error-800">
                높은 위험도로 인해 전문가 상담을 강력히 권장합니다.
              </AlertDescription>
            </Alert>
          ) : summary.overallRisk === 'medium' ? (
            <Alert className="border-warning-200 bg-warning-50">
              <InformationCircleIcon className="h-4 w-4 text-warning-600" />
              <AlertDescription className="text-warning-800">
                중간 위험도입니다. 전문가 검토를 받아보시는 것을 권장합니다.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-success-200 bg-success-50">
              <CheckCircleIcon className="h-4 w-4 text-success-600" />
              <AlertDescription className="text-success-800">
                낮은 위험도로 등록 진행이 가능할 것으로 보입니다.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AnalysisCard>
  );
}
```

### 8. Action Buttons Group
**File**: `src/features/trademark-analysis/_components/reports/modern/ActionButtonsGroup.tsx`

```typescript
interface ActionButtonsGroupProps {
  onExpertConsultation: () => void;
  onPDFDownload: () => void;
  onBack: () => void;
  onShare?: () => void;
  isLoadingConsultation?: boolean;
  isLoadingPDF?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

export function ActionButtonsGroup({
  onExpertConsultation,
  onPDFDownload,
  onBack,
  onShare,
  isLoadingConsultation = false,
  isLoadingPDF = false,
  riskLevel = 'medium'
}: ActionButtonsGroupProps) {
  const isHighRisk = riskLevel === 'high';
  
  return (
    <AnalysisCard
      title="다음 단계"
      subtitle="분석 결과를 바탕으로 진행하세요"
      icon={<ArrowRightIcon className="w-6 h-6" />}
    >
      <div className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-3">
          <Button
            onClick={onExpertConsultation}
            disabled={isLoadingConsultation}
            className={cn(
              "w-full",
              isHighRisk && "bg-error-500 hover:bg-error-600"
            )}
            size="lg"
          >
            {isLoadingConsultation ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                분석 요청 중...
              </>
            ) : (
              <>
                <UserGroupIcon className="w-4 h-4 mr-2" />
                {isHighRisk ? '긴급 전문가 상담' : '전문가 상담 신청'}
              </>
            )}
          </Button>
          
          <Button
            onClick={onPDFDownload}
            disabled={isLoadingPDF}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoadingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                PDF 생성 중...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                상세 보고서 다운로드
              </>
            )}
          </Button>
        </div>
        
        {/* Secondary Actions */}
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          {onShare && (
            <Button
              onClick={onShare}
              variant="ghost"
              className="w-full justify-start"
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              분석 결과 공유
            </Button>
          )}
          
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full justify-start"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            새로운 분석 시작
          </Button>
        </div>
        
        {/* Risk-based Notice */}
        {isHighRisk && (
          <Alert className="border-error-200 bg-error-50">
            <ExclamationTriangleIcon className="h-4 w-4 text-error-600" />
            <AlertDescription className="text-error-800 text-xs">
              높은 위험도가 감지되었습니다. 등록 진행 전 반드시 전문가 상담을 받으시기 바랍니다.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Contact Information */}
        <div className="pt-4 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 text-center">
            문의사항이 있으시면 support@ipdr.co.kr로 연락해 주세요
          </p>
        </div>
      </div>
    </AnalysisCard>
  );
}
```

## Integration Pattern

### Main Container Component
**File**: `src/features/trademark-analysis/_components/reports/modern/ModernAnalysisResults.tsx`

```typescript
interface ModernAnalysisResultsProps {
  data: NormalizedAnalysisData;
  onBack: () => void;
  onExpertConsultation: () => void;
  onPDFDownload: () => void;
  className?: string;
}

export function ModernAnalysisResults({
  data,
  onBack,
  onExpertConsultation,
  onPDFDownload,
  className
}: ModernAnalysisResultsProps) {
  const [selectedTrademark, setSelectedTrademark] = useState<SimilarTrademark | null>(null);
  
  const handleTrademarkClick = (trademark: SimilarTrademark) => {
    setSelectedTrademark(trademark);
    // Open detailed view modal or navigate to detail page
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.data.metadata.trademarkName} 상표 분석 결과`,
          text: `Mark25에서 분석한 상표 등록 가능성: ${data.data.summary.registrationPossibility}%`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };
  
  if (!data.success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            분석 결과를 불러올 수 없습니다
          </h2>
          <p className="text-neutral-500 mb-6">
            잠시 후 다시 시도해 주세요.
          </p>
          <Button onClick={onBack}>
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("min-h-screen bg-neutral-50", className)}>
      {/* Hero Section */}
      <AnalysisHeroSection
        metadata={data.data.metadata}
        summary={data.data.summary}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <RiskAssessmentCard
              summary={data.data.summary}
              legalRisk={data.data.legalRisk}
            />
            
            <SimilarTrademarksPanel
              similarTrademarks={data.data.similarTrademarks}
              onTrademarkClick={handleTrademarkClick}
            />
            
            <LegalInsightsSection
              legalRisk={data.data.legalRisk}
            />
          </div>
          
          {/* Right Column - Actions & Timeline */}
          <div className="space-y-6">
            <ActionButtonsGroup
              onExpertConsultation={onExpertConsultation}
              onPDFDownload={onPDFDownload}
              onBack={onBack}
              onShare={handleShare}
              riskLevel={data.data.summary.overallRisk}
            />
            
            <RecommendationsPanel
              conclusion={data.data.conclusion}
              summary={data.data.summary}
            />
            
            <AnalysisTimelineCard
              analysisProcess={data.data.analysisProcess}
            />
          </div>
        </div>
      </div>
      
      {/* Trademark Detail Modal */}
      {selectedTrademark && (
        <TrademarkDetailModal
          trademark={selectedTrademark}
          isOpen={!!selectedTrademark}
          onClose={() => setSelectedTrademark(null)}
        />
      )}
    </div>
  );
}
```

## Utility Functions

### Date Formatting
```typescript
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
```

### Risk Level Utilities
```typescript
export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: brandColors.success[500],
    medium: brandColors.warning[500],
    high: brandColors.error[500]
  };
  return colors[level];
}

export function getRiskLabel(level: 'low' | 'medium' | 'high'): string {
  const labels = {
    low: '낮은 위험',
    medium: '중간 위험',
    high: '높은 위험'
  };
  return labels[level];
}
```

## Testing Strategy

### Component Testing
```typescript
// Example test for RiskBadge component
describe('RiskBadge', () => {
  it('should display correct risk level styling', () => {
    render(<RiskBadge level="high" />);
    
    const badge = screen.getByText('높은 위험');
    expect(badge).toHaveClass('bg-error-100', 'text-error-700');
  });
  
  it('should show icon when showIcon is true', () => {
    render(<RiskBadge level="medium" showIcon={true} />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// Example integration test for ModernAnalysisResults
describe('ModernAnalysisResults', () => {
  const mockData = {
    success: true,
    data: {
      metadata: { /* mock metadata */ },
      summary: { /* mock summary */ },
      // ... other mock data
    }
  };
  
  it('should render all main sections', () => {
    render(
      <ModernAnalysisResults
        data={mockData}
        onBack={jest.fn()}
        onExpertConsultation={jest.fn()}
        onPDFDownload={jest.fn()}
      />
    );
    
    expect(screen.getByText('위험도 평가')).toBeInTheDocument();
    expect(screen.getByText('유사 상표 분석')).toBeInTheDocument();
    expect(screen.getByText('전략적 권고사항')).toBeInTheDocument();
  });
});
```

This comprehensive component specification provides the foundation for implementing a modern, professional trademark analysis results interface that meets all the requirements outlined in the design specification.