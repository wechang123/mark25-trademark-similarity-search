/**
 * Mark25 브랜드 컬러 시스템
 * Toss/카카오페이 스타일의 현대적 디자인을 위한 색상 정의
 */

export const brandColors = {
  // Primary Brand Colors (Mark25 메인 컬러 기반)
  primary: {
    50: '#E6F3FF',
    100: '#CCE7FF', 
    200: '#99CFFF',
    300: '#66B7FF',
    400: '#339FFF',
    500: '#007AFF', // 메인 브랜드 컬러
    600: '#0062CC',
    700: '#004999',
    800: '#003166',
    900: '#001933'
  },
  
  // Neutral Colors (그레이스케일)
  neutral: {
    50: '#F8F9FA',   // 배경
    100: '#F1F3F4',  // 카드 배경
    200: '#E5E8EB',  // 테두리
    300: '#D1D5DB',  // 비활성화된 요소
    400: '#9CA3AF',  // 플레이스홀더
    500: '#8B95A1',  // 보조 텍스트
    600: '#6B7280',  // 일반 텍스트
    700: '#4B5563',  // 강조 텍스트
    800: '#374151',  // 제목
    900: '#191F28'   // 메인 텍스트
  },
  
  // Status Colors
  success: {
    50: '#ECFDF5',
    500: '#34C759',
    600: '#16A34A',
    700: '#15803D'
  },
  
  warning: {
    50: '#FFFBEB', 
    500: '#FF9500',
    600: '#D97706',
    700: '#B45309'
  },
  
  error: {
    50: '#FEF2F2',
    500: '#FF3B30',
    600: '#DC2626', 
    700: '#B91C1C'
  },
  
  info: {
    50: '#EFF6FF',
    500: '#5AC8FA',
    600: '#3B82F6',
    700: '#1D4ED8'
  }
} as const

// 컴포넌트별 색상 토큰
export const semanticColors = {
  // 메시지 버블
  message: {
    user: {
      background: brandColors.primary[500],
      text: '#FFFFFF',
      timestamp: brandColors.primary[100]
    },
    assistant: {
      background: '#FFFFFF',
      text: brandColors.neutral[900],
      timestamp: brandColors.neutral[500],
      border: brandColors.neutral[200]
    }
  },
  
  // 버튼
  button: {
    primary: {
      background: brandColors.primary[500],
      hover: brandColors.primary[600],
      active: brandColors.primary[700],
      text: '#FFFFFF'
    },
    secondary: {
      background: '#FFFFFF',
      hover: brandColors.neutral[50],
      active: brandColors.neutral[100],
      text: brandColors.neutral[700],
      border: brandColors.neutral[200]
    }
  },
  
  // 상태 표시
  status: {
    pending: brandColors.neutral[400],
    active: brandColors.primary[500], 
    completed: brandColors.success[500],
    error: brandColors.error[500]
  }
} as const

// CSS Custom Properties로 export
export const cssVariables = {
  '--color-primary': brandColors.primary[500],
  '--color-primary-hover': brandColors.primary[600],
  '--color-surface': '#FFFFFF',
  '--color-background': brandColors.neutral[50],
  '--color-border': brandColors.neutral[200],
  '--color-text-primary': brandColors.neutral[900],
  '--color-text-secondary': brandColors.neutral[500]
} as const