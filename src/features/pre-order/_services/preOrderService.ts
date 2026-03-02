import type { PreBookingData, PreBookingResponse } from '../_types'

export async function createPreBooking(data: PreBookingData): Promise<PreBookingResponse> {
  try {
    console.log('🚀 Creating pre-booking:', { ...data, email: '***' })

    const response = await fetch('/api/pre-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    console.log('📡 API Response status:', response.status)
    console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    if (!isJson) {
      console.error('❌ Non-JSON response received')
      const textResponse = await response.text()
      console.error('Response text:', textResponse.substring(0, 500))

      // If it's an HTML error page, extract useful info
      if (textResponse.includes('Internal Server Error') || textResponse.includes('500')) {
        throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }

      throw new Error('서버에서 예상치 못한 응답을 받았습니다.')
    }

    const result = await response.json()
    console.log('📋 API Response data:', {
      ...result,
      booking: result.booking ? { ...result.booking } : undefined,
    })

    if (!response.ok) {
      // Handle specific error cases
      if (result.setup_required || result.error?.includes('데이터베이스가 설정되지 않았습니다')) {
        console.log('Database not set up, using fallback mode')
        return createFallbackBooking(data)
      }

      // 중복 이메일 처리 (409 상태 코드)
      if (response.status === 409 && result.existing) {
        throw new Error(result.error || '이미 해당 이메일로 출시 알림 신청이 완료되었습니다.')
      }

      if (result.error?.includes('이미 등록된') || result.error?.includes('이미 해당 이메일')) {
        throw new Error('이미 해당 이메일로 출시 알림 신청이 완료되었습니다.')
      }

      throw new Error(result.error || '출시 알림 신청 처리에 실패했습니다.')
    }

    return result
  } catch (error) {
    console.error('❌ API call failed:', error)

    // Handle different types of errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        console.log('Network error, using fallback mode')
        return createFallbackBooking(data)
      }
      if (error.message.includes('json')) {
        throw new Error('서버 응답을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('알 수 없는 오류가 발생했습니다.')
  }
}

// Fallback booking creation for when database is not available
function createFallbackBooking(data: PreBookingData): PreBookingResponse {
  console.log('🔄 Using fallback booking creation')

  // Check for duplicate emails in localStorage
  try {
    const existingBookings = JSON.parse(localStorage.getItem('ip_doctor_notifications') || '[]')
    const isDuplicate = existingBookings.some(
      (booking: any) => booking.email.toLowerCase() === data.email.toLowerCase(),
    )

    if (isDuplicate) {
      throw new Error('이미 해당 이메일로 출시 알림 신청이 완료되었습니다.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('이미 해당 이메일')) {
      throw error
    }
    // Continue if localStorage access fails
  }

  const booking = {
    id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    source: data.source,
    email: data.email,
    status: 'active' as const,
    created_at: new Date().toISOString(),
  }

  // Save to localStorage
  try {
    const existingBookings = JSON.parse(localStorage.getItem('ip_doctor_notifications') || '[]')
    existingBookings.push(booking)
    localStorage.setItem('ip_doctor_notifications', JSON.stringify(existingBookings))
    console.log('✅ Notification saved to localStorage')
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }

  return {
    success: true,
    booking: {
      id: booking.id,
      created_at: booking.created_at,
    },
    email_sent: false,
    email_error: '오프라인 모드에서는 이메일 발송이 불가능합니다. 출시 알림을 다시 신청해 주세요.',
    fallback_mode: true,
  }
}

class PreOrderService {
  async createPreBooking(data: PreBookingData): Promise<PreBookingResponse> {
    return createPreBooking(data)
  }
}

export const preOrderService = new PreOrderService()