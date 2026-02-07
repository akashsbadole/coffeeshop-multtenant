'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Users, 
  Store, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface SystemSettings {
  id: string
  subscriptionEnabled: boolean
  trialDays: number
  freePlanEnabled: boolean
  paymentGateway: string
  invoicePrefix: string
}

interface SubscriptionStats {
  active: number
  trial: number
  expired: number
  cancelled: number
  pending: number
}

interface TenantSubscription {
  id: string
  status: string
  startDate: string
  endDate: string | null
  autoRenew: boolean
  plan: {
    id: string
    name: string
    type: string
    price: number
  }
}

export default function SubscriptionSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [recentSubscriptions, setRecentSubscriptions] = useState<TenantSubscription[]>([])

  const [formData, setFormData] = useState({
    subscriptionEnabled: true,
    trialDays: 14,
    freePlanEnabled: true,
    paymentGateway: 'razorpay',
    invoicePrefix: 'INV-SUB',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/subscriptions/stats'),
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
        setFormData({
          subscriptionEnabled: data.settings.subscriptionEnabled ?? true,
          trialDays: data.settings.trialDays ?? 14,
          freePlanEnabled: data.settings.freePlanEnabled ?? true,
          paymentGateway: data.settings.paymentGateway ?? 'razorpay',
          invoicePrefix: data.settings.invoicePrefix ?? 'INV-SUB',
        })
      }

      // Note: /api/subscriptions/stats doesn't exist yet, but we'll handle this
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Subscription Settings</h2>
          <p className="text-gray-500 mt-1">Manage subscription system and billing</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-card hover:from-amber-600 hover:to-orange-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg p-1 rounded-xl border border-amber-200">
          <TabsTrigger 
            value="general"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger 
            value="stats"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger 
            value="limits"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Defaults
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-card text-white">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Subscription System Settings
              </CardTitle>
              <CardDescription className="text-amber-100">
                Configure the subscription billing system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Enable Subscriptions */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer">
                      Enable Subscriptions
                    </Label>
                    <p className="text-sm text-gray-500">
                      Allow new users to subscribe to paid plans
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.subscriptionEnabled}
                  onCheckedChange={(checked) => handleToggle('subscriptionEnabled', checked)}
                />
              </div>

              {/* Enable Free Plan */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer">
                      Enable Free Plan
                    </Label>
                    <p className="text-sm text-gray-500">
                      Allow users to start with a free plan
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.freePlanEnabled}
                  onCheckedChange={(checked) => handleToggle('freePlanEnabled', checked)}
                />
              </div>

              {/* Trial Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trialDays" className="text-sm font-semibold">
                    Default Trial Period (Days)
                  </Label>
                  <Input
                    id="trialDays"
                    name="trialDays"
                    type="number"
                    min="0"
                    max="90"
                    value={formData.trialDays}
                    onChange={handleInputChange}
                    className="h-11"
                  />
                  <p className="text-sm text-gray-500">
                    Trial period for new organizations (0 to disable)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentGateway" className="text-sm font-semibold">
                    Payment Gateway
                  </Label>
                  <select
                    id="paymentGateway"
                    name="paymentGateway"
                    value={formData.paymentGateway}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentGateway: e.target.value }))}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="stripe">Stripe</option>
                    <option value="paytm">Paytm</option>
                    <option value="cashfree">Cashfree</option>
                    <option value="manual">Manual/Offline</option>
                  </select>
                  <p className="text-sm text-gray-500">
                    Primary payment gateway for subscriptions
                  </p>
                </div>
              </div>

              {/* Invoice Prefix */}
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix" className="text-sm font-semibold">
                  Subscription Invoice Prefix
                </Label>
                <Input
                  id="invoicePrefix"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleInputChange}
                  placeholder="e.g., INV-SUB"
                  className="h-11 max-w-md"
                />
                <p className="text-sm text-gray-500">
                  Prefix for subscription invoice numbers
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.active || '—'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Trial</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {stats?.trial || '—'}
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-amber-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats?.pending || '—'}
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Expired</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats?.expired || '—'}
                    </p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Cancelled</p>
                    <p className="text-3xl font-bold text-gray-600">
                      {stats?.cancelled || '—'}
                    </p>
                  </div>
                  <XCircle className="h-10 w-10 text-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-xl border-0 mt-6">
            <CardHeader className="bg-card text-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Subscription Overview
              </CardTitle>
              <CardDescription className="text-amber-100">
                Current subscription statistics across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center py-8">
                Detailed subscription analytics will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Default Limits */}
        <TabsContent value="limits">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-card text-white">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6" />
                Default Plan Limits
              </CardTitle>
              <CardDescription className="text-amber-100">
                Default limits applied to subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Free Plan</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 2 Users</li>
                    <li>• 1 Store</li>
                    <li>• 50 orders/month</li>
                    <li>• Email support</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Basic Plan</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 5 Users</li>
                    <li>• 1 Store</li>
                    <li>• 500 orders/month</li>
                    <li>• WhatsApp support</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Professional</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 15 Users</li>
                    <li>• 3 Stores</li>
                    <li>• Unlimited orders</li>
                    <li>• Priority support</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Enterprise</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Unlimited Users</li>
                    <li>• Unlimited Stores</li>
                    <li>• Unlimited orders</li>
                    <li>• Dedicated support</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Note:</strong> Plan limits can be modified in the Subscription Plans management section.
                  Changes to plan limits will apply to new subscriptions only.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
