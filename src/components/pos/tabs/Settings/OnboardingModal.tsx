'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Store, 
  Building2, 
  FileText, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Hash
} from 'lucide-react'

// TypeScript interfaces for settings data
interface StoreSettings {
  storeName: string
  phone: string
  email: string
  address: string
  currency: string
  defaultGstRate: string
  gstInclusivePricing: boolean
  gstin: string
  state: string
  stateCode: string
  invoicePrefix: string
  startingInvoice: number
}

const GST_RATE_OPTIONS = [
  { value: 'ZERO', label: '0%' },
  { value: 'FIVE', label: '5%' },
  { value: 'TWELVE', label: '12%' },
  { value: 'EIGHTEEN', label: '18%' },
  { value: 'TWENTY_EIGHT', label: '28%' }
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' }
]

const STEPS = [
  { id: 'business', title: 'Business Info', icon: Store, description: 'Basic store details' },
  { id: 'currency', title: 'Currency & Tax', icon: CreditCard, description: 'GST and pricing' },
  { id: 'gst', title: 'GST Details', icon: Building2, description: 'Tax registration' },
  { id: 'invoice', title: 'Invoice Settings', icon: FileText, description: 'Receipt configuration' }
]

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export default function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [formData, setFormData] = useState<Partial<StoreSettings>>({
    storeName: '',
    phone: '',
    email: '',
    address: '',
    currency: 'INR',
    defaultGstRate: 'EIGHTEEN',
    gstInclusivePricing: false,
    gstin: '',
    state: '',
    stateCode: '',
    invoicePrefix: 'INV',
    startingInvoice: 1
  })

  useEffect(() => {
    if (open) {
      checkSettings()
    }
  }, [open])

  const checkSettings = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/pos/store-settings')
      if (response.ok) {
        const data = await response.json()
        // If settings exist with a store name, don't show onboarding
        if (data.data?.storeName && data.data.storeName !== 'Universal POS') {
          onOpenChange(false)
          onComplete()
          return
        }
      }
    } catch (error) {
      console.error('Error checking settings:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const updateFormData = (key: keyof StoreSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/pos/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Store settings saved successfully!')
        onOpenChange(false)
        onComplete()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100
  const currentStepInfo = STEPS[currentStep]

  if (isChecking) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg border-0 shadow-2xl">
          <VisuallyHidden>
            <DialogTitle>Loading</DialogTitle>
          </VisuallyHidden>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
            <p className="text-gray-500">Checking store settings...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="bg-linear-to-br from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Welcome to Coffee Shop POS</DialogTitle>
              <DialogDescription className="text-amber-100">
                Let's set up your store in just a few steps
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}: {currentStepInfo.title}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-amber-100" />
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-white'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-medium text-amber-600' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Business Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <Store className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>Tell us about your store</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-sm font-semibold">Store Name *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                      <Input
                        id="storeName"
                        value={formData.storeName || ''}
                        onChange={(e) => updateFormData('storeName', e.target.value)}
                        placeholder="e.g., Coffee Paradise"
                        className="h-11 pl-10 placeholder:text-white text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className="h-11 pl-10 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          placeholder="contact@store.com"
                          className="h-11 pl-10 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-white" />
                      <Input
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        placeholder="Enter your store address"
                        className="h-11 pl-10 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Currency & Tax */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <CreditCard className="h-5 w-5" />
                    Currency & Tax Settings
                  </CardTitle>
                  <CardDescription>Configure your pricing and tax settings</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-sm font-semibold">Currency</Label>
                      <select
                        id="currency"
                        value={formData.currency || 'INR'}
                        onChange={(e) => updateFormData('currency', e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-text"
                      >
                        {CURRENCY_OPTIONS.map((currency) => (
                          <option key={currency.value} value={currency.value} className='white-text'>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultGstRate" className="text-sm font-semibold">Default GST Rate</Label>
                      <select
                        id="defaultGstRate"
                        value={formData.defaultGstRate || 'EIGHTEEN'}
                        onChange={(e) => updateFormData('defaultGstRate', e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-white"
                      >
                        {GST_RATE_OPTIONS.map((rate) => (
                          <option key={rate.value} value={rate.value}>
                            {rate.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <Label htmlFor="gstInclusive" className="text-sm font-medium cursor-pointer text-black">
                        GST Inclusive Pricing
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.gstInclusivePricing 
                          ? 'Prices shown include GST' 
                          : 'GST will be added to prices'}
                      </p>
                    </div>
                    <Switch
                      id="gstInclusive"
                      checked={formData.gstInclusivePricing || false}
                      onCheckedChange={(checked) => updateFormData('gstInclusivePricing', checked)}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> You can change these settings later from the Settings page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: GST Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <Building2 className="h-5 w-5" />
                    GST Registration Details
                  </CardTitle>
                  <CardDescription>Your GSTIN information (optional)</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="text-sm font-semibold ">GSTIN Number</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin || ''}
                      onChange={(e) => updateFormData('gstin', e.target.value.toUpperCase())}
                      placeholder="e.g., 22AAAAA0000A1Z5"
                      className="h-11 uppercase tracking-wider text-white"
                    />
                    <p className="text-xs text-gray-500">
                      Goods and Services Tax Identification Number
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-semibold">State</Label>
                      <Input
                        id="state"
                        value={formData.state || ''}
                        onChange={(e) => updateFormData('state', e.target.value)}
                        placeholder="e.g., Maharashtra"
                        className="h-11 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stateCode" className="text-sm font-semibold">State Code</Label>
                      <Input
                        id="stateCode"
                        value={formData.stateCode || ''}
                        onChange={(e) => updateFormData('stateCode', e.target.value)}
                        placeholder="e.g., 27"
                        className="h-11 text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ℹ️ <strong>Optional:</strong> You can skip this step and add GST details later from Settings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Invoice Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <FileText className="h-5 w-5" />
                    Invoice Settings
                  </CardTitle>
                  <CardDescription>Configure your invoice and receipt format</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix" className="text-sm font-semibold">Invoice Prefix</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
                        <Input
                          id="invoicePrefix"
                          value={formData.invoicePrefix || ''}
                          onChange={(e) => updateFormData('invoicePrefix', e.target.value.toUpperCase())}
                          placeholder="e.g., INV"
                          className="h-11 pl-10 uppercase text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Prefix for invoice numbers (e.g., INV-001)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startingInvoice" className="text-sm font-semibold">Starting Number</Label>
                      <Input
                        id="startingInvoice"
                        type="number"
                        min="1"
                        value={formData.startingInvoice || 1}
                        onChange={(e) => updateFormData('startingInvoice', parseInt(e.target.value) || 1)}
                        className="h-11 text-white"
                      />
                      <p className="text-xs text-gray-500">
                        First invoice will be: {formData.invoicePrefix || 'INV'}-{formData.startingInvoice || 1}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      ✅ <strong>You're all set!</strong> After completing this setup, you'll be ready to start taking orders.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            className="border-amber-200 hover:bg-amber-50 text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-linear-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.storeName}
              className="bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
