import { createClient } from '@/infrastructure/database/client'
import { AuthUser } from '../_types/auth'

export interface ProfileUpdateData {
  phone?: string | null
  marketing_agreed?: boolean
}

export class ProfileService {
  private supabase = createClient()

  async updateProfile(userId: string, data: ProfileUpdateData): Promise<AuthUser> {
    const { data: updatedProfile, error } = await this.supabase
      .schema('user_management')
      .from('profiles')
      .update({
        phone: data.phone,
        marketing_agreed: data.marketing_agreed,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      throw new Error('프로필 업데이트 중 오류가 발생했습니다.')
    }

    // Get current user's role from auth
    const { data: { user } } = await this.supabase.auth.getUser()
    const userRole = user?.app_metadata?.role || 'user'

    // Convert profile to AuthUser format
    return {
      id: updatedProfile.id,
      email: updatedProfile.email,
      name: updatedProfile.name,
      phone: updatedProfile.phone,
      avatar_url: updatedProfile.avatar_url,
      marketing_agreed: updatedProfile.marketing_agreed,
      role: userRole,
      provider: updatedProfile.provider || 'email',
      email_verified: true, // Assume verified if profile exists
      created_at: updatedProfile.created_at
    }
  }
}

export const profileService = new ProfileService()