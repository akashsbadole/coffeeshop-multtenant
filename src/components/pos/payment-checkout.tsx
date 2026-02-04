'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  IndianRupee
} from 'lucide-react'

interface PaymentProvider {
  id: string
  name: string
  mode: 'test' | 'live'
}

interface PaymentCheckoutProps {
  orderId: string
  amount: number
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
  onClose: () => void
}

export function PaymentCheckout({ orderId, amount, onSuccess, onError, onClose }: PaymentCheckoutProps) {
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [showManualVerify, setShowManualVerify] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch(`/api/payments?action=providers`)
      const data = await response.json()
      if (data.providers) {
        setProviders(data.providers)
        if (data.providers.length > 0) {
          setSelectedProvider(data.providers[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      toast.error('Failed to load payment methods')
    }
  }

  const handleInitiatePayment = async () => {
    if (!selectedProvider) {
      toast.error('Please select a payment method')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          orderId,
          method: selectedProvider,
          customerEmail,
          customerPhone
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      setPaymentId(data.paymentId)
      setPaymentData(data.paymentData)
      setShowManualVerify(true)

      if (selectedProvider === 'razorpay' && data.paymentData.key) {
        initiateRazorpay(data.paymentData)
      } else {
        toast.success('Payment initiated. Complete payment and click Verify.')
      }
    } catch (error: any) {
      toast.error(error.message)
      onError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const initiateRazorpay = (data: any) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const options = {
        key: data.key,
        amount: data.amount * 100,
        currency: data.currency,
        name: data.name,
        description: data.description,
        order_id: data.razorpayOrderId,
        prefill: data.prefill,
        handler: (response: any) => {
          handlePaymentSuccess(response.razorpay_payment_id)
        },
        modal: {
          ondismiss: () => {
            setShowManualVerify(true)
          }
        }
      }

      // @ts-ignore
      const rzp = new window.Razorpay(options)
      rzp.open()
    }
    script.onerror = () => {
      toast.error('Failed to load Razorpay. Please complete payment manually.')
      setShowManualVerify(true)
    }
    document.body.appendChild(script)
  }

  const handlePaymentSuccess = async (transactionId: string) => {
    setIsVerifying(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          paymentId,
          transactionId,
          orderId: paymentData?.razorpayOrderId
        })
      })

      const data = await response.json()

      if (data.verified) {
        toast.success('Payment successful!')
        onSuccess(paymentId || '')
      } else {
        toast.warning('Payment verification pending. Please verify manually.')
      }
    } catch (error) {
      toast.error('Verification failed. Please verify manually.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleManualVerify = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          paymentId
        })
      })

      const data = await response.json()

      if (data.verified) {
        toast.success('Payment verified successfully!')
        onSuccess(paymentId || '')
      } else {
        toast.error(data.message || 'Payment verification failed')
        onError(data.message || 'Verification failed')
      }
    } catch (error: any) {
      toast.error('Verification failed')
      onError(error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCashPayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          orderId,
          method: 'cash'
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify',
            paymentId: data.paymentId
          })
        })
        toast.success('Cash payment recorded!')
        onSuccess(data.paymentId)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'razorpay':
      case 'stripe':
        return <CreditCard className="h-5 w-5" />
      case 'paytm':
        return <Smartphone className="h-5 w-5" />
      case 'cashfree':
        return <Wallet className="h-5 w-5" />
      default:
        return <Building2 className="h-5 w-5" />
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Payment - ₹{amount.toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        {!paymentId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Email (Optional)</Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Phone (Optional)</Label>
              <Input
                placeholder="9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Select Payment Method</Label>
              <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
                <div className="space-y-2">
                  <div
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${selectedProvider === 'cash' ? 'border-green-500 bg-green-50' : ''}`}
                    onClick={() => setSelectedProvider('cash')}
                  >
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                      <div className="bg-green-100 p-1.5 rounded">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Cash</span>
                    </Label>
                  </div>

                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${selectedProvider === provider.id ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <RadioGroupItem value={provider.id} id={provider.id} />
                      <Label htmlFor={provider.id} className="flex items-center gap-2 cursor-pointer flex-1">
                        <div className="bg-blue-100 p-1.5 rounded">
                          {getProviderIcon(provider.id)}
                        </div>
                        <span>{provider.name}</span>
                        <Badge variant={provider.mode === 'test' ? 'secondary' : 'default'} className="text-xs">
                          {provider.mode}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <Button
              className="w-full"
              onClick={selectedProvider === 'cash' ? handleCashPayment : handleInitiatePayment}
              disabled={isLoading || (!selectedProvider && !providers.length)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Pay ₹{amount.toFixed(2)}
                </>
              )}
            </Button>

            {providers.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-4 w-4" color="#fff" />
                  <span className="text-sm">No payment methods configured</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Add payment API keys in Settings &gt; Payment Keys to accept online payments.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Payment Initiated</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {selectedProvider === 'razorpay'
                  ? 'Complete payment in Razorpay popup'
                  : 'Please complete your payment and verify'}
              </p>
            </div>

            {paymentData && (
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Amount:</span> ₹{paymentData.amount}</p>
                <p><span className="font-medium">Provider:</span> {paymentData.provider}</p>
                <p><span className="font-medium">Mode:</span> {paymentData.testMode ? 'Test' : 'Live'}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleManualVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Payment
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPaymentId(null)
                setPaymentData(null)
                setShowManualVerify(false)
              }}
            >
              Cancel / Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
