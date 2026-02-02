'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Package, Tag, RefreshCw, Search } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  price: number
}

interface ProductVariant {
  id: string
  menuItemId: string
  size: string | null
  color: string | null
  sku: string | null
  barcode: string | null
  stockQuantity: number
  priceAdjustment: number
  isAvailable: boolean
  menuItem: MenuItem
}

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'N/A']
const colorOptions = [
  'Black', 'White', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 
  'Pink', 'Purple', 'Brown', 'Navy', 'Beige', 'Maroon', 'Teal', 'N/A'
]

export function ProductVariants() {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [formData, setFormData] = useState({
    menuItemId: '',
    size: 'N/A',
    color: 'N/A',
    sku: '',
    barcode: '',
    stockQuantity: 0,
    priceAdjustment: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [variantsRes, menuItemsRes] = await Promise.all([
        fetch('/api/pos/variants'),
        fetch('/api/pos/menu-items')
      ])

      if (variantsRes.ok) {
        const variantData = await variantsRes.json()
        setVariants(variantData)
      }

      if (menuItemsRes.ok) {
        const menuData = await menuItemsRes.json()
        setMenuItems(menuData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    }
  }

  const fetchVariants = async () => {
    try {
      const response = await fetch('/api/pos/variants?menuItemId=all')
      if (response.ok) {
        const data = await response.json()
        setVariants(data)
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.menuItemId) {
      toast.error('Please select a product')
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        size: formData.size === 'N/A' ? null : formData.size,
        color: formData.color === 'N/A' ? null : formData.color
      }

      const url = isEditing ? `/api/pos/variants/${selectedVariant?.id}` : '/api/pos/variants'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(isEditing ? 'Variant updated successfully' : 'Variant created successfully')
        setDialogOpen(false)
        fetchData()
        resetForm()
      } else {
        toast.error('Operation failed')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    setFormData({
      menuItemId: variant.menuItemId,
      size: variant.size || 'N/A',
      color: variant.color || 'N/A',
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      stockQuantity: variant.stockQuantity,
      priceAdjustment: variant.priceAdjustment
    })
    setIsEditing(true)
    setDialogOpen(true)
  }

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const response = await fetch(`/api/pos/variants/${variantId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Variant deleted successfully')
        fetchData()
      } else {
        toast.error('Failed to delete variant')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete variant')
    }
  }

  const handleToggleAvailability = async (variant: ProductVariant) => {
    try {
      const response = await fetch(`/api/pos/variants/${variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAvailable: !variant.isAvailable
        })
      })

      if (response.ok) {
        toast.success(`Variant ${variant.isAvailable ? 'disabled' : 'enabled'}`)
        fetchData()
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Failed to update variant')
    }
  }

  const resetForm = () => {
    setFormData({
      menuItemId: '',
      size: 'N/A',
      color: 'N/A',
      sku: '',
      barcode: '',
      stockQuantity: 0,
      priceAdjustment: 0
    })
    setSelectedVariant(null)
    setIsEditing(false)
  }

  // Group variants by product
  const variantsByProduct = variants.reduce((acc, variant) => {
    const productName = variant.menuItem.name
    if (!acc[productName]) {
      acc[productName] = []
    }
    acc[productName].push(variant)
    return acc
  }, {} as Record<string, ProductVariant[]>)

  const filteredProducts = Object.entries(variantsByProduct).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalVariants = variants.length
  const inStockVariants = variants.filter(v => v.stockQuantity > 0).length
  const outOfStockVariants = variants.filter(v => v.stockQuantity === 0).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Variants</h2>
          <p className="text-gray-500">Manage size, color, and other product variants</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
            className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{variants.length}</p>
                <p className="text-sm text-gray-500">Total Variants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inStockVariants}</p>
                <p className="text-sm text-gray-500">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockVariants}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(variantsByProduct).length}</p>
                <p className="text-sm text-gray-500">Products</p>
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Variants by Product */}
      {filteredProducts.length === 0 ? (
        <Card className="shadow-xl border-0">
          <CardContent className="p-12 text-center">
            <Tag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No variants yet</h3>
            <p className="text-gray-500 mt-1">Add variants to your products</p>
          </CardContent>
        </Card>
      ) : (
        filteredProducts.map(([productName, productVariants]) => (
          <Card key={productName} className="shadow-xl border-0 mb-6">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    {productName}
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    {productVariants.length} variant{productVariants.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-amber-600 hover:bg-amber-50"
                  onClick={() => {
                    resetForm()
                    setFormData({ ...formData, menuItemId: productVariants[0].menuItemId })
                    setDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`p-4 border rounded-lg ${
                      variant.isAvailable ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {variant.size && variant.size !== 'N/A' && (
                          <Badge variant="outline">{variant.size}</Badge>
                        )}
                        {variant.color && variant.color !== 'N/A' && (
                          <Badge variant="outline">{variant.color}</Badge>
                        )}
                      </div>
                      <Badge variant={variant.isAvailable ? 'default' : 'secondary'}>
                        {variant.isAvailable ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SKU</span>
                        <span className="font-mono">{variant.sku || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Barcode</span>
                        <span className="font-mono">{variant.barcode || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price Adjustment</span>
                        <span className={variant.priceAdjustment > 0 ? 'text-green-600' : variant.priceAdjustment < 0 ? 'text-red-600' : ''}>
                          {variant.priceAdjustment > 0 ? '+' : ''}{variant.priceAdjustment === 0 ? '-' : `₹${variant.priceAdjustment.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock</span>
                        <span className={variant.stockQuantity === 0 ? 'text-red-500' : variant.stockQuantity < 10 ? 'text-orange-500' : 'text-green-600'}>
                          {variant.stockQuantity} units
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAvailability(variant)}
                        className="flex-1"
                      >
                        {variant.isAvailable ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(variant)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(variant.id)}
                        className="hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add/Edit Variant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update variant details' : 'Create a new product variant'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={formData.menuItemId}
                  onValueChange={(value) => setFormData({ ...formData, menuItemId: value })}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - ₹{item.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SKU and Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    placeholder="SKU-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode (Optional)</Label>
                  <Input
                    id="barcode"
                    placeholder="1234567890123"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              {/* Stock and Price Adjustment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceAdjustment">Price Adjustment (₹)</Label>
                  <Input
                    id="priceAdjustment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.priceAdjustment}
                    onChange={(e) => setFormData({ ...formData, priceAdjustment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
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
                {isLoading ? 'Saving...' : isEditing ? 'Update Variant' : 'Create Variant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
