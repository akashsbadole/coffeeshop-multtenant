'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Store, 
  Settings as SettingsIcon, 
  Building2, 
  FileText, 
  CreditCard, 
  ToggleLeft,
  Upload,
  X,
  Save,
  Loader2
} from 'lucide-react'

// TypeScript interfaces for settings data
interface StoreSettings {
  id: string
  storeName: string
  address: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  gstin: string | null
  state: string | null
  stateCode: string | null
  defaultGstRate: string
  gstInclusivePricing: boolean
  invoicePrefix: string
  startingInvoice: number
  currency: string
  footerText: string | null
  termsConditions: string | null
  bankName: string | null
  accountNumber: string | null
  ifscCode: string | null
  enableTableManagement: boolean
  enableKDS: boolean
  enableBarcodes: boolean
  enableGiftCards: boolean
  enableMultiStore: boolean
  enableLoyaltyProgram: boolean
  showImages: boolean
  autoLogout: boolean
  enableStaffManagement: boolean
}

const GST_RATE_OPTIONS = [
  { value: 'ZERO', label: '0%' },
  { value: 'FIVE', label: '5%' },
  { value: 'TWELVE', label: '12%' },
  { value: 'EIGHTEEN', label: '18%' },
  { value: 'TWENTY_EIGHT', label: '28%' }
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' }
]

const FEATURE_FLAGS = [
  { key: 'enableTableManagement', label: 'Table Management' },
  { key: 'enableKDS', label: 'Kitchen Display System (KDS)' },
  { key: 'enableBarcodes', label: 'Barcodes' },
  { key: 'enableGiftCards', label: 'Gift Cards' },
  { key: 'enableMultiStore', label: 'Multi-Store' },
  { key: 'enableLoyaltyProgram', label: 'Loyalty Program' },
  { key: 'showImages', label: 'Show Images' },
  { key: 'autoLogout', label: 'Auto Logout' },
  { key: 'enableStaffManagement', label: 'Staff Management' }
]

export function Settings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<StoreSettings>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/pos/store-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData(data)
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl)
        }
      } else {
        toast.error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/pos/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        toast.success('Settings saved successfully')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server (simplified - in production, upload to cloud storage)
    const formData = new FormData()
    formData.append('logo', file)

    try {
      // For now, we'll store the base64 data URL
      // In production, you'd upload to S3/Cloudinary and get a URL back
      const base64 = await fileToBase64(file)
      setFormData({ ...formData, logoUrl: base64 })
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Failed to upload logo')
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logoUrl: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const updateFormData = (key: keyof StoreSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-500 mt-1">Manage your store configuration</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg p-1 rounded-xl border border-amber-200">
          <TabsTrigger 
            value="business"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <Store className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger 
            value="gst"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <Building2 className="h-4 w-4 mr-2" />
            GST/VAT
          </TabsTrigger>
          <TabsTrigger 
            value="invoice"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Invoice
          </TabsTrigger>
          <TabsTrigger 
            value="bank"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Bank Details
          </TabsTrigger>
          <TabsTrigger 
            value="features"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <ToggleLeft className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* Section 1: Business Information */}
        <TabsContent value="business">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6" />
                Business Information
              </CardTitle>
              <CardDescription className="text-amber-100">
                Basic details about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Store Logo</Label>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Store Logo"
                          className="w-32 h-32 object-contain rounded-lg border-2 border-amber-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-amber-300 flex items-center justify-center bg-amber-50">
                        <Store className="h-12 w-12 text-amber-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-amber-200 hover:bg-amber-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended: PNG or JPG, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-sm font-semibold">Store Name *</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName || ''}
                    onChange={(e) => updateFormData('storeName', e.target.value)}
                    placeholder="e.g., Universal POS"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="e.g., +91 98765 43210"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="e.g., contact@store.com"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="Enter your store address..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 2: GST/VAT Settings */}
        <TabsContent value="gst">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                GST/VAT Settings
              </CardTitle>
              <CardDescription className="text-amber-100">
                Configure tax settings for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gstin" className="text-sm font-semibold">GSTIN Number</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin || ''}
                    onChange={(e) => updateFormData('gstin', e.target.value)}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="h-11 uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-semibold">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ''}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    placeholder="e.g., Maharashtra"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stateCode" className="text-sm font-semibold">State Code</Label>
                  <Input
                    id="stateCode"
                    value={formData.stateCode || ''}
                    onChange={(e) => updateFormData('stateCode', e.target.value)}
                    placeholder="e.g., 27"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultGstRate" className="text-sm font-semibold">Default GST Rate</Label>
                  <select
                    id="defaultGstRate"
                    value={formData.defaultGstRate || 'EIGHTEEN'}
                    onChange={(e) => updateFormData('defaultGstRate', e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {GST_RATE_OPTIONS.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Switch
                  id="gstInclusive"
                  checked={formData.gstInclusivePricing || false}
                  onCheckedChange={(checked) => updateFormData('gstInclusivePricing', checked)}
                />
                <Label htmlFor="gstInclusive" className="text-sm font-medium cursor-pointer">
                  GST Inclusive Pricing
                </Label>
                <span className="text-sm text-gray-500 ml-auto">
                  {formData.gstInclusivePricing ? 'Prices shown include GST' : 'GST will be added to prices'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 3: Invoice Settings */}
        <TabsContent value="invoice">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Invoice Settings
              </CardTitle>
              <CardDescription className="text-amber-100">
                Configure invoice and receipt settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix" className="text-sm font-semibold">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={formData.invoicePrefix || ''}
                    onChange={(e) => updateFormData('invoicePrefix', e.target.value)}
                    placeholder="e.g., INV"
                    className="h-11 uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startingInvoice" className="text-sm font-semibold">Starting Invoice Number</Label>
                  <Input
                    id="startingInvoice"
                    type="number"
                    min="1"
                    value={formData.startingInvoice || 1}
                    onChange={(e) => updateFormData('startingInvoice', parseInt(e.target.value) || 1)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-semibold">Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency || 'INR'}
                    onChange={(e) => updateFormData('currency', e.target.value)}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText" className="text-sm font-semibold">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={formData.footerText || ''}
                  onChange={(e) => updateFormData('footerText', e.target.value)}
                  placeholder="e.g., Thank you for visiting! Visit again."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsConditions" className="text-sm font-semibold">Terms & Conditions</Label>
                <Textarea
                  id="termsConditions"
                  value={formData.termsConditions || ''}
                  onChange={(e) => updateFormData('termsConditions', e.target.value)}
                  placeholder="Enter terms and conditions..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 4: Bank Details */}
        <TabsContent value="bank">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Bank Details
              </CardTitle>
              <CardDescription className="text-amber-100">
                Store bank account information for payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-sm font-semibold">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName || ''}
                  onChange={(e) => updateFormData('bankName', e.target.value)}
                  placeholder="e.g., State Bank of India"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-sm font-semibold">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber || ''}
                    onChange={(e) => updateFormData('accountNumber', e.target.value)}
                    placeholder="e.g., 1234567890"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode" className="text-sm font-semibold">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode || ''}
                    onChange={(e) => updateFormData('ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g., SBIN0001234"
                    className="h-11 uppercase"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 5: Feature Flags */}
        <TabsContent value="features">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-6 w-6" />
                Feature Flags
              </CardTitle>
              <CardDescription className="text-amber-100">
                Enable or disable features for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FEATURE_FLAGS.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <Label htmlFor={feature.key} className="text-sm font-medium cursor-pointer">
                      {feature.label}
                    </Label>
                    <Switch
                      id={feature.key}
                      checked={formData[feature.key as keyof StoreSettings] as boolean || false}
                      onCheckedChange={(checked) => updateFormData(feature.key as keyof StoreSettings, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
