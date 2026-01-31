/**
 * In-memory OTP store for SMS login
 * In production, use Redis or database for persistence
 */

interface OTPRecord {
  phone: string
  code: string
  expiresAt: Date
  attempts: number
}

class OTPStore {
  private store: Map<string, OTPRecord> = new Map()

  /**
   * Store an OTP for a phone number
   */
  set(phone: string, code: string, expiryMinutes: number = 5): void {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)
    this.store.set(phone, {
      phone,
      code,
      expiresAt,
      attempts: 0
    })
  }

  /**
   * Get OTP record for a phone number
   */
  get(phone: string): OTPRecord | undefined {
    return this.store.get(phone)
  }

  /**
   * Verify OTP for a phone number
   * Returns true if valid, false otherwise
   */
  verify(phone: string, code: string): boolean {
    const record = this.store.get(phone)

    if (!record) {
      return false
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      this.delete(phone)
      return false
    }

    // Check if too many attempts
    if (record.attempts >= 3) {
      this.delete(phone)
      return false
    }

    // Increment attempts
    record.attempts++

    // Verify code
    if (record.code === code) {
      this.delete(phone)
      return true
    }

    return false
  }

  /**
   * Delete OTP record for a phone number
   */
  delete(phone: string): void {
    this.store.delete(phone)
  }

  /**
   * Clean up expired OTPs
   */
  cleanup(): void {
    const now = new Date()
    for (const [phone, record] of this.store.entries()) {
      if (record.expiresAt < now) {
        this.store.delete(phone)
      }
    }
  }

  /**
   * Get all OTP records (for debugging)
   */
  getAll(): OTPRecord[] {
    return Array.from(this.store.values())
  }
}

// Export singleton instance
export const otpStore = new OTPStore()

// Cleanup expired OTPs every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    otpStore.cleanup()
  }, 60 * 1000)
}
