# SMS Login Setup Guide

The POS system now supports SMS-based login using Twilio for One-Time Password (OTP) authentication.

## Features

- **Dual Login Options**: Users can log in with either email/password or SMS OTP
- **Secure OTP**: 6-digit OTP with 5-minute expiry
- **In-Memory Storage**: OTPs stored in memory (for production, consider Redis)
- **Attempt Limiting**: Maximum 3 failed OTP attempts
- **Auto-Cleanup**: Expired OTPs automatically removed
- **Development Mode**: OTPs returned in response when Twilio is not configured

## Setup Instructions

### 1. Configure Twilio

Add your Twilio credentials to the `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+919876543210
OTP_EXPIRY_MINUTES=5
```

Get your Twilio credentials from:
- Account SID: https://console.twilio.com/us1/develop/api-keys/credentials
- Auth Token: https://console.twilio.com/us1/develop/api-keys/credentials
- Phone Number: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

### 2. Install Dependencies

Twilio is already installed (`twilio@5.12.0`).

### 3. Register Users with Phone Numbers

Users must be registered with phone numbers to use SMS login:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "password": "password123",
    "role": "CASHIER"
  }'
```

## API Endpoints

### Send OTP
**POST** `/api/auth/sms/send`

Request:
```json
{
  "phone": "9876543210"
}
```

Response (Success):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2024-01-01T12:05:00.000Z"
}
```

Response (Development Mode - Twilio not configured):
```json
{
  "error": "Failed to send OTP",
  "development": "123456"
}
```

### Verify OTP
**POST** `/api/auth/sms/verify`

Request:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

Response (Success):
```json
{
  "success": true,
  "user": {
    "id": "cml2hf1j5000ep57ndhzgsi1z",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CASHIER",
    "phone": "9876543210"
  },
  "message": "Login successful"
}
```

Response (Error):
```json
{
  "error": "Invalid or expired OTP"
}
```

## Testing

### Development Mode (No Twilio)
1. Register a user with a phone number
2. Go to the login page
3. Click "SMS OTP" tab
4. Enter phone number (e.g., 9876543210)
5. Click "Send OTP"
6. OTP will appear in a toast notification
7. Enter the OTP and verify

### Production Mode (With Twilio)
1. Configure Twilio credentials in `.env`
2. Register users with phone numbers
3. Users will receive real SMS with OTP codes
4. Enter OTP to authenticate

## Phone Number Formatting

The system supports various phone number formats:
- `9876543210` → `+919876543210` (India)
- `+919876543210` → `+919876543210` (already formatted)
- `1234567890` → `+1234567890` (default)

## Security Features

- **5-Minute Expiry**: OTPs expire after 5 minutes (configurable)
- **3 Attempts**: Maximum 3 attempts before OTP is invalidated
- **One-Time Use**: OTPs are deleted after successful verification
- **Auto-Cleanup**: Expired OTPs removed every minute

## Test Account

A test user with phone number `9876543210` is already registered for testing:
- Phone: 9876543210
- Name: Test User
- Email: test@example.com
- Role: CASHIER

## File Structure

```
src/
├── lib/
│   ├── otp-store.ts      # In-memory OTP storage
│   └── sms.ts           # Twilio integration
└── app/api/auth/sms/
    ├── send/
    │   └── route.ts      # Send OTP endpoint
    └── verify/
        └── route.ts      # Verify OTP endpoint
```

## Production Considerations

1. **Use Redis**: Replace in-memory OTP store with Redis for distributed systems
2. **Rate Limiting**: Add rate limiting to prevent SMS abuse
3. **Phone Verification**: Verify phone numbers during registration
4. **Session Management**: Consider JWT tokens for session management
5. **OTP Length**: Consider 8-digit OTPs for higher security
6. **SMS Costs**: Monitor Twilio usage and costs

## Troubleshooting

### OTP Not Sent
- Check Twilio credentials in `.env`
- Verify Twilio account has sufficient credits
- Check phone number format
- Review Twilio console for error messages

### OTP Expired
- Ensure `OTP_EXPIRY_MINUTES` is set appropriately
- Check system time is synchronized
- Verify user is entering OTP within expiry time

### Invalid OTP
- Verify OTP is entered correctly (case-sensitive)
- Check if OTP was already used
- Ensure maximum attempts (3) not exceeded

## Next Steps

To enhance SMS login:
1. Add phone number verification during registration
2. Implement rate limiting for OTP requests
3. Add session management with JWT
4. Enable two-factor authentication (2FA) for admin accounts
5. Add SMS notification for order updates
