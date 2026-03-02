import { z } from 'zod';

/**
 * 인증 관련 API 스키마 정의
 */

// 회원가입 요청 스키마
export const SignupRequestSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.').describe('사용자 이메일'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.').describe('비밀번호'),
  name: z.string().min(1, '이름을 입력해주세요.').optional().describe('사용자 이름'),
  phone: z.string().optional().describe('전화번호'),
  marketingAgreed: z.boolean().optional().default(false).describe('마케팅 수신 동의 여부')
});

// 회원가입 응답 스키마
export const SignupResponseSchema = z.object({
  success: z.boolean().default(true),
  user: z.object({
    id: z.string().uuid().describe('사용자 ID'),
    email: z.string().email().describe('사용자 이메일'),
    name: z.string().optional().describe('사용자 이름')
  }).optional().describe('생성된 사용자 정보'),
  message: z.string().optional().describe('응답 메시지')
});

// 로그인 요청 스키마
export const SigninRequestSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.').describe('사용자 이메일'),
  password: z.string().min(1, '비밀번호를 입력해주세요.').describe('비밀번호')
});

// 로그인 응답 스키마
export const SigninResponseSchema = z.object({
  success: z.boolean().default(true),
  user: z.object({
    id: z.string().uuid().describe('사용자 ID'),
    email: z.string().email().describe('사용자 이메일'),
    name: z.string().optional().describe('사용자 이름'),
    avatar_url: z.string().url().optional().describe('프로필 이미지 URL')
  }).describe('사용자 정보'),
  accessToken: z.string().describe('JWT 액세스 토큰'),
  refreshToken: z.string().optional().describe('JWT 리프레시 토큰'),
  expiresAt: z.string().datetime().optional().describe('토큰 만료 시간')
});

// 사용자 정보 업데이트 요청 스키마
export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').optional().describe('사용자 이름'),
  phone: z.string().optional().describe('전화번호'),
  avatar_url: z.string().url().optional().describe('프로필 이미지 URL'),
  marketingAgreed: z.boolean().optional().describe('마케팅 수신 동의 여부')
});

// 사용자 정보 응답 스키마
export const UserProfileResponseSchema = z.object({
  success: z.boolean().default(true),
  user: z.object({
    id: z.string().uuid().describe('사용자 ID'),
    email: z.string().email().describe('사용자 이메일'),
    name: z.string().optional().describe('사용자 이름'),
    phone: z.string().optional().describe('전화번호'),
    avatar_url: z.string().url().optional().describe('프로필 이미지 URL'),
    marketingAgreed: z.boolean().describe('마케팅 수신 동의 여부'),
    createdAt: z.string().datetime().describe('계정 생성일'),
    updatedAt: z.string().datetime().describe('정보 수정일')
  }).describe('사용자 정보')
});

// 비밀번호 재설정 요청 스키마
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.').describe('비밀번호를 재설정할 이메일')
});

// 비밀번호 재설정 응답 스키마
export const ResetPasswordResponseSchema = z.object({
  success: z.boolean().default(true),
  message: z.string().describe('재설정 메일 발송 결과 메시지')
});

// OAuth 콜백 쿼리 스키마
export const OAuthCallbackQuerySchema = z.object({
  code: z.string().describe('OAuth 인증 코드'),
  state: z.string().optional().describe('CSRF 방지용 상태값'),
  provider: z.enum(['kakao']).describe('OAuth 제공자')
});

// JWT 토큰 검증 응답 스키마
export const TokenValidationResponseSchema = z.object({
  success: z.boolean().default(true),
  valid: z.boolean().describe('토큰 유효성 여부'),
  user: z.object({
    id: z.string().uuid().describe('사용자 ID'),
    email: z.string().email().describe('사용자 이메일'),
    name: z.string().optional().describe('사용자 이름')
  }).optional().describe('토큰이 유효한 경우 사용자 정보'),
  expiresAt: z.string().datetime().optional().describe('토큰 만료 시간')
});