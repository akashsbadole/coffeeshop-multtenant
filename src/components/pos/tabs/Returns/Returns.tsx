'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { RotateCcw, Package, Search, Plus, CheckCircle, XCircle, Clock, ArrowRightLeft } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    menuItem: { name: string }
    variant: { size: string | null; color: string | null } | null
  }>
}

interface ReturnItem {
  id: string
  orderId: string
  orderItemId: string | null
  quantity: number
  returnType: 'RETURN' | 'EXCHANGE'
  exchangeItemId: string | null
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  refundAmount: number | null
  notes: string | null
  createdAt: string
  order: Order
  orderItem: any
}

const statusColors = {
  REQUESTED: 'bg-yellow-500',
  APPROVED: 'bg-blue-500',
  REJECTED: 'bg-red-500',
  COMPLETED: 'bg-green-500'
}

const statusLabels = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed'
}

export function Returns() {
  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    orderId: '',
    orderItemId: '',
    quantity: 1,
    returnType: 'RETURN' as 'RETURN' | 'EXCHANGE',
    reason: ''
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchReturns()
    fetchOrders()
  }, [])

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/pos/returns')
      if (response.ok) {
        const data = await response.json()
        setReturns(data)
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
      toast.error('Failed to load returns')
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/pos/orders')
      if (response.ok) {
        const data = await response.json()
        // Only show completed or refunded orders (eligible for return)
        const eligibleOrders = data.filter((o: any) => 
          ['COMPLETED', 'REFUNDED'].includes(o.status)
        )
        setOrders(eligibleOrders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    setSelectedOrder(order || null)
    setFormData({ ...formData, orderId, orderItemId: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.orderId) {
      toast.error('Please select an order')
      return
    }

    setIsLoading(true)

    try {
      // Get customer ID from order
      const order = orders.find(o => o.id === formData.orderId)
      if (!order) {
        toast.error('Order not found')
        return
      }

      const response = await fetch('/api/pos/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: formData.orderId,
          customerId: 'demo-customer', // In production, get from auth
          orderItemId: formData.orderItemId || null,
          quantity: formData.quantity,
          returnType: formData.returnType,
          reason: formData.reason
        })
      })

      if (response.ok) {
        toast.success('Return request submitted successfully')
        setDialogOpen(false)
        fetchReturns()
        resetForm()
      } else {
        toast.error('Failed to submit return request')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit return request')
    } finally {
      setIsLoading(false)
    }
  }

  const updateReturnStatus = async (returnId: string, status: string, processedBy: string) => {
    try {
      const response = await fetch(`/api/pos/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, processedBy })
      })

      if (response.ok) {
        toast.success(`Return ${status.toLowerCase()} successfully`)
        fetchReturns()
      } else {
        toast.error('Failed to update return status')
      }
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update return status')
    }
  }

  const resetForm = () => {
    setFormData({
      orderId: '',
      orderItemId: '',
      quantity: 1,
      returnType: 'RETURN',
      reason: ''
    })
    setSelectedOrder(null)
  }

  const getSelectedItemPrice = () => {
    if (!selectedOrder || !formData.orderItemId) return 0
    const item = selectedOrder.items.find(i => i.id === formData.orderItemId)
    return item ? item.subtotal / item.quantity : 0
  }

  const estimatedRefund = formData.quantity * getSelectedItemPrice()

  const filteredReturns = returns.filter(r => 
    r.order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Returns & Exchanges</h2>
          <p className="text-gray-500">Process customer returns and exchanges</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
          className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Return
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'REQUESTED').length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'APPROVED').length}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <RotateCcw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'COMPLETED').length}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'REJECTED').length}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by order number or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <Card className="shadow-xl border-0">
          <CardContent className="p-12 text-center">
            <RotateCcw className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No returns yet</h3>
            <p className="text-gray-500 mt-1">Return requests will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => (
            <Card key={ret.id} className="shadow-lg">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      {ret.returnType === 'EXCHANGE' ? (
                        <ArrowRightLeft className="h-5 w-5 text-amber-600" />
                      ) : (
                        <RotateCcw className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Order #{ret.order.orderNumber}</CardTitle>
                      <CardDescription>
                        {new Date(ret.createdAt).toLocaleDateString()} at {new Date(ret.createdAt).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${statusColors[ret.status]} text-white`}>
                    {statusLabels[ret.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Return Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Return Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Type:</span> {ret.returnType}</p>
                      <p><span className="text-gray-500">Quantity:</span> {ret.quantity}</p>
                      <p><span className="text-gray-500">Reason:</span> {ret.reason}</p>
                      {ret.notes && (
                        <p><span className="text-gray-500">Notes:</span> {ret.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-1 text-sm">
                      {ret.order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.menuItem.name}
                            {item.variant && ` (${item.variant.size || ''} ${item.variant.color || ''})`}
                          </span>
                          <span className="text-gray-500">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      {ret.order.items.length > 3 && (
                        <p className="text-gray-400">+{ret.order.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>

                  {/* Refund & Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Refund</h4>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{ret.refundAmount?.toFixed(2) || '0.00'}
                    </p>
                    
                    {/* Actions for pending returns */}
                    {ret.status === 'REQUESTED' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => updateReturnStatus(ret.id, 'APPROVED', 'demo-user')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-500 hover:text-red-600"
                          onClick={() => updateReturnStatus(ret.id, 'REJECTED', 'demo-user')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {ret.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-green-500 hover:bg-green-600"
                        onClick={() => updateReturnStatus(ret.id, 'COMPLETED', 'demo-user')}
                      >
                        Complete Refund
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Return Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Return/Exchange</DialogTitle>
            <DialogDescription>
              Process a return or exchange for a completed order
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Order Selection */}
              <div className="space-y-2">
                <Label>Select Order</Label>
                <Select
                  value={formData.orderId}
                  onValueChange={handleOrderSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.orderNumber} - ₹{order.totalAmount.toFixed(2)} - {new Date(order.createdAt).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Items */}
              {selectedOrder && (
                <div className="space-y-2">
                  <Label>Select Item (Optional)</Label>
                  <Select
                    value={formData.orderItemId}
                    onValueChange={(value) => setFormData({ ...formData, orderItemId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Entire order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Entire order</SelectItem>
                      {selectedOrder.items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.quantity}x {item.menuItem.name} - ₹{item.subtotal.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Return Type */}
              <div className="space-y-2">
                <Label>Return Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="returnType"
                      value="RETURN"
                      checked={formData.returnType === 'RETURN'}
                      onChange={() => setFormData({ ...formData, returnType: 'RETURN' })}
                      className="w-4 h-4"
                    />
                    <RotateCcw className="h-4 w-4" />
                    <span>Return</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="returnType"
                      value="EXCHANGE"
                      checked={formData.returnType === 'EXCHANGE'}
                      onChange={() => setFormData({ ...formData, returnType: 'EXCHANGE' })}
                      className="w-4 h-4"
                    />
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Exchange</span>
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for return/exchange..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>

              {/* Estimated Refund */}
              {estimatedRefund > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-green-800">Estimated Refund</span>
                    <span className="text-xl font-bold text-green-600">₹{estimatedRefund.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
