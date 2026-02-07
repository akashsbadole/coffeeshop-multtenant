'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Package,
  IndianRupee,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Search,
  Loader2
} from 'lucide-react'

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  totalAmount: number
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'PARTIAL' | 'CANCELLED'
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  items: PurchaseOrderItem[]
  notes?: string
}

interface PurchaseOrderItem {
  id: string
  menuItemId: string
  itemName: string
  quantity: number
  receivedQty?: number
  unitPrice: number
  total: number
}

interface MenuItem {
  id: string
  name: string
  price: number
}

interface Supplier {
  id: string
  name: string
  isActive: boolean
}

export function PurchaseOrderManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Dialog states
  const [addPOpen, setAddPOpen] = useState(false)
  const [editPOpen, setEditPOpen] = useState(false)
  const [viewPOpen, setViewPOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  
  // Form states
  const [poForm, setPOForm] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: [] as { menuItemId: string; quantity: number; unitPrice: number }[]
  })
  
  const [newItem, setNewItem] = useState({ menuItemId: '', quantity: 1, unitPrice: 0 })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      const [poRes, itemsRes, supplierRes] = await Promise.all([
        fetch('/api/purchase-orders'),
        fetch('/api/pos/menu-items'),
        fetch('/api/suppliers')
      ])

      if (poRes.ok) setPurchaseOrders(await poRes.json())
      if (itemsRes.ok) setMenuItems(await itemsRes.json())
      if (supplierRes.ok) setSuppliers(await supplierRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPO = async () => {
    try {
      const totalAmount = poForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...poForm,
          totalAmount,
          items: poForm.items
        })
      })

      if (response.ok) {
        toast.success('Purchase order created successfully')
        setAddPOpen(false)
        resetForm()
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create purchase order')
      }
    } catch (error) {
      console.error('Error creating PO:', error)
      toast.error('Failed to create purchase order')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast.success(`Status updated to ${status}`)
        fetchAllData()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDeletePO = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return

    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Purchase order deleted successfully')
        fetchAllData()
      } else {
        toast.error('Failed to delete purchase order')
      }
    } catch (error) {
      console.error('Error deleting PO:', error)
      toast.error('Failed to delete purchase order')
    }
  }

  const addItemToForm = () => {
    if (!newItem.menuItemId || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      toast.error('Please fill in all item fields')
      return
    }

    const menuItem = menuItems.find(item => item.id === newItem.menuItemId)
    if (menuItem) {
      setPOForm({
        ...poForm,
        items: [...poForm.items, {
          menuItemId: newItem.menuItemId,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice
        }]
      })
      setNewItem({ menuItemId: '', quantity: 1, unitPrice: 0 })
    }
  }

  const removeItemFromForm = (index: number) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index)
    })
  }

  const openViewDialog = (po: PurchaseOrder) => {
    setSelectedPO(po)
    setViewPOpen(true)
  }

  const resetForm = () => {
    setPOForm({
      supplierId: '',
      expectedDate: '',
      notes: '',
      items: []
    })
    setNewItem({ menuItemId: '', quantity: 1, unitPrice: 0 })
  }

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Received</Badge>
      case 'PARTIAL':
        return <Badge className="bg-amber-600"><Clock className="h-3 w-3 mr-1" />Partial</Badge>
      case 'APPROVED':
        return <Badge className="bg-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      default:
        return <Badge className="bg-gray-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter(p => p.status === 'PENDING').length,
    approved: purchaseOrders.filter(p => p.status === 'APPROVED').length,
    received: purchaseOrders.filter(p => p.status === 'RECEIVED').length,
    totalValue: purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading purchase orders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-500 mt-1">Manage supplier orders and inventory restocking</p>
        </div>
        <Button
          onClick={() => setAddPOpen(true)}
          className="bg-card hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-amber-100 text-sm">Total Orders</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-gray-500 to-gray-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-gray-100 text-sm">Pending</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-blue-100 text-sm">Approved</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-green-100 text-sm">Received</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.received}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-purple-100 text-sm">Total Value</CardDescription>
            <CardTitle className="text-2xl font-bold">₹{stats.totalValue.toFixed(0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Purchase Orders List */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-card text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                All Purchase Orders ({purchaseOrders.length})
              </CardTitle>
              <CardDescription className="text-amber-100">
                View and manage all purchase orders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/20 border-0 text-white placeholder:text-white/70 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/20 border-0 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                  <TableHead className="font-semibold text-black">PO #</TableHead>
                  <TableHead className="font-semibold text-black">Supplier</TableHead>
                  <TableHead className="font-semibold text-black">Items</TableHead>
                  <TableHead className="font-semibold text-black">Total Amount</TableHead>
                  <TableHead className="font-semibold text-black">Expected</TableHead>
                  <TableHead className="font-semibold text-black">Status</TableHead>
                  <TableHead className="font-semibold text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" color='#fff' />
                      <p className="font-medium">No purchase orders found</p>
                      <p className="text-sm">Create your first purchase order to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po) => (
                    <TableRow key={po.id} className="hover:bg-amber-50/50">
                      <TableCell className="font-medium">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {po.orderNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span>{po.supplierName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                          {po.items.length} items
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        ₹{po.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {po.expectedDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {new Date(po.expectedDate).toLocaleDateString('en-IN')}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(po)}
                            className="h-8 px-2 hover:bg-amber-50 hover:border-amber-300"
                          >
                            <Package className="h-3 w-3" />
                          </Button>
                          {po.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(po.id, 'APPROVED')}
                              className="h-8 px-2 hover:bg-green-50 hover:border-green-300 text-green-600"
                              title="Approve"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {po.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                              className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300 text-blue-600"
                              title="Mark as Received"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePO(po.id)}
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

      {/* Add PO Dialog */}
      <Dialog open={addPOpen} onOpenChange={setAddPOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="bg-card text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Create Purchase Order
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Create a new purchase order from supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="po-supplier">Supplier *</Label>
                <Select value={poForm.supplierId} onValueChange={(value) => setPOForm({ ...poForm, supplierId: value })}>
                  <SelectTrigger id="po-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.isActive).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-expected">Expected Delivery Date</Label>
                <Input
                  id="po-expected"
                  type="date"
                  value={poForm.expectedDate}
                  onChange={(e) => setPOForm({ ...poForm, expectedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-notes">Notes</Label>
                <Input
                  id="po-notes"
                  placeholder="Additional notes..."
                  value={poForm.notes}
                  onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Order Items</Label>
                <Badge className="bg-amber-100 text-amber-700">
                  {poForm.items.length} items | ₹{poForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                </Badge>
              </div>

              {/* Add Item Form */}
              <Card className="border-2 border-amber-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-product">Product *</Label>
                      <Select value={newItem.menuItemId} onValueChange={(value) => setNewItem({ ...newItem, menuItemId: value })}>
                        <SelectTrigger id="item-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {menuItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-qty">Quantity *</Label>
                      <Input
                        id="item-qty"
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-price">Unit Price (₹) *</Label>
                      <Input
                        id="item-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={addItemToForm}
                        className="w-full bg-card hover:from-amber-600 hover:to-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              {poForm.items.length > 0 && (
                <div className="space-y-2">
                  {poForm.items.map((item, index) => {
                    const menuItem = menuItems.find(m => m.id === item.menuItemId)
                    return (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{menuItem?.name || 'Unknown'}</p>
                              <div className="flex gap-4 mt-1 text-sm">
                                <span className="text-gray-600">
                                  Qty: <span className="font-medium">{item.quantity}</span>
                                </span>
                                <span className="text-gray-600">
                                  Price: <span className="font-medium">₹{item.unitPrice.toFixed(2)}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold text-lg text-green-600">
                                ₹{(item.quantity * item.unitPrice).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItemFromForm(index)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" color="#fff" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddPOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPO}
              disabled={poForm.items.length === 0}
              className="bg-card hover:from-amber-600 hover:to-orange-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={viewPOpen} onOpenChange={setViewPOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="bg-card text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Purchase Order {selectedPO?.orderNumber}
            </DialogTitle>
            {selectedPO && getStatusBadge(selectedPO.status)}
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-amber-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="font-bold text-lg text-gray-900">{selectedPO.supplierName}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-bold text-lg text-blue-600">
                      {new Date(selectedPO.orderDate).toLocaleDateString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-lg text-green-600">₹{selectedPO.totalAmount.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label className="text-lg font-semibold mb-3 block">Order Items</Label>
                <div className="space-y-2">
                  {selectedPO.items.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.itemName}</p>
                            <div className="flex gap-4 mt-1 text-sm">
                              <span className="text-gray-600">
                                Ordered: <span className="font-medium">{item.quantity}</span>
                              </span>
                              {item.receivedQty !== undefined && (
                                <span className="text-gray-600">
                                  Received: <span className="font-medium">{item.receivedQty}</span>
                                </span>
                              )}
                              <span className="text-gray-600">
                                Price: <span className="font-medium">₹{item.unitPrice.toFixed(2)}</span>
                              </span>
                            </div>
                          </div>
                          <p className="font-bold text-xl text-green-600">
                            ₹{item.total.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedPO.notes && (
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <Label className="text-sm text-gray-600">Notes</Label>
                    <p className="mt-1">{selectedPO.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button
              onClick={() => setViewPOpen(false)}
              className="bg-card hover:from-amber-600 hover:to-orange-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
