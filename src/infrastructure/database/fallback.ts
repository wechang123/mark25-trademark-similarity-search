// Create fallback functions for when Supabase is not available
export interface MockServicePreBooking {
  id: string
  source: "homepage" | "results_page"
  name: string
  email: string
  phone: string | null
  trademark_interest: string | null
  voucher_code: string
  voucher_value: number
  status: "active" | "used" | "expired" | "cancelled"
  created_at: string
}

export function savePreBookingLocally(data: {
  source: "homepage" | "results_page"
  name: string
  email: string
  phone: string
  trademark_interest?: string
}): MockServicePreBooking {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let voucherCode = "FREE4-"
  for (let i = 0; i < 4; i++) {
    voucherCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const booking: MockServicePreBooking = {
    id: `local_${Date.now()}`,
    source: data.source,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    trademark_interest: data.trademark_interest || null,
    voucher_code: voucherCode,
    voucher_value: 40000,
    status: "active",
    created_at: new Date().toISOString(),
  }

  try {
    const existingBookings = JSON.parse(localStorage.getItem("ip_doctor_bookings") || "[]")
    existingBookings.push(booking)
    localStorage.setItem("ip_doctor_bookings", JSON.stringify(existingBookings))
  } catch (error) {
    console.warn("Local storage save failed:", error)
  }

  return booking
}

export function checkEmailDuplicate(email: string): boolean {
  try {
    const existingBookings = JSON.parse(localStorage.getItem("ip_doctor_bookings") || "[]")
    return existingBookings.some(
      (booking: MockServicePreBooking) => booking.email.toLowerCase() === email.toLowerCase(),
    )
  } catch (error) {
    console.warn("Local storage check failed:", error)
    return false
  }
}
