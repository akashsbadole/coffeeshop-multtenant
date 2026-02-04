'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  UserPlus,
  Search,
  Phone,
  Mail,
  Award,
  IndianRupee,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Star,
  Crown,
  Target,
  Gift,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'

interface Customer {
  id: string
  name?: string
  phone?: string
  email?: string
  address?: string
  loyaltyPoints: number
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  totalSpent: number
  visitCount: number
  gstin?: string
  panNumber?: string
  createdAt: string
  lastOrderDate?: string
}

interface LoyaltyRedemption {
  id: string
  customerId: string
  customerName: string
  pointsRedeemed: number
  discountAmount: number
  redeemedAt: string
  orderId?: string
}

const LOYALTY_TIERS = [
  { tier: 'BRONZE', points: 0, color: 'bg-orange-600', icon: Target },
  { tier: 'SILVER', points: 500, color: 'bg-gray-400', icon: Star },
  { tier: 'GOLD', points: 2000, color: 'bg-amber-500', icon: Award },
  { tier: 'PLATINUM', points: 5000, color: 'bg-purple-600', icon: Crown }
]

export function CustomerManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  
  // Dialog states
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [redeemPointsOpen, setRedeemPointsOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  
  const [redeemForm, setRedeemForm] = useState({
    customerId: '',
    customerName: '',
    pointsToRedeem: 0
  })

  useEffect(() => {
    fetchCustomerData()
  }, [])

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true)
      const [customersRes, redemptionsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/loyalty/redemptions')
      ])

      if (customersRes.ok) {
        setCustomers(await customersRes.json())
      }
      if (redemptionsRes.ok) {
        setRedemptions(await redemptionsRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error)
      toast.error('Failed to load customer data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      })

      if (response.ok) {
        toast.success('Customer registered successfully')
        setAddCustomerOpen(false)
        setCustomerForm({ name: '', phone: '', email: '', address: '' })
        fetchCustomerData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to register customer')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      toast.error('Failed to register customer')
    }
  }

  const handleRedeemPoints = async () => {
    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(redeemForm)
      })

      if (response.ok) {
        toast.success(`Redeemed ${redeemForm.pointsToRedeem} points successfully`)
        setRedeemPointsOpen(false)
        setRedeemForm({ customerId: '', customerName: '', pointsToRedeem: 0 })
        fetchCustomerData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to redeem points')
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      toast.error('Failed to redeem points')
    }
  }

  const openRedeemDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setRedeemForm({
      customerId: customer.id,
      customerName: customer.name || customer.phone || 'Unknown',
      pointsToRedeem: Math.min(customer.loyaltyPoints, 100)
    })
    setRedeemPointsOpen(true)
  }

  const calculateTier = (points: number) => {
    let tier = LOYALTY_TIERS[0]
    for (const t of LOYALTY_TIERS) {
      if (points >= t.points) tier = t
    }
    return tier
  }

  const getPointsValue = (points: number) => {
    return points * 0.1 // ₹0.10 per point
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (customer.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (customer.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    
    const matchesTier = selectedTier === 'all' || customer.loyaltyTier === selectedTier
    
    return matchesSearch && matchesTier
  })

  const getTierIcon = (tier: string) => {
    const tierData = LOYALTY_TIERS.find(t => t.tier === tier)
    if (!tierData) return null
    const Icon = tierData.icon
    return <Icon className="h-4 w-4" color="#fff" />
  }

  const getTierBadge = (tier: string) => {
    const tierData = LOYALTY_TIERS.find(t => t.tier === tier)
    if (!tierData) return <Badge>{tier}</Badge>
    return (
      <Badge className={`${tierData.color} text-white`}>
        <span className="mr-1">{getTierIcon(tier)}</span>
        {tier}
      </Badge>
    )
  }

  const stats = {
    totalCustomers: customers.length,
    totalPoints: customers.reduce((sum, c) => sum + c.loyaltyPoints, 0),
    platinumMembers: customers.filter(c => c.loyaltyTier === 'PLATINUM').length,
    goldMembers: customers.filter(c => c.loyaltyTier === 'GOLD').length,
    totalRedemptions: redemptions.reduce((sum, r) => sum + r.pointsRedeemed, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading customer data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management & Loyalty</h2>
          <p className="text-gray-500 mt-1">Manage customers, track loyalty points, and rewards</p>
        </div>
        <Button
          onClick={() => setAddCustomerOpen(true)}
          className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          <Users className="h-4 w-4 mr-2" />
          Register Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-purple-100 text-sm">Total Customers</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.totalCustomers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-amber-100 text-sm">Total Points</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.totalPoints}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-600 to-purple-800 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-purple-100 text-sm">Platinum Members</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.platinumMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-600 to-orange-700 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-amber-100 text-sm">Gold Members</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.goldMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-green-100 text-sm">Points Redeemed</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.totalRedemptions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg p-1 rounded-xl border border-amber-200">
          <TabsTrigger 
            value="customers"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger 
            value="loyalty"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Award className="h-4 w-4 mr-2" />
            Loyalty Program
          </TabsTrigger>
          <TabsTrigger 
            value="redemptions"
            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            <Gift className="h-4 w-4 mr-2" />
            Redemptions
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    All Customers
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Manage customer profiles and information
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                    <Input
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/20 border-0 text-white placeholder:text-white/70 w-64"
                    />
                  </div>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="w-40 bg-white/20 border-0 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="BRONZE">Bronze</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="PLATINUM">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-amber-50 sticky top-0">
                    <TableRow>
                      <TableHead className="font-semibold text-black">Customer</TableHead>
                      <TableHead className="font-semibold text-black">Tier</TableHead>
                      <TableHead className="font-semibold text-black">Points</TableHead>
                      <TableHead className="font-semibold text-black">Total Spent</TableHead>
                      <TableHead className="font-semibold text-black">Visits</TableHead>
                      <TableHead className="font-semibold text-black">Last Order</TableHead>
                      <TableHead className="font-semibold text-right text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <p className="font-medium">No customers found</p>
                          <p className="text-sm">Register your first customer to get started</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-amber-50/50">
                          <TableCell>
                            <div className="space-y-1">
                              {customer.name && (
                                <p className="font-semibold text-gray-900">{customer.name}</p>
                              )}
                              {customer.phone && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </p>
                              )}
                              {customer.email && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTierBadge(customer.loyaltyTier)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="font-bold text-amber-600">{customer.loyaltyPoints}</span>
                              <span className="text-xs text-gray-500">
                                (₹{getPointsValue(customer.loyaltyPoints).toFixed(2)})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-black">
                            <IndianRupee className="h-3 w-3 inline text-green-600 mr-1" />
                            ₹{customer.totalSpent.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              {customer.visitCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {customer.lastOrderDate ? (
                              new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => openRedeemDialog(customer)}
                                className="h-8 px-3 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                              >
                                <Gift className="h-3 w-3 mr-1" />
                                Redeem
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Program Tab */}
        <TabsContent value="loyalty">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LOYALTY_TIERS.map((tier) => (
              <Card key={tier.tier} className={`border-2 ${tier.color.replace('bg-', 'border-')}/30 shadow-lg`}>
                <CardHeader className={`${tier.color} text-white`}>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-white/20 p-2 rounded-full">
                      <tier.icon className="h-6 w-6" />
                    </div>
                    {tier.tier} Tier
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Minimum {tier.points} points required
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Point Value</p>
                    <p className="font-bold text-lg text-gray-900">
                      ₹{getPointsValue(1).toFixed(2)} per point
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Welcome Bonus</p>
                    <p className="font-bold text-lg text-gray-900">+50 points</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Earning Rate</p>
                    <p className="font-bold text-lg text-gray-900">1 point per ₹10 spent</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">Members at this tier</p>
                    <p className="font-bold text-2xl text-gray-900 mt-1">
                      {customers.filter(c => c.loyaltyTier === tier.tier).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Top Customers by Points
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {customers
                  .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
                  .slice(0, 10)
                  .map((customer, index) => {
                    const TierIcon = calculateTier(customer.loyaltyPoints).icon
                    return (
                      <div key={customer.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-amber-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-purple-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer.name || customer.phone || 'Unknown'}</p>
                            <p className="text-xs text-gray-600">{customer.visitCount} visits</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <TierIcon className="h-4 w-4 text-amber-500" />
                            <p className="font-bold text-xl text-purple-600">{customer.loyaltyPoints}</p>
                            <p className="text-xs text-gray-500">pts</p>
                          </div>
                          <p className="text-xs text-gray-600">₹{getPointsValue(customer.loyaltyPoints).toFixed(2)} value</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemptions Tab */}
        <TabsContent value="redemptions">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                Point Redemptions ({redemptions.length})
              </CardTitle>
              <CardDescription className="text-blue-100">
                View all loyalty point redemptions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {redemptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Gift className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No redemptions yet</p>
                  <p className="text-sm">Point redemptions will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redemptions.map((redemption) => (
                    <Card key={redemption.id} className="border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{redemption.customerName}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(redemption.redeemedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="font-bold text-xl text-amber-600">
                                {redemption.pointsRedeemed}
                              </span>
                              <span className="text-xs text-gray-500">pts</span>
                            </div>
                            <p className="font-bold text-green-600">
                              ₹{redemption.discountAmount.toFixed(2)} saved
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Customer Dialog */}
      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Register New Customer
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Add a new customer to your loyalty program
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number *</Label>
              <Input
                id="customer-phone"
                placeholder="Enter phone number"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="Enter email address"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                placeholder="Enter address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddCustomerOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomer}
              className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Points Dialog */}
      <Dialog open={redeemPointsOpen} onOpenChange={setRedeemPointsOpen}>
        <DialogContent className="border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Redeem Loyalty Points
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Convert loyalty points to discount
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Customer</span>
                  <span className="font-semibold text-black">{selectedCustomer.name || selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Available Points</span>
                  <span className="font-bold text-xl text-purple-600">{selectedCustomer.loyaltyPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Value</span>
                  <span className="font-bold text-green-600">₹{getPointsValue(selectedCustomer.loyaltyPoints).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redeem-points">Points to Redeem</Label>
                <Input
                  id="redeem-points"
                  type="number"
                  min="1"
                  max={selectedCustomer.loyaltyPoints}
                  value={redeemForm.pointsToRedeem}
                  onChange={(e) => setRedeemForm({ ...redeemForm, pointsToRedeem: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-600">
                  Max: {selectedCustomer.loyaltyPoints} points | Value: ₹{getPointsValue(redeemForm.pointsToRedeem).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setRedeemPointsOpen(false)}
              className="border-purple-200 hover:bg-purple-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeemPoints}
              disabled={redeemForm.pointsToRedeem <= 0}
              className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Gift className="h-4 w-4 mr-2" />
              Redeem Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default LoyaltyManagement
