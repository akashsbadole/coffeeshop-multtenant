'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Percent,
  IndianRupee,
  ShoppingCart,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  Copy,
  Loader2
} from 'lucide-react'

interface Discount {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED' | 'BOGO' | 'BUNDLE' | 'LOYALTY'
  value: number
  description?: string
  minOrderValue: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  validFrom: string
  validUntil?: string
  categoryIds?: string
  isActive: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  createdAt: string
}

export function DiscountManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Dialog states
  const [addDiscountOpen, setAddDiscountOpen] = useState(false)
  const [editDiscountOpen, setEditDiscountOpen] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  
  // Form states
  const [discountForm, setDiscountForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'BOGO' | 'BUNDLE' | 'LOYALTY',
    value: 0,
    description: '',
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    validFrom: '',
    validUntil: '',
    isActive: true
  })

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/discounts')
      if (response.ok) {
        setDiscounts(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error)
      toast.error('Failed to load discounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDiscount = async () => {
    try {
      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountForm)
      })

      if (response.ok) {
        toast.success('Discount created successfully')
        setAddDiscountOpen(false)
        resetForm()
        fetchDiscounts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create discount')
      }
    } catch (error) {
      console.error('Error creating discount:', error)
      toast.error('Failed to create discount')
    }
  }

  const handleUpdateDiscount = async () => {
    if (!selectedDiscount) return

    try {
      const response = await fetch(`/api/discounts/${selectedDiscount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountForm)
      })

      if (response.ok) {
        toast.success('Discount updated successfully')
        setEditDiscountOpen(false)
        setSelectedDiscount(null)
        resetForm()
        fetchDiscounts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update discount')
      }
    } catch (error) {
      console.error('Error updating discount:', error)
      toast.error('Failed to update discount')
    }
  }

  const handleToggleStatus = async (discount: Discount) => {
    try {
      const response = await fetch(`/api/discounts/${discount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !discount.isActive })
      })

      if (response.ok) {
        toast.success(`Discount ${discount.isActive ? 'deactivated' : 'activated'} successfully`)
        fetchDiscounts()
      } else {
        toast.error('Failed to update discount status')
      }
    } catch (error) {
      console.error('Error updating discount status:', error)
      toast.error('Failed to update discount status')
    }
  }

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return

    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Discount deleted successfully')
        fetchDiscounts()
      } else {
        toast.error('Failed to delete discount')
      }
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast.error('Failed to delete discount')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const openEditDialog = (discount: Discount) => {
    setSelectedDiscount(discount)
    setDiscountForm({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      description: discount.description || '',
      minOrderValue: discount.minOrderValue,
      maxDiscount: discount.maxDiscount || 0,
      usageLimit: discount.usageLimit || 0,
      validFrom: discount.validFrom?.split('T')[0] || '',
      validUntil: discount.validUntil?.split('T')[0] || '',
      isActive: discount.isActive
    })
    setEditDiscountOpen(true)
  }

  const resetForm = () => {
    setDiscountForm({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      description: '',
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
      validFrom: '',
      validUntil: '',
      isActive: true
    })
  }

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = 
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || discount.status === statusFilter
    const matchesType = typeFilter === 'all' || discount.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getDiscountTypeBadge = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Badge className="bg-green-600"><Percent className="h-3 w-3 mr-1" />Percentage</Badge>
      case 'FIXED':
        return <Badge className="bg-blue-600"><IndianRupee className="h-3 w-3 mr-1" />Fixed Amount</Badge>
      case 'BOGO':
        return <Badge className="bg-purple-600"><Package className="h-3 w-3 mr-1" />BOGO</Badge>
      case 'BUNDLE':
        return <Badge className="bg-amber-600"><ShoppingCart className="h-3 w-3 mr-1" />Bundle</Badge>
      default:
        return <Badge className="bg-pink-600"><Tag className="h-3 w-3 mr-1" />Loyalty</Badge>
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'EXPIRED') {
      return <Badge variant="secondary" className="bg-gray-400">EXPIRED</Badge>
    }
    if (!isActive) {
      return <Badge variant="secondary" className="bg-red-400">INACTIVE</Badge>
    }
    return <Badge className="bg-green-600">ACTIVE</Badge>
  }

  const stats = {
    total: discounts.length,
    active: discounts.filter(d => d.isActive && d.status === 'ACTIVE').length,
    used: discounts.reduce((sum, d) => sum + d.usedCount, 0),
    expiring: discounts.filter(d => d.validUntil && new Date(d.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading discounts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discounts & Coupons</h2>
          <p className="text-gray-500 mt-1">Create and manage promotional codes and offers</p>
        </div>
        <Button
          onClick={() => setAddDiscountOpen(true)}
          className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Discount
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-amber-100 text-sm">Total Discounts</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-green-100 text-sm">Active Discounts</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-blue-100 text-sm">Total Uses</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.used}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-red-100 text-sm">Expiring Soon</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.expiring}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-xl border-0">
        <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-6 w-6" />
                All Discounts ({discounts.length})
              </CardTitle>
              <CardDescription className="text-amber-100">
                View and manage all discount codes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  placeholder="Search discounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/20 border-0 text-white placeholder:text-white/70 w-64"
                />
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/20 border-0 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white/20 border-0 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  <SelectItem value="BOGO">BOGO</SelectItem>
                  <SelectItem value="BUNDLE">Bundle</SelectItem>
                  <SelectItem value="LOYALTY">Loyalty</SelectItem>
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
                  <TableHead className="font-semibold text-black">Code</TableHead>
                  <TableHead className="font-semibold text-black">Type</TableHead>
                  <TableHead className="font-semibold text-black">Value</TableHead>
                  <TableHead className="font-semibold text-black">Usage</TableHead>
                  <TableHead className="font-semibold text-black">Valid Period</TableHead>
                  <TableHead className="font-semibold text-black">Status</TableHead>
                  <TableHead className="font-semibold text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Tag className="h-16 w-16 mx-auto mb-4 opacity-20" color='#fff' />
                      <p className="font-medium text-white">No discounts found</p>
                      <p className="text-sm text-white">Create your first discount to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id} className="hover:bg-amber-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-color">
                            {discount.code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCode(discount.code)}
                            className="h-6 w-6 p-0 hover:bg-gray-200"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getDiscountTypeBadge(discount.type)}</TableCell>
                      <TableCell>
                        {discount.type === 'PERCENTAGE' ? (
                          <div className="flex items-center gap-1">
                            <Percent className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-white">{discount.value}%</span>
                          </div>
                        ) : discount.type === 'FIXED' ? (
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4 text-blue-600" />
                            <span className="font-bold text-blue-600">₹{discount.value.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm">
                            {discount.type === 'BOGO' ? 'Buy 1 Get 1 Free' :
                             discount.type === 'BUNDLE' ? 'Special Bundle' : 'Loyalty Points'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            {discount.usedCount} used
                          </Badge>
                          {discount.usageLimit && (
                            <span className="text-xs text-gray-500">
                              / {discount.usageLimit}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            From: {new Date(discount.validFrom).toLocaleDateString('en-IN')}
                          </div>
                          {discount.validUntil && (
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              Until: {new Date(discount.validUntil).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(discount.status, discount.isActive)}
                          {discount.minOrderValue > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              Min ₹{discount.minOrderValue}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(discount)}
                            className="h-8 px-2 hover:bg-amber-50 hover:border-amber-300"
                            title={discount.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {discount.isActive ? <XCircle className="h-3 w-3 text-red-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(discount)}
                            className="h-8 px-2 hover:bg-amber-50 hover:border-amber-300"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDiscount(discount.id)}
                            className="h-8 px-2 hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
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

      {/* Add Discount Dialog */}
      <Dialog open={addDiscountOpen} onOpenChange={setAddDiscountOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Create New Discount
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Create a new discount or coupon code
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount-code">Discount Code *</Label>
                <Input
                  id="discount-code"
                  placeholder="e.g., SUMMER20"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
                <p className="text-xs text-gray-500">Use uppercase letters and numbers</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-type">Type *</Label>
                <Select value={discountForm.type} onValueChange={(value: any) => setDiscountForm({ ...discountForm, type: value })}>
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="BOGO">Buy One Get One</SelectItem>
                    <SelectItem value="BUNDLE">Bundle Deal</SelectItem>
                    <SelectItem value="LOYALTY">Loyalty Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(discountForm.type === 'PERCENTAGE' || discountForm.type === 'FIXED') && (
                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {discountForm.type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    min="0"
                    max={discountForm.type === 'PERCENTAGE' ? 100 : undefined}
                    step={discountForm.type === 'PERCENTAGE' ? 1 : 0.01}
                    placeholder={discountForm.type === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 100'}
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="discount-description">Description</Label>
                <Input
                  id="discount-description"
                  placeholder="e.g., Summer sale - 20% off all items"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount-min-order">Minimum Order Value (₹)</Label>
                <Input
                  id="discount-min-order"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 500"
                  value={discountForm.minOrderValue}
                  onChange={(e) => setDiscountForm({ ...discountForm, minOrderValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-max">Maximum Discount (₹)</Label>
                <Input
                  id="discount-max"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1000"
                  value={discountForm.maxDiscount}
                  onChange={(e) => setDiscountForm({ ...discountForm, maxDiscount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-usage-limit">Usage Limit</Label>
                <Input
                  id="discount-usage-limit"
                  type="number"
                  min="0"
                  placeholder="e.g., 100 (leave empty for unlimited)"
                  value={discountForm.usageLimit}
                  onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-valid-from">Valid From *</Label>
                <Input
                  id="discount-valid-from"
                  type="date"
                  value={discountForm.validFrom}
                  onChange={(e) => setDiscountForm({ ...discountForm, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-valid-until">Valid Until</Label>
                <Input
                  id="discount-valid-until"
                  type="date"
                  value={discountForm.validUntil}
                  onChange={(e) => setDiscountForm({ ...discountForm, validUntil: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave empty for no expiry</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Active</p>
                  <p className="text-xs text-gray-600">Enable this discount immediately</p>
                </div>
                <Switch
                  checked={discountForm.isActive}
                  onCheckedChange={(checked) => setDiscountForm({ ...discountForm, isActive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddDiscountOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDiscount}
              className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Discount Dialog */}
      <Dialog open={editDiscountOpen} onOpenChange={setEditDiscountOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Edit Discount
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Update discount details
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discount-code">Discount Code *</Label>
                <Input
                  id="edit-discount-code"
                  placeholder="e.g., SUMMER20"
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discount-type">Type *</Label>
                <Select value={discountForm.type} onValueChange={(value: any) => setDiscountForm({ ...discountForm, type: value })}>
                  <SelectTrigger id="edit-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="BOGO">Buy One Get One</SelectItem>
                    <SelectItem value="BUNDLE">Bundle Deal</SelectItem>
                    <SelectItem value="LOYALTY">Loyalty Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(discountForm.type === 'PERCENTAGE' || discountForm.type === 'FIXED') && (
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-value">
                    {discountForm.type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *
                  </Label>
                  <Input
                    id="edit-discount-value"
                    type="number"
                    min="0"
                    max={discountForm.type === 'PERCENTAGE' ? 100 : undefined}
                    step={discountForm.type === 'PERCENTAGE' ? 1 : 0.01}
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-discount-description">Description</Label>
                <Input
                  id="edit-discount-description"
                  placeholder="e.g., Summer sale - 20% off all items"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discount-min-order">Minimum Order Value (₹)</Label>
                <Input
                  id="edit-discount-min-order"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountForm.minOrderValue}
                  onChange={(e) => setDiscountForm({ ...discountForm, minOrderValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discount-max">Maximum Discount (₹)</Label>
                <Input
                  id="edit-discount-max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountForm.maxDiscount}
                  onChange={(e) => setDiscountForm({ ...discountForm, maxDiscount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discount-usage-limit">Usage Limit</Label>
                <Input
                  id="edit-discount-usage-limit"
                  type="number"
                  min="0"
                  value={discountForm.usageLimit}
                  onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discount-valid-from">Valid From *</Label>
                <Input
                  id="edit-discount-valid-from"
                  type="date"
                  value={discountForm.validFrom}
                  onChange={(e) => setDiscountForm({ ...discountForm, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discount-valid-until">Valid Until</Label>
                <Input
                  id="edit-discount-valid-until"
                  type="date"
                  value={discountForm.validUntil}
                  onChange={(e) => setDiscountForm({ ...discountForm, validUntil: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Active</p>
                  <p className="text-xs text-gray-600">Enable this discount immediately</p>
                </div>
                <Switch
                  checked={discountForm.isActive}
                  onCheckedChange={(checked) => setDiscountForm({ ...discountForm, isActive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditDiscountOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDiscount}
              className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
