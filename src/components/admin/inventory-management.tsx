'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Package, AlertTriangle, Plus, Minus, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

interface InventoryItem {
  id: string
  menuItemId: string
  quantity: number
  unit: string
  lowStockAlert: number
  menuItem: {
    name: string
    category: {
      name: string
    }
  }
  lastRestocked: string | null
}

export function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    quantity: 0,
    lowStockAlert: 10
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
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
      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
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

      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: newQuantity,
          lowStockAlert: item.lowStockAlert
        })
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
      lowStockAlert: item.lowStockAlert
    })
    setDialogOpen(true)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'OUT OF STOCK', color: 'bg-red-600', textColor: 'text-white' }
    } else if (item.quantity <= item.lowStockAlert) {
      return { status: 'LOW STOCK', color: 'bg-orange-500', textColor: 'text-white' }
    }
    return { status: 'IN STOCK', color: 'bg-green-600', textColor: 'text-white' }
  }

  const getStockProgress = (item: InventoryItem) => {
    const maxStock = item.lowStockAlert * 3
    const percentage = Math.min(100, (item.quantity / maxStock) * 100)
    return percentage
  }

  const lowStockCount = inventory.filter(i => i.quantity <= i.lowStockAlert).length
  const outOfStockCount = inventory.filter(i => i.quantity === 0).length
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">In Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold">{inventory.filter(i => i.quantity > i.lowStockAlert).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-3xl font-bold">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-3xl font-bold">{outOfStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Inventory Management
              </CardTitle>
              <CardDescription className="text-black">
                Track stock levels and manage inventory
              </CardDescription>
            </div>
            <Button
              onClick={fetchInventory}
              className="bg-white text-amber-600 hover:bg-amber-50 shadow-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border border-amber-200 rounded-lg overflow-hidden">
            <ScrollArea className="h-[500px]">
              {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Package className="h-20 w-20 mb-4 opacity-20" />
                  <p className="font-medium text-lg">No inventory items yet</p>
                  <p className="text-sm mt-2">Inventory will be tracked as orders are placed</p>
                </div>
              ) : (
                <div className="divide-y divide-amber-100">
                  {inventory.map((item) => {
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
                                  {item.menuItem.category.name} • {item.unit}
                                </p>
                              </div>
                              <Badge className={`${stockStatus.color} ${stockStatus.textColor} ml-auto`}>
                                {stockStatus.status}
                              </Badge>
                            </div>

                            {/* Stock Progress Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600">Stock Level</span>
                                <span className="font-semibold text-black">{item.quantity} {item.unit}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    item.quantity <= item.lowStockAlert
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
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Restock
                              </Button>
                            </div>

                            {/* Low Stock Alert Info */}
                            {item.quantity <= item.lowStockAlert && item.quantity > 0 && (
                              <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg text-sm">
                                <AlertTriangle className="h-4 w-4" color="#fff" />
                                <span>
                                  Low stock alert at <strong>{item.lowStockAlert} {item.unit}</strong>
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
          </div>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        setSelectedItem(null)
      }}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold">Restock Item</DialogTitle>
            <DialogDescription className="text-amber-100">
              {selectedItem && `Update stock for ${selectedItem.menuItem.name}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-semibold">Current Quantity</Label>
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
                <Label htmlFor="lowStockAlert" className="text-sm font-semibold">Low Stock Alert Threshold</Label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    placeholder="Enter alert threshold"
                    value={formData.lowStockAlert}
                    onChange={(e) => setFormData({ ...formData, lowStockAlert: parseInt(e.target.value) || 0 })}
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
                className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
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
