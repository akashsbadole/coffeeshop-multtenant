'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Package, AlertTriangle, Plus, Minus, RefreshCw, TrendingUp, TrendingDown, Search } from 'lucide-react'

interface InventoryItem {
  id: string
  menuItemId: string
  quantity: number
  reorderLevel: number
  unit: string
  lastRestocked: string | null
  menuItem: {
    name: string
    category: {
      name: string
    }
  }
}

const statusColors = {
  OUT_OF_STOCK: 'bg-red-600',
  LOW_STOCK: 'bg-orange-500',
  IN_STOCK: 'bg-green-600'
}

const statusLabels = {
  OUT_OF_STOCK: 'Out of Stock',
  LOW_STOCK: 'Low Stock',
  IN_STOCK: 'In Stock'
}

export function POSInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    quantity: 0,
    reorderLevel: 10
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/pos/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      toast.error('Failed to load inventory')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/pos/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Inventory updated successfully')
        setDialogOpen(false)
        fetchInventory()
      } else {
        toast.error('Failed to update inventory')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update inventory')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAdjustment = async (itemId: string, adjustment: number) => {
    try {
      const item = inventory.find(i => i.id === itemId)
      if (!item) return

      const newQuantity = Math.max(0, item.quantity + adjustment)

      const response = await fetch(`/api/pos/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (response.ok) {
        toast.success(`Stock ${adjustment > 0 ? 'increased' : 'decreased'} successfully`)
        fetchInventory()
      } else {
        toast.error('Failed to update stock')
      }
    } catch (error) {
      console.error('Adjustment error:', error)
      toast.error('Failed to update stock')
    }
  }

  const handleRestock = (item: InventoryItem) => {
    setSelectedItem(item)
    setFormData({
      quantity: item.quantity,
      reorderLevel: item.reorderLevel
    })
    setDialogOpen(true)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'OUT_OF_STOCK', color: statusColors.OUT_OF_STOCK, textColor: 'text-white' }
    } else if (item.quantity <= item.reorderLevel) {
      return { status: 'LOW_STOCK', color: statusColors.LOW_STOCK, textColor: 'text-white' }
    }
    return { status: 'IN_STOCK', color: statusColors.IN_STOCK, textColor: 'text-white' }
  }

  const getStockProgress = (item: InventoryItem) => {
    const maxStock = item.reorderLevel * 3
    const percentage = Math.min(100, (item.quantity / maxStock) * 100)
    return percentage
  }

  const filteredInventory = inventory.filter(item =>
    item.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.menuItem.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockCount = filteredInventory.filter(i => i.quantity <= i.reorderLevel && i.quantity > 0).length
  const outOfStockCount = filteredInventory.filter(i => i.quantity === 0).length
  const inStockCount = filteredInventory.filter(i => i.quantity > i.reorderLevel).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-500">Track stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchInventory} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredInventory.length}</p>
                <p className="text-sm text-gray-500">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inStockCount}</p>
                <p className="text-sm text-gray-500">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
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
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Inventory List */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Items
          </CardTitle>
          <CardDescription className="text-amber-100">
            Manage stock levels and restock items
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ScrollArea className="h-125">
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Package className="h-20 w-20 mb-4 opacity-20" />
                <p className="font-medium text-lg">No inventory items found</p>
                <p className="text-sm mt-2">Add products to see inventory here</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-100">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const stockProgress = getStockProgress(item)

                  return (
                    <div key={item.id} className="p-4 hover:bg-amber-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{item.menuItem.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.menuItem.category.name} • {item.unit || 'Units'}
                              </p>
                            </div>
                            <Badge className={`${stockStatus.color} ${stockStatus.textColor}`}>
                              {stockStatus.status}
                            </Badge>
                          </div>

                          {/* Stock Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600">Stock Level</span>
                              <span className="font-semibold">{item.quantity} {item.unit || 'units'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  item.quantity <= item.reorderLevel
                                    ? 'bg-orange-500'
                                    : item.quantity === 0
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${stockProgress}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustment(item.id, -1)}
                              className="flex-1 hover:bg-red-50 hover:border-red-300"
                              disabled={item.quantity === 0}
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              Reduce
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustment(item.id, 1)}
                              className="flex-1 hover:bg-green-50 hover:border-green-300"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRestock(item)}
                              className="flex-1 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Restock
                            </Button>
                          </div>

                          {/* Low Stock Alert */}
                          {item.quantity <= item.reorderLevel && item.quantity > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Low stock alert at <strong>{item.reorderLevel} {item.unit || 'units'}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setSelectedItem(null)
      }}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold">Restock Item</DialogTitle>
            <DialogDescription className="text-amber-100">
              {selectedItem && `Update stock for ${selectedItem.menuItem.name}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="pl-10 h-11 text-lg font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Low Stock Alert Threshold</Label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="reorderLevel"
                    type="number"
                    min="0"
                    placeholder="Enter alert threshold"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alert will be shown when stock falls below this level
                </p>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-11 border-amber-200 hover:bg-amber-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
              >
                {isLoading ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
