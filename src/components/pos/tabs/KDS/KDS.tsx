'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Clock, ChefHat, CheckCircle, Utensils, AlertTriangle } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  notes: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'CANCELLED'
  menuItem: {
    name: string
    category: {
      name: string
    }
  }
  modifiers: string | null
  createdAt: string
  order: {
    id: string
    orderNumber: string
    table: { name: string } | null
    notes: string | null
    createdBy: { name: string }
    createdAt: string
  }
}

interface KDSData {
  orders: Array<{
    order: OrderItem['order']
    items: OrderItem[]
  }>
  summary: {
    totalOrders: number
    totalItems: number
    status: string
  }
}

const statusColors = {
  PENDING: 'bg-yellow-500',
  IN_PROGRESS: 'bg-blue-500',
  READY: 'bg-green-500',
  SERVED: 'bg-gray-500',
  CANCELLED: 'bg-red-500'
}

const statusLabels = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready',
  SERVED: 'Served',
  CANCELLED: 'Cancelled'
}

export function KDS() {
  const [kdsData, setKdsData] = useState<KDSData | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('PENDING')
  const [isLoading, setIsLoading] = useState(false)

  // Separate fetch function for reuse
  const fetchKDSOrders = async () => {
    try {
      const response = await fetch(`/api/pos/kds?status=${selectedStatus}`)
      if (response.ok) {
        const data = await response.json()
        setKdsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch KDS orders:', error)
      toast.error('Failed to load orders')
    }
  }

  useEffect(() => {
    fetchKDSOrders()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchKDSOrders, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [selectedStatus])

  const updateItemStatus = async (orderItemId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/pos/kds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId, status: newStatus })
      })

      if (response.ok) {
        toast.success(`Item marked as ${statusLabels[newStatus as keyof typeof statusLabels]}`)
        fetchKDSOrders()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    }
  }

  const getTimeSinceOrder = (createdAt: string) => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffMs = now.getTime() - orderTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`
    
    return orderTime.toLocaleDateString()
  }

  const getTimeColor = (createdAt: string) => {
    const now = new Date()
    const orderTime = new Date(createdAt)
    const diffMins = Math.floor((now.getTime() - orderTime.getTime()) / 60000)
    
    if (diffMins > 20) return 'text-red-500'
    if (diffMins > 10) return 'text-yellow-500'
    return 'text-green-500'
  }

  const allOrders = kdsData?.orders || []
  const totalItems = allOrders.reduce((sum, order) => sum + order.items.length, 0)

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kitchen Display</h2>
          <p className="text-gray-500">Real-time order management for kitchen</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex gap-2">
            {['PENDING', 'IN_PROGRESS', 'READY'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(status)}
                className={selectedStatus === status ? 'bg-amber-500' : ''}
              >
                {statusLabels[status as keyof typeof statusLabels]}
              </Button>
            ))}
          </div>
          <Button onClick={fetchKDSOrders} variant="outline">
            <ChefHat className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Utensils className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{kdsData?.summary.totalOrders || 0}</p>
                <p className="text-sm text-gray-500">Active Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ChefHat className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalItems}</p>
                <p className="text-sm text-gray-500">Items to Prep</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{selectedStatus}</p>
                <p className="text-sm text-gray-500">Viewing Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      {allOrders.length === 0 ? (
        <Card className="shadow-xl border-0">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No orders to display</h3>
            <p className="text-gray-500 mt-1">New orders will appear here automatically</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allOrders.map((orderGroup) => (
            <Card
              key={orderGroup.order.id}
              className={`overflow-hidden ${
                orderGroup.order.table ? 'border-l-4 border-l-amber-500' : ''
              }`}
            >
              <CardHeader className="p-4 pb-2 bg-linear-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      #{orderGroup.order.orderNumber}
                    </CardTitle>
                    {orderGroup.order.table && (
                      <Badge variant="outline">
                        {orderGroup.order.table.name}
                      </Badge>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${getTimeColor(orderGroup.order.createdAt)}`}>
                    <Clock className="h-4 w-4" color="#fff" />
                    <span className="text-sm font-medium">
                      {getTimeSinceOrder(orderGroup.order.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  By: {orderGroup.order.createdBy.name}
                </p>
              </CardHeader>
              <CardContent className="p-4">
                {/* Items List */}
                <div className="space-y-3 mb-4">
                  {orderGroup.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        item.status === 'PENDING'
                          ? 'bg-yellow-50 border-yellow-200'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{item.quantity}x</span>
                            <span className="font-medium">{item.menuItem.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.menuItem.category.name}</p>
                          {item.notes && (
                            <div className="flex items-start gap-1 mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>{item.notes}</span>
                            </div>
                          )}
                          {item.modifiers && (
                            <p className="text-xs text-gray-500 mt-1">
                              Modifiers: {item.modifiers}
                            </p>
                          )}
                        </div>
                        <Badge className={`${statusColors[item.status]} text-white`}>
                          {statusLabels[item.status]}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {item.status === 'PENDING' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                            onClick={() => updateItemStatus(item.id, 'IN_PROGRESS')}
                          >
                            <ChefHat className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {item.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-500 hover:bg-green-600"
                            onClick={() => updateItemStatus(item.id, 'READY')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Ready
                          </Button>
                        )}
                        {item.status === 'READY' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-gray-500 hover:bg-gray-600"
                            onClick={() => updateItemStatus(item.id, 'SERVED')}
                          >
                            <Utensils className="h-4 w-4 mr-1" />
                            Served
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Notes */}
                {orderGroup.order.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Note:</span> {orderGroup.order.notes}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Mark all items as ready
                      orderGroup.items.forEach((item) => {
                        if (item.status === 'IN_PROGRESS') {
                          updateItemStatus(item.id, 'READY')
                        }
                      })
                    }}
                  >
                    All Ready
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
