// Features (Business Logic) - 우선순위 최고
export * from './features'

// Shared Resources - Namespaced export로 충돌 방지
export * as Shared from './shared'

// Infrastructure - Namespaced export로 충돌 방지  
export * as Infrastructure from './infrastructure'