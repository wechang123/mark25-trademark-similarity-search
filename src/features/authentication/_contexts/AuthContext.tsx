'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase-generated'
import { AuthUser, SecureAuthState } from '../_types/auth'
import { authService } from '../_services/authService'
import { UserRole, AdminUser, AdminPermission, PermissionType } from '@/features/admin-dashboard/_types/admin.types'
import { DEFAULT_ROLE_PERMISSIONS } from '@/features/admin-dashboard/_types/permissions.types'
import { createClient } from '@/infrastructure/database/client'
import { TabSyncManager } from '@/infrastructure/auth/tab-sync'
import { SessionManager } from '@/infrastructure/auth/session-manager'

// Type-safe profile access
type ProfileRow = Database['user_management']['Tables']['profiles']['Row']

interface AuthContextValue {
  // Basic auth state
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Admin state
  adminUser: AdminUser | null

  // Actions
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>

  // Permission helpers
  hasRole: (role: UserRole) => boolean
  hasPermission: (permission: PermissionType) => boolean
  hasAnyPermission: (permissions: PermissionType[]) => boolean
  hasAllPermissions: (permissions: PermissionType[]) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
  isUser: () => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const router = useRouter()
  const [state, setState] = useState<SecureAuthState>({
    user: null,
    isLoading: true,
    error: null,
    isInitialized: false
  })

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const tabSyncRef = useRef<TabSyncManager | null>(null)
  const sessionManagerRef = useRef<SessionManager | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Moved inside useEffect to avoid dependency issues
  const fetchUserWithPermissions = useCallback(async (): Promise<void> => {
    // This function is now mainly used for refreshUser action
    // The actual implementation is in useEffect
    console.log('[Auth Context] Manual refresh requested')
    router.refresh() // Use Next.js router refresh instead of full reload
  }, [router])

  const signOut = useCallback(async () => {
    console.log('[Auth Context] Starting sign out...')
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // authService.signOut() 직접 호출
      await authService.signOut()

      // 상태는 onAuthStateChange의 SIGNED_OUT 이벤트에서 자동으로 초기화됨
      console.log('[Auth Context] Sign out successful, redirecting...')

      // Next.js router로 즉시 리다이렉트 (전체 페이지 reload 없음)
      router.push('/')
    } catch (error) {
      console.error('[Auth Context] Sign out error:', error)
      // 에러가 발생해도 로컬 상태는 초기화
      setState({
        user: null,
        isLoading: false,
        error: '로그아웃 중 오류가 발생했습니다.',
        isInitialized: true
      })
      setAdminUser(null)
      // Next.js router로 메인 페이지로 이동
      router.push('/')
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    console.log('[Auth Context] Refreshing user...')
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    await fetchUserWithPermissions()
  }, [fetchUserWithPermissions])

  // Permission check functions
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!state.user) return false
    return state.user.role === role
  }, [state.user])

  const hasPermission = useCallback((permission: PermissionType): boolean => {
    if (!state.user || !adminUser) return false

    // Admin has all permissions by default
    if (adminUser.role === UserRole.ADMIN) return true

    // Check default role permissions
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[adminUser.role]
    if (rolePermissions.includes(permission)) return true

    // Check explicit permissions
    return adminUser.permissions?.some(
      p => p.permission_type === permission &&
           p.is_active &&
           (!p.expires_at || new Date(p.expires_at) > new Date())
    ) || false
  }, [state.user, adminUser])

  const hasAnyPermission = useCallback((permissions: PermissionType[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }, [hasPermission])

  const hasAllPermissions = useCallback((permissions: PermissionType[]): boolean => {
    return permissions.every(p => hasPermission(p))
  }, [hasPermission])

  const isAdmin = useCallback((): boolean => hasRole(UserRole.ADMIN), [hasRole])
  const isManager = useCallback((): boolean => hasRole(UserRole.MANAGER), [hasRole])
  const isUser = useCallback((): boolean => hasRole(UserRole.USER), [hasRole])

  // Initialize auth on mount with tab sync
  useEffect(() => {
    console.log('[Auth Context] useEffect running - initializing auth')
    let mounted = true
    let timeoutId: NodeJS.Timeout | undefined
    let isInitializing = false  // 초기화 중 플래그 (중복 호출 방지)

    // Initialize managers and create client
    const supabase = createClient()
    supabaseRef.current = supabase
    
    if (typeof window !== 'undefined') {
      tabSyncRef.current = TabSyncManager.getInstance()
      sessionManagerRef.current = SessionManager.getInstance()
      
      // Setup tab sync listeners
      const unsubscribeAuthChange = tabSyncRef.current.on('AUTH_STATE_CHANGE', async (data) => {
        console.log('[Auth Context] Received auth state change from another tab:', data.event)

        if (!mounted) return

        // 다른 탭의 이벤트를 받으면 서버에 직접 확인 (보안)
        // 브로드캐스트는 하지 않음 (무한루프 방지)
        console.log('[Auth Context] Validating session with server...')

        try {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (session && !error) {
            console.log('[Auth Context] Server validated session, updating state (no broadcast)')
            // 서버 검증 통과 → 상태 업데이트 (브로드캐스트 안 함)
            await fetchUserWithPermissionsInner(false, false)
          } else {
            console.log('[Auth Context] No valid session from server, clearing state')
            setState({
              user: null,
              isLoading: false,
              error: null,
              isInitialized: true
            })
            setAdminUser(null)
          }
        } catch (error) {
          console.error('[Auth Context] Session validation error:', error)
        }
      })
      
      const unsubscribeSignOut = tabSyncRef.current.on('SIGN_OUT', () => {
        console.log('[Auth Context] Received sign out from another tab')
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            error: null,
            isInitialized: true
          })
          setAdminUser(null)
        }
      })
    }

    // 서버에서 받은 초기 세션을 처리하는 함수 (빠른 경로)
    const handleInitialSession = async (session: Session): Promise<void> => {
      try {
        console.log('[Auth Context] Processing initial session from server')
        const userId = session.user.id
        const userEmail = session.user.email || null
        const userRole = (session.user.app_metadata?.role as UserRole) || UserRole.USER

        if (!userEmail) {
          throw new Error('User email is required')
        }

        // 타임아웃은 없음 (서버에서 이미 검증된 세션)
        // 프로필과 권한만 빠르게 로드
        const supabase = createClient()

        // Fetch profile
        console.log('[Auth Context] Fetching profile for user:', userId)
        const { data: profile, error: profileError } = await supabase
          .schema('user_management')
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.error('[Auth Context] Profile fetch error:', profileError)
          throw profileError
        }

        if (!profile) {
          console.error('[Auth Context] Profile not found')
          throw new Error('Profile not found')
        }

        // Create AuthUser
        const provider = session.user.app_metadata?.provider
        const authUser: AuthUser = {
          id: userId,
          email: userEmail,
          name: profile.name,
          role: userRole,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          marketing_agreed: profile.marketing_agreed,
          provider: (provider === 'email' || provider === 'kakao') ? provider : 'email',
          email_verified: session.user.email_confirmed_at !== null
        }

        // Fetch admin permissions if admin/manager
        let adminData: AdminUser | null = null
        if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
          console.log('[Auth Context] Fetching admin permissions...')
          const { data: permissions } = await supabase
            .schema('user_management')
            .from('admin_permissions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

          const adminProvider = session.user.app_metadata?.provider
          adminData = {
            id: userId,
            email: userEmail,
            name: profile.name,
            phone: profile.phone,
            role: userRole,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at || profile.created_at,
            provider: (adminProvider === 'email' || adminProvider === 'kakao') ? adminProvider : 'email',
            permissions: permissions || []
          }
        }

        // Update state
        if (mounted) {
          setState({
            user: authUser,
            isLoading: false,
            error: null,
            isInitialized: true
          })
          setAdminUser(adminData)
          console.log('[Auth Context] Initial session processed successfully')
        }
      } catch (error) {
        console.error('[Auth Context] Initial session processing error:', error)
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
            isInitialized: true
          })
          setAdminUser(null)
        }
      }
    }

    const fetchUserWithPermissionsInner = async (
      isInitialLoad: boolean = false,
      shouldBroadcast: boolean = true
    ): Promise<void> => {
      try {
        console.log('[Auth Context] Fetching user with permissions...', { isInitialLoad, shouldBroadcast })

        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('[Auth Context] Request timeout after 2s')
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isInitialized: true,
              error: null // Don't show error on timeout, might be temporary
            }))
          }
        }, 2000)

        // Always use getSession() first for performance, with getUser() as fallback
        let userId: string | null = null
        let userEmail: string | null = null
        let userMetadata: SupabaseUser | null = null

        console.log('[Auth Context] Fetching session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[Auth Context] Session fetch error:', sessionError)
        }

        // If no session, user is not authenticated - no need for getUser() call
        if (!session?.user) {
          console.log('[Auth Context] No session found, user not authenticated')
          if (timeoutId) clearTimeout(timeoutId)
          setState({
            user: null,
            isLoading: false,
            error: null,
            isInitialized: true
          })
          setAdminUser(null)
          return
        }

        // Extract user data from session
        userId = session.user.id
        userEmail = session.user.email || null
        userMetadata = session.user

        if (!userEmail) {
          throw new Error('User email is required')
        }

        console.log('[Auth Context] User authenticated:', { userId, userEmail })

        if (!mounted) return

        // Get role from app_metadata
        const userRole = (userMetadata.app_metadata?.role as UserRole) || UserRole.USER

        // Fetch user profile from user_management schema (with proper typing)
        const { data: profile, error: profileError } = await supabase
          .schema('user_management')
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single<ProfileRow>()

        console.log('[Auth Context] Profile fetch:', { profile, profileError, userRole })

        if (!mounted) return

        // Even if profile fetch fails, keep basic user info from session
        if (profileError) {
          console.warn('[Auth Context] Profile fetch error (using session data):', profileError)
          // Don't return here - continue with session data
        }

        // Create basic auth user (with fallbacks for missing profile)
        const provider = userMetadata.app_metadata?.provider
        const authUser: AuthUser = {
          id: userId,
          email: userEmail,
          name: profile?.name || userMetadata.user_metadata?.name || userEmail.split('@')[0],
          phone: profile?.phone || userMetadata.phone,
          avatar_url: profile?.avatar_url || userMetadata.user_metadata?.avatar_url,
          marketing_agreed: profile?.marketing_agreed || false,
          role: userRole,
          provider: (provider === 'email' || provider === 'kakao') ? provider : 'email',
          email_verified: userMetadata.email_confirmed_at !== null,
          created_at: userMetadata.created_at!
        }

        console.log('[Auth Context] Auth user created:', authUser)

        // Fetch admin permissions if needed
        let permissions: AdminPermission[] = []
        if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
          const { data: perms } = await supabase
            .schema('user_management')
            .from('admin_permissions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

          if (perms) {
            permissions = perms
          }
        }

        // Create admin user if has admin role
        const adminProvider = userMetadata.app_metadata?.provider
        const adminUserData: AdminUser | null = (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) ? {
          id: userId,
          email: profile?.email || userEmail,
          name: profile?.name || userMetadata.user_metadata?.name || null,
          phone: profile?.phone || null,
          role: userRole,
          avatar_url: profile?.avatar_url || null,
          created_at: profile?.created_at || userMetadata.created_at!,
          updated_at: profile?.updated_at || userMetadata.updated_at || userMetadata.created_at!,
          provider: (adminProvider === 'email' || adminProvider === 'kakao') ? adminProvider : 'email',
          permissions
        } : null

        if (timeoutId) clearTimeout(timeoutId)

        if (!mounted) {
          return
        }

        // Update state
        setState({
          user: authUser,
          isLoading: false,
          error: null,
          isInitialized: true
        })
        setAdminUser(adminUserData)

        // Save session to session manager for other tabs
        if (sessionManagerRef.current && session) {
          sessionManagerRef.current.saveSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token || '',
            expires_at: session.expires_at,
            user: session.user
          }, shouldBroadcast)
        }

      } catch (error) {
        console.error('[Auth Context] Auth initialization error:', error)
        if (timeoutId) clearTimeout(timeoutId)
        if (mounted) {
          setState({
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
            isInitialized: true
          })
          setAdminUser(null)
        }
      }
    }

    const initializeAuth = async () => {
      if (mounted) {
        isInitializing = true
        console.log('[Auth Context] Starting initialization...')

        // 서버에서 전달받은 초기 세션이 있으면 즉시 사용
        if (initialSession?.user) {
          console.log('[Auth Context] Using initial session from server (fast path)')
          // 서버 세션을 사용하여 즉시 프로필과 권한 로드
          await handleInitialSession(initialSession)
        } else {
          console.log('[Auth Context] No initial session, fetching from client')
          // 초기 세션이 없으면 클라이언트에서 fetch (기존 로직)
          await fetchUserWithPermissionsInner(true)
        }

        isInitializing = false
        console.log('[Auth Context] Initialization complete')
      }
    }

    initializeAuth()

    // Set up auth state change listener with tab broadcasting
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('[Auth Context] Auth state changed:', event, 'Session:', !!session)

      // Broadcast only critical events to other tabs (SIGNED_IN, SIGNED_OUT)
      // 무한루프 방지: INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED는 브로드캐스트하지 않음
      if (tabSyncRef.current && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        console.log('[Auth Context] Broadcasting auth state change:', event)
        tabSyncRef.current.broadcastAuthStateChange(event, session)
      }

      // Skip INITIAL_SESSION as we already handle it in initializeAuth
      if (event === 'INITIAL_SESSION') {
        console.log('[Auth Context] Skipping INITIAL_SESSION (handled by initializeAuth)')
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // 초기화 중에는 SIGNED_IN 이벤트 무시 (중복 방지)
        if (isInitializing && event === 'SIGNED_IN') {
          console.log('[Auth Context] Skipping SIGNED_IN during initialization (duplicate prevention)')
          return
        }

        if (session?.user && mounted) {
          // Save session to session manager
          if (sessionManagerRef.current && session) {
            sessionManagerRef.current.saveSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token || '',
              expires_at: session.expires_at,
              user: session.user
            })
          }

          console.log('[Auth Context] Processing auth state change:', event)
          await fetchUserWithPermissionsInner(false)
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          // Clear session in session manager
          sessionManagerRef.current?.clearSession()
          
          // Broadcast sign out to other tabs
          tabSyncRef.current?.broadcast('SIGN_OUT', {})
          
          setState({
            user: null,
            isLoading: false,
            error: null,
            isInitialized: true
          })
          setAdminUser(null)
        }
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      
      // Cleanup tab sync resources
      if (typeof window !== 'undefined') {
        // Note: We don't cleanup the singleton instances as they may be used elsewhere
        console.log('[Auth Context] Cleanup completed')
      }
    }
  }, []) // Empty dependency - only run once

  const value = useMemo<AuthContextValue>(() => ({
    user: state.user,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    adminUser,
    signOut,
    refreshUser,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isUser
  }), [state, adminUser, signOut, refreshUser, hasRole, hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isManager, isUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}