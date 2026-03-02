// Authentication 도메인 서버 전용 exports

// 서버 환경에서만 사용하는 서비스들
export { authManager, getEmailProvider, getKakaoProvider, getEnabledProviders, getEnabledSocialProviders } from './_services'