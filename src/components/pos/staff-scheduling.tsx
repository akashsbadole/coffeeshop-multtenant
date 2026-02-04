'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Send,
  Briefcase
} from 'lucide-react'

interface Staff {
  id: string
  name: string
  role: string
}

interface ScheduleAssignment {
  id: string
  userId: string
  userName: string
  date: string
  shiftType: string
  startTime: string
  endTime: string
  isOffDay: boolean
}

interface LeaveRequest {
  id: string
  userId: string
  userName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: string
}

export function StaffScheduling() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [weekView, setWeekView] = useState<boolean>(true)

  const [assignmentForm, setAssignmentForm] = useState<{
    userId: string
    shiftType: string
    startTime: string
    endTime: string
    isOffDay: boolean
  }>({
    userId: '',
    shiftType: 'MORNING',
    startTime: '09:00',
    endTime: '17:00',
    isOffDay: false
  })

  const [leaveForm, setLeaveForm] = useState<{
    userId: string
    leaveType: string
    startDate: string
    endDate: string
    reason: string
  }>({
    userId: '',
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const startDate = new Date(currentDate)
      startDate.setDate(startDate.getDate() - startDate.getDay())
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)

      const params = new URLSearchParams({
        action: 'calendar',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const [scheduleRes, staffRes, leavesRes] = await Promise.all([
        fetch(`/api/schedule?${params}`),
        fetch('/api/users'),
        fetch('/api/leave?status=PENDING')
      ])

      if (scheduleRes.ok) {
        const data = await scheduleRes.json()
        setAssignments(data.schedule || [])
      }
      if (staffRes.ok) {
        setStaff(await staffRes.json())
      }
      if (leavesRes.ok) {
        const data = await leavesRes.json()
        setLeaveRequests(data.requests || [])
      }
    } catch (error) {
      toast.error('Failed to load schedule data')
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysInWeek = (): Date[] => {
    const days: Date[] = []
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return assignments.filter(a => a.date.split('T')[0] === dateStr)
  }

  const getLeaveForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return leaveRequests.filter(l => {
      const start = l.startDate.split('T')[0]
      const end = l.endDate.split('T')[0]
      return dateStr >= start && dateStr <= end
    })
  }

  const handleCreateAssignment = async () => {
    if (!selectedDate || !assignmentForm.userId) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const assignments: Array<{
        userId: string
        date: string
        shiftType: string
        startTime: string
        endTime: string
        isOffDay: boolean
      }> = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedDate)
        date.setDate(date.getDate() + i)
        if (date.getDay() !== 0) {
          assignments.push({
            userId: assignmentForm.userId,
            date: date.toISOString(),
            shiftType: assignmentForm.shiftType,
            startTime: assignmentForm.startTime,
            endTime: assignmentForm.endTime,
            isOffDay: assignmentForm.isOffDay
          })
        }
      }

      const weekStart = new Date(selectedDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createSchedule',
          weekStartDate: weekStart.toISOString(),
          weekEndDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          assignments
        })
      })

      if (response.ok) {
        toast.success('Schedule created successfully')
        setCreateDialogOpen(false)
        fetchData()
      } else {
        toast.error('Failed to create schedule')
      }
    } catch (error) {
      toast.error('Failed to create schedule')
    }
  }

  const handleApproveLeave = async (requestId: string) => {
    try {
      const response = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' })
      })

      if (response.ok) {
        toast.success('Leave approved')
        fetchData()
      } else {
        toast.error('Failed to approve leave')
      }
    } catch (error) {
      toast.error('Failed to approve leave')
    }
  }

  const handleRejectLeave = async (requestId: string) => {
    try {
      const response = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' })
      })

      if (response.ok) {
        toast.success('Leave rejected')
        fetchData()
      } else {
        toast.error('Failed to reject leave')
      }
    } catch (error) {
      toast.error('Failed to reject leave')
    }
  }

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'MORNING': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'AFTERNOON': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'EVENING': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'NIGHT': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const days = getDaysInWeek()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Scheduling</h2>
          <p className="text-gray-500 mt-1">Manage staff schedules and leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const newDate = new Date(currentDate)
            newDate.setDate(newDate.getDate() - 7)
            setCurrentDate(newDate)
          }}>
            <ChevronLeft className="h-4 w-4" color="#fff" />
          </Button>
          <Button variant="outline" className="px-4">
            {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </Button>
          <Button variant="outline" onClick={() => {
            setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))
          }}>
            <ChevronRight className="h-4 w-4" color="#fff" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="leaves">
            <Briefcase className="h-4 w-4 mr-2" />
            Leave Requests
            {leaveRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500">{leaveRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2 bg-gray-50 rounded">
                    {day}
                  </div>
                ))}

                {days.map((date: Date, i: number) => {
                  const dayAssignments = getAssignmentsForDate(date)
                  const dayLeaves = getLeaveForDate(date)
                  const isToday = new Date().toDateString() === date.toDateString()

                  return (
                    <div
                      key={i}
                      className={`min-h-32 border rounded-lg p-2 ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                          {date.getDate()}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setSelectedDate(date)
                            setCreateDialogOpen(true)
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="space-y-1">
                        {dayLeaves.map((leave) => (
                          <div key={leave.id} className="text-xs p-1 bg-red-100 text-red-700 rounded truncate">
                            Leave: {leave.userName}
                          </div>
                        ))}

                        {dayAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className={`text-xs p-1 rounded border ${getShiftColor(assignment.shiftType)}`}
                          >
                            <div className="font-medium">{assignment.userName}</div>
                            <div className="flex items-center gap-1 text-[10px] opacity-75">
                              <Clock className="h-2 w-2" />
                              {assignment.startTime} - {assignment.endTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardContent className="p-6">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No pending leave requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{leave.userName}</p>
                          <p className="text-sm text-gray-500">
                            {leave.leaveType} Leave: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.totalDays} days)
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Reason: {leave.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{leave.status}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleApproveLeave(leave.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleRejectLeave(leave.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Schedule Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={assignmentForm.userId} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select value={assignmentForm.shiftType} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, shiftType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Morning (9AM - 5PM)</SelectItem>
                  <SelectItem value="AFTERNOON">Afternoon (1PM - 9PM)</SelectItem>
                  <SelectItem value="EVENING">Evening (5PM - 1AM)</SelectItem>
                  <SelectItem value="NIGHT">Night (9PM - 5AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={assignmentForm.startTime} onChange={(e) => setAssignmentForm({ ...assignmentForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={assignmentForm.endTime} onChange={(e) => setAssignmentForm({ ...assignmentForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="offDay"
                checked={assignmentForm.isOffDay}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, isOffDay: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="offDay">Off Day</Label>
            </div>
            <Button className="w-full" onClick={handleCreateAssignment}>
              <Send className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
