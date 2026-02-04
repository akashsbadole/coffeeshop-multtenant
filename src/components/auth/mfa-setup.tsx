'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Lock, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

interface MFASetupProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export function MFASetup({ userId, onSuccess, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'choice' | 'setup' | 'verify'>('choice')
  const [method, setMethod] = useState<'sms' | 'email' | 'app' | 'none'>('none')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [generatedSecret, setGeneratedSecret] = useState('')

  const handleSendCode = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/mfa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          method,
          destination: method === 'sms' ? phone : email
        })
      })

      if (response.ok) {
        toast.success(`${method.toUpperCase()} code sent`)
        setStep('verify')
        startCountdown(60)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send code')
      }
    } catch (error) {
      toast.error('Failed to send code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code,
          method
        })
      })

      if (response.ok) {
        toast.success('MFA setup successful')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Invalid code')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const startCountdown = (seconds: number) => {
    setCountdown(seconds)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const generateAppSecret = () => {
    const secret = Array.from({ length: 32 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.charAt(Math.floor(Math.random() * 32))
    ).join('').match(/.{1,4}/g)?.join(' ') || ''
    setGeneratedSecret(secret)
    setStep('setup')
  }

  if (step === 'choice') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enable Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Choose how you'd like to receive your verification codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setMethod('sms')}
          >
            <Smartphone className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">SMS Code</div>
              <div className="text-xs text-gray-500">Receive codes via text message</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setMethod('email')}
          >
            <Mail className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Email Code</div>
              <div className="text-xs text-gray-500">Receive codes via email</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setMethod('app')}
          >
            <Lock className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Authenticator App</div>
              <div className="text-xs text-gray-500">Use Google Authenticator or similar app</div>
            </div>
          </Button>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (method === 'app') {
                  generateAppSecret()
                } else {
                  setStep('setup')
                }
              }}
              disabled={method === 'none'}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'setup' && method !== 'app') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup {method === 'sms' ? 'SMS' : 'Email'} Verification</CardTitle>
          <CardDescription>
            Enter your {method === 'sms' ? 'phone number' : 'email address'} to receive verification codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
              {method === 'sms' ? 'Phone Number' : 'Email Address'}
            </Label>
            <Input
              type={method === 'sms' ? 'tel' : 'email'}
              value={method === 'sms' ? phone : email}
              onChange={(e) => method === 'sms' ? setPhone(e.target.value) : setEmail(e.target.value)}
              placeholder={method === 'sms' ? '+91 98765 43210' : 'user@example.com'}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep('choice')} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSendCode}
              disabled={isLoading || (method === 'sms' ? !phone : !email)}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Code'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'setup' && method === 'app') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Authenticator App</CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app or enter the secret key manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg text-center">
            <div className="text-4xl font-mono tracking-widest mb-4">
              {generatedSecret}
            </div>
            <p className="text-xs text-gray-500">
              Enter this code in Google Authenticator, Authy, or similar app
            </p>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
            Once you've added the account, click Continue to verify
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep('choice')} className="flex-1">
              Back
            </Button>
            <Button onClick={() => {
              setStep('verify')
              setCode('')
            }} className="flex-1">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Code</CardTitle>
          <CardDescription>
            Enter the verification code sent to {method === 'sms' ? phone : method === 'app' ? 'your app' : email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Verification Code</Label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              autoFocus
            />
          </div>

          {countdown > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" color="#fff" />
              <span>Code expires in {countdown} seconds</span>
            </div>
          )}

          {countdown === 0 && method !== 'app' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendCode}
              className="text-sm"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Resend Code
            </Button>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep('choice')} className="flex-1">
              Change Method
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

export function MFAVerify({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [countdown, setCountdown] = useState(30)

  const handleVerify = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code,
          method: 'verify'
        })
      })

      if (response.ok) {
        toast.success('Verification successful')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Invalid code')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/mfa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, method: 'resend' })
      })

      if (response.ok) {
        toast.success('New code sent')
        setCountdown(30)
        setShowResend(false)
        startCountdown()
      }
    } catch (error) {
      toast.error('Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalId)
          setShowResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Verification Code</Label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
        </div>

        {countdown > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" color="#fff" />
            <span>Resend available in {countdown} seconds</span>
          </div>
        )}

        <div className="space-y-2 pt-4">
          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
            className="w-full"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>

          {showResend && (
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Code
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}