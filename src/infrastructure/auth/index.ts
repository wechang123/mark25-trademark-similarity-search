// Authentication Infrastructure - Auth providers and managers
export * from './providers';

// 전역 인증 매니저 인스턴스
import { AuthProviderManager } from './providers';
import { EmailAuthProvider } from './providers/email';
import { KakaoAuthProvider } from './providers/kakao';

export const authManager = new AuthProviderManager();

// 프로바이더 등록
authManager.registerProvider(new EmailAuthProvider());
authManager.registerSocialProvider(new KakaoAuthProvider());

// 편의 함수들
export const getEmailProvider = () => authManager.getProvider('email');
export const getKakaoProvider = () => authManager.getSocialProvider('kakao');

export const getEnabledProviders = () => authManager.getEnabledProviders();
export const getEnabledSocialProviders = () => authManager.getEnabledSocialProviders();