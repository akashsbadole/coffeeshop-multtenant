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
import { Users, QrCode, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react'

interface Table {
  id: string
  name: string
  capacity: number
  section: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  qrCode: string | null
  orders?: any[]
}

const statusColors = {
  AVAILABLE: 'bg-green-500',
  OCCUPIED: 'bg-red-500',
  RESERVED: 'bg-yellow-500',
  CLEANING: 'bg-blue-500'
}

const statusLabels = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning'
}

export function Tables() {
  const [tables, setTables] = useState<Table[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    capacity: number
    section: string
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  }>({
    name: '',
    capacity: 4,
    section: 'Main',
    status: 'AVAILABLE'
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/pos/tables')
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error)
      toast.error('Failed to load tables')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing ? `/api/pos/tables/${selectedTable?.id}` : '/api/pos/tables'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(isEditing ? 'Table updated successfully' : 'Table created successfully')
        setDialogOpen(false)
        fetchTables()
        resetForm()
      } else {
        toast.error('Operation failed')
      }
    } catch (error) {
      console.error('Operation error:', error)
      toast.error('Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (table: Table) => {
    setSelectedTable(table)
    setFormData({
      name: table.name,
      capacity: table.capacity,
      section: table.section,
      status: table.status
    })
    setIsEditing(true)
    setDialogOpen(true)
  }

  const handleDelete = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return

    try {
      const response = await fetch(`/api/pos/tables/${tableId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Table deleted successfully')
        fetchTables()
      } else {
        toast.error('Failed to delete table')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete table')
    }
  }

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/pos/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Table status updated')
        fetchTables()
      }
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 4,
      section: 'Main',
      status: 'AVAILABLE'
    })
    setSelectedTable(null)
    setIsEditing(false)
  }

  // Group tables by section
  const sections = [...new Set(tables.map(t => t.section))]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
          <p className="text-gray-500">Manage restaurant tables and floor plan</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTables} variant="outline">
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
            Add Table
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tables.filter(t => t.status === 'AVAILABLE').length}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tables.filter(t => t.status === 'OCCUPIED').length}</p>
                <p className="text-sm text-gray-500">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tables.filter(t => t.status === 'RESERVED').length}</p>
                <p className="text-sm text-gray-500">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{tables.filter(t => t.status === 'CLEANING').length}</p>
                <p className="text-sm text-gray-500">Cleaning</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables by Section */}
      {tables.length === 0 ? (
        <Card className="shadow-xl border-0">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No tables yet</h3>
            <p className="text-gray-500 mt-1">Add your first table to get started</p>
          </CardContent>
        </Card>
      ) : (
        sections.map(section => (
          <div key={section} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{section} Section</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.filter(t => t.section === section).map(table => (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    table.status === 'OCCUPIED' ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{table.name}</CardTitle>
                        <CardDescription>{table.capacity} seats</CardDescription>
                      </div>
                      <Badge className={`${statusColors[table.status]} text-white`}>
                        {statusLabels[table.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center justify-between mt-2">
                      <Select
                        value={table.status}
                        onValueChange={(value) => handleStatusChange(table.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="OCCUPIED">Occupied</SelectItem>
                          <SelectItem value="RESERVED">Reserved</SelectItem>
                          <SelectItem value="CLEANING">Cleaning</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(table)
                          }}
                        >
                          <Edit2 className="h-4 w-4" color="#fff" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(table.id)
                          }}
                          className="hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" color="#fff" />
                        </Button>
                      </div>
                    </div>
                    {table.qrCode && (
                      <div className="mt-3 flex items-center justify-center text-gray-400">
                        <QrCode className="h-4 w-4 mr-1" />
                        <span className="text-xs">QR Code</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Table' : 'Add New Table'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update table details' : 'Create a new table for your restaurant'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Table 1, T1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main">Main</SelectItem>
                      <SelectItem value="Outdoor">Outdoor</SelectItem>
                      <SelectItem value="Indoor">Indoor</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Patio">Patio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                      <SelectItem value="CLEANING">Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
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
                {isLoading ? 'Saving...' : isEditing ? 'Update Table' : 'Create Table'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
