'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  Star,
  Search,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  gstin?: string
  isActive: boolean
  isPreferred: boolean
  createdAt: string
  orderCount?: number
  totalOrders?: number
}

export function SupplierManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [addSupplierOpen, setAddSupplierOpen] = useState(false)
  const [editSupplierOpen, setEditSupplierOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    isActive: true,
    isPreferred: false
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        setSuppliers(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSupplier = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      })

      if (response.ok) {
        toast.success('Supplier added successfully')
        setAddSupplierOpen(false)
        resetForm()
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add supplier')
      }
    } catch (error) {
      console.error('Error adding supplier:', error)
      toast.error('Failed to add supplier')
    }
  }

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return

    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      })

      if (response.ok) {
        toast.success('Supplier updated successfully')
        setEditSupplierOpen(false)
        setSelectedSupplier(null)
        resetForm()
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update supplier')
      }
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error('Failed to update supplier')
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Supplier deleted successfully')
        fetchSuppliers()
      } else {
        toast.error('Failed to delete supplier')
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Failed to delete supplier')
    }
  }

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      gstin: supplier.gstin || '',
      isActive: supplier.isActive,
      isPreferred: supplier.isPreferred
    })
    setEditSupplierOpen(true)
  }

  const resetForm = () => {
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      isActive: true,
      isPreferred: false
    })
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.isActive).length,
    preferred: suppliers.filter(s => s.isPreferred).length,
    withGstin: suppliers.filter(s => s.gstin).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading suppliers...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <p className="text-gray-500 mt-1">Manage suppliers and vendor information</p>
        </div>
        <Button
          onClick={() => setAddSupplierOpen(true)}
          className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-amber-100 text-sm">Total Suppliers</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-green-100 text-sm">Active Suppliers</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-purple-100 text-sm">Preferred</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.preferred}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-blue-100 text-sm">With GSTIN</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.withGstin}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-xl border-0">
        <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6" />
                All Suppliers ({suppliers.length})
              </CardTitle>
              <CardDescription className="text-amber-100">
                View and manage all suppliers
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 border-0 text-white placeholder:text-white/70 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="bg-amber-50 sticky top-0">
                <TableRow>
                  <TableHead className="font-semibold text-black">Supplier</TableHead>
                  <TableHead className="font-semibold text-black">Contact</TableHead>
                  <TableHead className="font-semibold text-black">GSTIN</TableHead>
                  <TableHead className="font-semibold text-black">Status</TableHead>
                  <TableHead className="font-semibold text-black">Preferred</TableHead>
                  <TableHead className="font-semibold text-black">Added</TableHead>
                  <TableHead className="font-semibold text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      <Truck className="h-16 w-16 mx-auto mb-4 opacity-20" color='#fff' />
                      <p className="font-medium">No suppliers found</p>
                      <p className="text-sm">Add your first supplier to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-amber-50/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {supplier.isPreferred && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                            <p className="font-semibold text-gray-900">{supplier.name}</p>
                          </div>
                          {supplier.contactPerson && (
                            <p className="text-xs text-gray-600">Contact: {supplier.contactPerson}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="line-clamp-1 max-w-[200px]">{supplier.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.gstin ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {supplier.gstin}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                          {supplier.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplier.isPreferred && (
                          <Badge className="bg-amber-600">
                            <Star className="h-3 w-3 mr-1" />
                            Preferred
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(supplier.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(supplier)}
                            className="h-8 px-2 hover:bg-amber-50 hover:border-amber-300"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSupplier(supplier.id)}
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

      {/* Add Supplier Dialog */}
      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Add New Supplier
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Add a new supplier to your inventory management
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-name">Supplier Name *</Label>
                <Input
                  id="supplier-name"
                  placeholder="e.g., Coffee Beans Co."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-contact">Contact Person</Label>
                <Input
                  id="supplier-contact"
                  placeholder="e.g., John Smith"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-phone">Phone Number</Label>
                <Input
                  id="supplier-phone"
                  placeholder="e.g., +91 98765 43210"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-email">Email</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  placeholder="e.g., supplier@example.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-gstin">GSTIN</Label>
                <Input
                  id="supplier-gstin"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={supplierForm.gstin}
                  onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-address">Address</Label>
                <Textarea
                  id="supplier-address"
                  placeholder="Enter full address..."
                  rows={3}
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Active</p>
                  <p className="text-xs text-gray-600">Supplier is available for orders</p>
                </div>
                <Switch
                  checked={supplierForm.isActive}
                  onCheckedChange={(checked) => setSupplierForm({ ...supplierForm, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Preferred</p>
                  <p className="text-xs text-gray-600">Mark as preferred supplier</p>
                </div>
                <Switch
                  checked={supplierForm.isPreferred}
                  onCheckedChange={(checked) => setSupplierForm({ ...supplierForm, isPreferred: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddSupplierOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSupplier}
              className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={editSupplierOpen} onOpenChange={setEditSupplierOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Edit Supplier
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Update supplier information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-name">Supplier Name *</Label>
                <Input
                  id="edit-supplier-name"
                  placeholder="e.g., Coffee Beans Co."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-contact">Contact Person</Label>
                <Input
                  id="edit-supplier-contact"
                  placeholder="e.g., John Smith"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-phone">Phone Number</Label>
                <Input
                  id="edit-supplier-phone"
                  placeholder="e.g., +91 98765 43210"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-email">Email</Label>
                <Input
                  id="edit-supplier-email"
                  type="email"
                  placeholder="e.g., supplier@example.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-gstin">GSTIN</Label>
                <Input
                  id="edit-supplier-gstin"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={supplierForm.gstin}
                  onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-address">Address</Label>
                <Textarea
                  id="edit-supplier-address"
                  placeholder="Enter full address..."
                  rows={3}
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Active</p>
                  <p className="text-xs text-gray-600">Supplier is available for orders</p>
                </div>
                <Switch
                  checked={supplierForm.isActive}
                  onCheckedChange={(checked) => setSupplierForm({ ...supplierForm, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Preferred</p>
                  <p className="text-xs text-gray-600">Mark as preferred supplier</p>
                </div>
                <Switch
                  checked={supplierForm.isPreferred}
                  onCheckedChange={(checked) => setSupplierForm({ ...supplierForm, isPreferred: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditSupplierOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSupplier}
              className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
