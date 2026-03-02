/**
 * API 레지스트리 통합 export
 */

export * from './api-registry';

/**
 * 미리 정의된 API 등록
 * 기본적인 인증 API들을 미리 등록해둡니다.
 */
import { apiRegistry, registerApi } from './api-registry';
import {
  SignupRequestSchema,
  SignupResponseSchema,
  SigninRequestSchema,
  SigninResponseSchema,
  UpdateProfileRequestSchema,
  UserProfileResponseSchema,
  ResetPasswordRequestSchema,
  ResetPasswordResponseSchema
} from '../schemas/auth.schema';

/**
 * 인증 관련 API 등록
 */
export const registerAuthApis = () => {
  // POST /api/auth/signup
  registerApi({
    method: 'POST',
    path: '/api/auth/signup',
    tags: ['Authentication'],
    summary: '회원가입',
    description: '새로운 사용자 계정을 생성합니다.',
    security: false,
    requestSchema: SignupRequestSchema,
    responseSchema: SignupResponseSchema,
    responses: {
      '201': {
        description: '회원가입 성공',
        schema: SignupResponseSchema
      },
      '409': {
        description: '이미 존재하는 이메일',
      }
    }
  });

  // POST /api/auth/signin
  registerApi({
    method: 'POST',
    path: '/api/auth/signin',
    tags: ['Authentication'],
    summary: '로그인',
    description: '이메일과 비밀번호로 로그인합니다.',
    security: false,
    requestSchema: SigninRequestSchema,
    responseSchema: SigninResponseSchema
  });

  // GET /api/auth/user
  registerApi({
    method: 'GET',
    path: '/api/auth/user',
    tags: ['Authentication'],
    summary: '사용자 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
    security: true,
    responseSchema: UserProfileResponseSchema
  });

  // PUT /api/auth/user
  registerApi({
    method: 'PUT',
    path: '/api/auth/user',
    tags: ['Authentication'],
    summary: '사용자 정보 수정',
    description: '현재 로그인한 사용자의 정보를 수정합니다.',
    security: true,
    requestSchema: UpdateProfileRequestSchema,
    responseSchema: UserProfileResponseSchema
  });

  // POST /api/auth/reset-password
  registerApi({
    method: 'POST',
    path: '/api/auth/reset-password',
    tags: ['Authentication'],
    summary: '비밀번호 재설정',
    description: '이메일로 비밀번호 재설정 링크를 발송합니다.',
    security: false,
    requestSchema: ResetPasswordRequestSchema,
    responseSchema: ResetPasswordResponseSchema
  });

  // POST /api/auth/signout
  registerApi({
    method: 'POST',
    path: '/api/auth/signout',
    tags: ['Authentication'],
    summary: '로그아웃',
    description: '현재 세션을 종료합니다.',
    security: true,
    responses: {
      '200': {
        description: '로그아웃 성공'
      }
    }
  });
};

/**
 * 기본 API들 자동 등록
 */
registerAuthApis();