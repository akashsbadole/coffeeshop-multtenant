'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Users, Plus, Pencil, Trash2, Mail, Shield, User as UserIcon, X } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  updatedAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'CASHIER',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing && selectedUser 
        ? `/api/users/${selectedUser.id}`
        : '/api/users'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(isEditing ? 'User updated successfully' : 'User created successfully')
        setDialogOpen(false)
        fetchUsers()
        resetForm()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Operation error:', error)
      toast.error('Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditing(true)
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete user')
    }
  }

  const resetForm = () => {
    setFormData({ email: '', name: '', role: 'CASHIER', password: '' })
    setSelectedUser(null)
    setIsEditing(false)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">ADMIN</span>
      case 'MANAGER':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">MANAGER</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">CASHIER</span>
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-5 w-5 text-purple-600" />
      case 'MANAGER':
        return <Shield className="h-5 w-5 text-blue-600" />
      default:
        return <UserIcon className="h-5 w-5 text-green-600" />
    }
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Admin Users</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Managers</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{users.filter(u => u.role === 'MANAGER').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Cashiers</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold">{users.filter(u => u.role === 'CASHIER').length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4">
            <CardTitle className="text-sm font-medium opacity-90">Total Staff</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List Card */}
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Staff Members
              </CardTitle>
              <CardDescription className="text-amber-100">
                Manage staff accounts and permissions
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
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border border-amber-200 rounded-lg overflow-hidden">
            <ScrollArea className="h-[400px]">
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Users className="h-20 w-20 mb-4 opacity-20" />
                  <p className="font-medium text-lg">No staff members yet</p>
                  <p className="text-sm mt-2">Add your first staff member to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-amber-100">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-amber-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          user.role === 'ADMIN' ? 'bg-purple-100' :
                          user.role === 'MANAGER' ? 'bg-blue-100' :
                          'bg-green-100'
                        }`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{user.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="mt-2">{getRoleBadge(user.role)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" color="#fff" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id, user.name)}
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

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              {isEditing ? 'Update user information' : 'Create a new staff account'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11"
                    required
                    disabled={isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHIER">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-green-600" />
                        <span>Cashier</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MANAGER">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>Manager</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  {isEditing ? 'New Password (optional)' : 'Password'}
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isEditing ? 'Leave empty to keep current password' : 'Enter password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-11"
                    required={!isEditing}
                  />
                </div>
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
                className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
