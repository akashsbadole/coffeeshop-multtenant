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
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Search,
  Loader2
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'PROMOTION' | 'ALERT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isActive: boolean
  targetRole?: 'CASHIER' | 'MANAGER' | 'ADMIN'
  startDate: string
  endDate?: string
  createdAt: string
}

export function AnnouncementManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Dialog states
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false)
  const [editAnnouncementOpen, setEditAnnouncementOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  
  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'PROMOTION' | 'ALERT',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    isActive: true,
    targetRole: undefined as 'CASHIER' | 'MANAGER' | 'ADMIN' | undefined,
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/announcements')
      if (response.ok) {
        setAnnouncements(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      })

      if (response.ok) {
        toast.success('Announcement created successfully')
        setAddAnnouncementOpen(false)
        resetForm()
        fetchAnnouncements()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast.error('Failed to create announcement')
    }
  }

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement) return

    try {
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      })

      if (response.ok) {
        toast.success('Announcement updated successfully')
        setEditAnnouncementOpen(false)
        setSelectedAnnouncement(null)
        resetForm()
        fetchAnnouncements()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update announcement')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Announcement deleted successfully')
        fetchAnnouncements()
      } else {
        toast.error('Failed to delete announcement')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isActive: announcement.isActive,
      targetRole: announcement.targetRole,
      startDate: announcement.startDate?.split('T')[0] || '',
      endDate: announcement.endDate?.split('T')[0] || ''
    })
    setEditAnnouncementOpen(true)
  }

  const resetForm = () => {
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'INFO',
      priority: 'MEDIUM',
      isActive: true,
      targetRole: undefined,
      startDate: '',
      endDate: ''
    })
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesActive = activeFilter === 'all' || (activeFilter === 'active' && announcement.isActive) || (activeFilter === 'inactive' && !announcement.isActive)
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter
    
    return matchesSearch && matchesActive && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4" color="#fff" />
      case 'PROMOTION':
        return <Bell className="h-4 w-4" color="#fff" />
      case 'ALERT':
        return <AlertTriangle className="h-4 w-4" color="#fff" />
      default:
        return <Info className="h-4 w-4" color="#fff" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <Badge className="bg-amber-600"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>
      case 'PROMOTION':
        return <Badge className="bg-pink-600"><Bell className="h-3 w-3 mr-1" />Promotion</Badge>
      case 'ALERT':
        return <Badge className="bg-red-600"><AlertTriangle className="h-3 w-3 mr-1" />Alert</Badge>
      default:
        return <Badge className="bg-blue-600"><Info className="h-3 w-3 mr-1" />Info</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-600">URGENT</Badge>
      case 'HIGH':
        return <Badge className="bg-orange-600">HIGH</Badge>
      case 'LOW':
        return <Badge variant="outline" className="border-green-600 text-green-600">LOW</Badge>
      default:
        return <Badge className="bg-yellow-600">MEDIUM</Badge>
    }
  }

  const isAnnouncementActive = (announcement: Announcement) => {
    const now = new Date()
    const start = new Date(announcement.startDate)
    const end = announcement.endDate ? new Date(announcement.endDate) : new Date('2099-12-31')
    return announcement.isActive && now >= start && now <= end
  }

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => isAnnouncementActive(a)).length,
    inactive: announcements.filter(a => !isAnnouncementActive(a) || !a.isActive).length,
    urgent: announcements.filter(a => a.priority === 'URGENT' && a.isActive).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading announcements...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-500 mt-1">Create and manage staff announcements</p>
        </div>
        <Button
          onClick={() => setAddAnnouncementOpen(true)}
          className="bg-card hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-amber-100 text-sm">Total Announcements</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-green-100 text-sm">Active Now</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-gray-500 to-gray-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-gray-100 text-sm">Inactive</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 shadow-lg bg-linear-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="p-4">
            <CardDescription className="text-red-100 text-sm">Urgent</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.urgent}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-xl border-0">
        <CardHeader className="bg-card text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-6 w-6" />
                All Announcements ({announcements.length})
              </CardTitle>
              <CardDescription className="text-amber-100">
                View and manage all announcements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/20 border-0 text-white placeholder:text-white/70 w-64"
                />
              </div>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-40 bg-white/20 border-0 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white/20 border-0 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="PROMOTION">Promotion</SelectItem>
                  <SelectItem value="ALERT">Alert</SelectItem>
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
                  <TableHead className="font-semibold text-black">Title</TableHead>
                  <TableHead className="font-semibold text-black">Type</TableHead>
                  <TableHead className="font-semibold text-black">Priority</TableHead>
                  <TableHead className="font-semibold text-black">Target</TableHead>
                  <TableHead className="font-semibold text-black">Schedule</TableHead>
                  <TableHead className="font-semibold text-black">Status</TableHead>
                  <TableHead className="font-semibold text-right text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-20" color='#fff' />
                      <p className="font-medium">No announcements found</p>
                      <p className="text-sm">Create your first announcement to get started</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-amber-50/50">
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {getTypeIcon(announcement.type)}
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">{announcement.title}</p>
                            <p className="text-xs text-gray-600 line-clamp-2 max-w-[300px]">
                              {announcement.content}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(announcement.type)}</TableCell>
                      <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
                      <TableCell>
                        {announcement.targetRole ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            {announcement.targetRole}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">All</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            From: {new Date(announcement.startDate).toLocaleDateString('en-IN')}
                          </div>
                          {announcement.endDate && (
                            <div className="flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              Until: {new Date(announcement.endDate).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAnnouncementActive(announcement) ? (
                          <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-400"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(announcement)}
                            className="h-8 px-2 hover:bg-amber-50 hover:border-amber-300"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
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

      {/* Add Announcement Dialog */}
      <Dialog open={addAnnouncementOpen} onOpenChange={setAddAnnouncementOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="bg-card text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Create Announcement
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Create a new announcement for staff
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title *</Label>
              <Input
                id="announcement-title"
                placeholder="e.g., Store Closed for Maintenance"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Content *</Label>
              <Textarea
                id="announcement-content"
                placeholder="Enter announcement details..."
                rows={4}
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-type">Type *</Label>
                <Select value={announcementForm.type} onValueChange={(value: any) => setAnnouncementForm({ ...announcementForm, type: value })}>
                  <SelectTrigger id="announcement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                    <SelectItem value="ALERT">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-priority">Priority *</Label>
                <Select value={announcementForm.priority} onValueChange={(value: any) => setAnnouncementForm({ ...announcementForm, priority: value })}>
                  <SelectTrigger id="announcement-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-target">Target Role</Label>
                <Select value={announcementForm.targetRole || ''} onValueChange={(value: string) => setAnnouncementForm({ ...announcementForm, targetRole: (value as 'CASHIER' | 'MANAGER' | 'ADMIN') || undefined })}>
                  <SelectTrigger id="announcement-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Active</p>
                  <p className="text-xs text-gray-600">Enable this announcement</p>
                </div>
                <Switch
                  checked={announcementForm.isActive}
                  onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, isActive: checked })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-start">Start Date *</Label>
                <Input
                  id="announcement-start"
                  type="date"
                  value={announcementForm.startDate}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-end">End Date</Label>
                <Input
                  id="announcement-end"
                  type="date"
                  value={announcementForm.endDate}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, endDate: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave empty for indefinite</p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setAddAnnouncementOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAnnouncement}
              className="bg-card hover:from-amber-600 hover:to-orange-700"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={editAnnouncementOpen} onOpenChange={setEditAnnouncementOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="bg-card text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Edit Announcement
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              Update announcement details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-announcement-title">Title *</Label>
              <Input
                id="edit-announcement-title"
                placeholder="e.g., Store Closed for Maintenance"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-announcement-content">Content *</Label>
              <Textarea
                id="edit-announcement-content"
                placeholder="Enter announcement details..."
                rows={4}
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-announcement-type">Type *</Label>
                <Select value={announcementForm.type} onValueChange={(value: any) => setAnnouncementForm({ ...announcementForm, type: value })}>
                  <SelectTrigger id="edit-announcement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                    <SelectItem value="ALERT">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-announcement-priority">Priority *</Label>
                <Select value={announcementForm.priority} onValueChange={(value: any) => setAnnouncementForm({ ...announcementForm, priority: value })}>
                  <SelectTrigger id="edit-announcement-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-announcement-target">Target Role</Label>
                <Select value={announcementForm.targetRole || ''} onValueChange={(value: string) => setAnnouncementForm({ ...announcementForm, targetRole: (value as 'CASHIER' | 'MANAGER' | 'ADMIN') || undefined })}>
                  <SelectTrigger id="edit-announcement-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm">Active</p>
                  <p className="text-xs text-gray-600">Enable this announcement</p>
                </div>
                <Switch
                  checked={announcementForm.isActive}
                  onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, isActive: checked })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-announcement-start">Start Date *</Label>
                <Input
                  id="edit-announcement-start"
                  type="date"
                  value={announcementForm.startDate}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-announcement-end">End Date</Label>
                <Input
                  id="edit-announcement-end"
                  type="date"
                  value={announcementForm.endDate}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditAnnouncementOpen(false)}
              className="border-amber-200 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAnnouncement}
              className="bg-card hover:from-amber-600 hover:to-orange-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
