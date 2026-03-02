import { Metadata } from 'next'
import { ProfilePageContent } from '@/shared/components/profile/ProfilePageContent'

export const metadata: Metadata = {
  title: '프로필 | IP-DR',
  description: '사용자 프로필 관리',
}

export default function ProfilePage() {
  return <ProfilePageContent />
}