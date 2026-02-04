'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Utensils, Plus, Pencil, Trash2, Coffee, Package, Cake, IceCream2, X, Edit3 } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  gstRate: string
  hsnCode: string | null
  categoryId: string
  isAvailable: boolean
  category: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  description: string | null
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState('items')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    gstRate: 'EIGHTEEN',
    hsnCode: '',
    categoryId: '',
    isAvailable: true
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/pos/menu-items'),
        fetch('/api/pos/categories')
      ])
      
      if (itemsRes.ok && catsRes.ok) {
        const items = await itemsRes.json()
        const cats = await catsRes.json()
        setMenuItems(items)
        setCategories(cats)
      }
    } catch (error) {
      console.error('Failed to fetch menu data:', error)
      toast.error('Failed to load menu data')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      }

      if (activeTab === 'categories') {
        // Handle category creation
        const response = await fetch('/api/pos/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description
          })
        })

        if (response.ok) {
          toast.success('Category created successfully')
          setDialogOpen(false)
          fetchData()
          resetForm()
        }
      } else {
        // Handle menu item
        const response = await fetch('/api/pos/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          toast.success('Menu item added successfully')
          setDialogOpen(false)
          fetchData()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Operation failed')
        }
      }
    } catch (error) {
      console.error('Operation error:', error)
      toast.error('Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/pos/menu-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      })

      if (response.ok) {
        toast.success('Item updated successfully')
        fetchData()
      } else {
        toast.error('Failed to update item')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Failed to update item')
    }
  }

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return

    try {
      const response = await fetch(`/api/pos/menu-items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Item deleted successfully')
        fetchData()
      } else {
        toast.error('Failed to delete item')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete item')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      gstRate: 'EIGHTEEN',
      hsnCode: '',
      categoryId: '',
      isAvailable: true
    })
    setSelectedItem(null)
    setIsEditing(false)
  }

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('hot') || name.includes('beverage')) return <Coffee className="h-5 w-5" />
    if (name.includes('food') || name.includes('snack')) return <Utensils className="h-5 w-5" />
    if (name.includes('dessert') || name.includes('cake')) return <Cake className="h-5 w-5" />
    if (name.includes('cold') || name.includes('ice')) return <IceCream2 className="h-5 w-5" />
    return <Package className="h-5 w-5" />
  }

  const gstRates = [
    { value: 'ZERO', label: '0%' },
    { value: 'FIVE', label: '5%' },
    { value: 'TWELVE', label: '12%' },
    { value: 'EIGHTEEN', label: '18%' },
    { value: 'TWENTY_EIGHT', label: '28%' }
  ]

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white shadow-lg p-1 rounded-xl border border-amber-200">
          <TabsTrigger value="items" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-2" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            <Edit3 className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="items">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Menu Items
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Manage your restaurant menu
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetForm()
                    setDialogOpen(true)
                  }}
                  className="bg-white text-amber-600 hover:bg-amber-50 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="border border-amber-200 rounded-lg overflow-hidden">
                <ScrollArea className="h-125">
                  {menuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <Utensils className="h-20 w-20 mb-4 opacity-20" />
                      <p className="font-medium text-lg">No menu items yet</p>
                      <p className="text-sm mt-2">Add your first menu item to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-amber-100">
                      {menuItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-amber-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${item.isAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {getCategoryIcon(item.category.name)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{item.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{item.category.name}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-lg font-bold text-amber-600">₹{item.price.toFixed(2)}</span>
                                <Badge className="text-xs bg-amber-100 text-amber-700">
                                  GST {item.gstRate.replace('_', ' ')}%
                                </Badge>
                                <Badge variant={item.isAvailable ? 'default' : 'secondary'} className="text-xs">
                                  {item.isAvailable ? 'Available' : 'Unavailable'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                              className="hover:bg-green-50 hover:text-green-600"
                              title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                            >
                              {item.isAvailable ? <Pencil className="h-4 w-4" color="#fff" /> : <Plus className="h-4 w-4" color="#fff" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id, item.name)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" color="#fff" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-6 w-6" />
                    Categories
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Manage menu categories
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetForm()
                    setDialogOpen(true)
                  }}
                  className="bg-white text-amber-600 hover:bg-amber-50 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="border-2 border-amber-200 hover:border-amber-400 transition-colors">
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 p-2 rounded-lg">
                            {getCategoryIcon(category.name)}
                          </div>
                          <div>
                            <CardTitle className="text-base text-white">{category.name}</CardTitle>
                            {category.description && (
                              <CardDescription className="text-xs mt-1">
                                {category.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-lg border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold">
              {activeTab === 'items' ? 'Add Menu Item' : 'Add Category'}
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              {activeTab === 'items' ? 'Add a new item to your menu' : 'Create a new menu category'}
            </DialogDescription>
          </DialogHeader>

          {activeTab === 'items' ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Masala Chai"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this item..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstRate" className="text-sm font-semibold">GST Rate</Label>
                    <Select value={formData.gstRate} onValueChange={(value) => setFormData({ ...formData, gstRate: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gstRates.map((rate) => (
                          <SelectItem key={rate.value} value={rate.value}>
                            {rate.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsnCode" className="text-sm font-semibold">HSN Code (Optional)</Label>
                  <Input
                    id="hsnCode"
                    placeholder="e.g., 3004"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-sm font-semibold">Category</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-11 border-amber-200 hover:bg-amber-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-11 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
                >
                  {isLoading ? 'Saving...' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="catName" className="text-sm font-semibold">Category Name</Label>
                  <Input
                    id="catName"
                    placeholder="e.g., Hot Beverages"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catDescription" className="text-sm font-semibold">Description (Optional)</Label>
                  <Textarea
                    id="catDescription"
                    placeholder="Describe this category..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 h-11 border-amber-200 hover:bg-amber-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-11 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
                >
                  {isLoading ? 'Saving...' : 'Add Category'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
