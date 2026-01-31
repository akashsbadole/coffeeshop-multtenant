import twilio from 'twilio'

/**
 * SMS service using Twilio
 */

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Format phone number to E.164 format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // If already in E.164 format (starts with +), return as is
  if (phone.startsWith('+')) {
    return phone
  }

  // Assume India if no country code (11 digits including 0 prefix)
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }

  // If already has country code (without +)
  if (cleaned.length === 12) {
    return `+${cleaned}`
  }

  // Default to adding +
  return `+${cleaned}`
}

/**
 * Send OTP via SMS using Twilio
 */
export async function sendOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not configured')
      return {
        success: false,
        error: 'SMS service not configured'
      }
    }

    const client = twilio(accountSid, authToken)

    const formattedPhone = formatPhoneNumber(phone)

    const message = await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    })

    console.log('SMS sent successfully:', message.sid)

    return { success: true }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    }
  }
}

/**
 * Send generic SMS message
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return {
        success: false,
        error: 'SMS service not configured'
      }
    }

    const client = twilio(accountSid, authToken)

    const formattedPhone = formatPhoneNumber(phone)

    const twilioMessage = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    })

    console.log('SMS sent successfully:', twilioMessage.sid)

    return { success: true }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    }
  }
}
