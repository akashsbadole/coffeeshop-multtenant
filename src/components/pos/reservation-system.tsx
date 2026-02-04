'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Calendar, Clock, Users, Phone, Mail, Plus, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react'

interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  partySize: number
  date: string
  time: string
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  specialRequests?: string
  tableId?: string
  table?: {
    name: string
    section?: string
  }
}

export function ReservationSystem() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 2,
    date: selectedDate,
    time: '19:00',
    notes: '',
    specialRequests: ''
  })

  useEffect(() => {
    fetchReservations()
  }, [selectedDate])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reservations?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateReservation = async () => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Reservation created successfully')
        setCreateDialogOpen(false)
        fetchReservations()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      toast.error('Failed to create reservation')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        toast.success(`Reservation ${status.toLowerCase()}`)
        fetchReservations()
      }
    } catch (error) {
      console.error('Error updating reservation:', error)
      toast.error('Failed to update reservation')
    }
  }

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return

    try {
      const response = await fetch(`/api/reservations?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Reservation cancelled')
        fetchReservations()
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      toast.error('Failed to cancel reservation')
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      partySize: 2,
      date: selectedDate,
      time: '19:00',
      notes: '',
      specialRequests: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'CONFIRMED': return 'bg-green-500'
      case 'SEATED': return 'bg-blue-500'
      case 'COMPLETED': return 'bg-gray-500'
      case 'CANCELLED': return 'bg-red-500'
      case 'NO_SHOW': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Table Reservations</h2>
          <p className="text-gray-500">Manage restaurant table bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        {['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'].map((status) => {
          const count = reservations.filter(r => r.status === status).length
          return (
            <Card key={status}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{status}</span>
                  <Badge className={getStatusColor(status)}>{count}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle>Reservations for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          <CardDescription>
            {reservations.length} reservation{reservations.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations for this date
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div 
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{reservation.customerName}</h4>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" color="#fff" />
                        {reservation.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" color="#fff" />
                        {reservation.partySize} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" color="#fff" />
                        {reservation.customerPhone}
                      </span>
                      {reservation.table && (
                        <span className="text-blue-600">
                          Table: {reservation.table.name}
                        </span>
                      )}
                    </div>
                    {reservation.specialRequests && (
                      <p className="text-sm text-amber-600 mt-2">
                        Special: {reservation.specialRequests}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {reservation.status === 'PENDING' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateStatus(reservation.id, 'CONFIRMED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {reservation.status === 'CONFIRMED' && (
                      <Button 
                        size="sm"
                        onClick={() => handleUpdateStatus(reservation.id, 'SEATED')}
                      >
                        Seat
                      </Button>
                    )}
                    {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Reservation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>Create a new table reservation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer Name</Label>
              <Input 
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input 
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label>Email (Optional)</Label>
              <Input 
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                placeholder="customer@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Party Size</Label>
              <Input 
                type="number"
                min={1}
                max={20}
                value={formData.partySize}
                onChange={(e) => setFormData({...formData, partySize: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label>Special Requests (Optional)</Label>
              <Input 
                value={formData.specialRequests}
                onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                placeholder="Window seat, birthday celebration, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReservation}>
              Create Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
