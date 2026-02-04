'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  MessageCircle, 
  Send, 
  Headphones,
  User, 
  X,
  Minimize2,
  Maximize2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  MoreVertical,
  Sparkles,
  Plus,
  Search,
  Filter,
  Clock3,
  ArrowUpCircle,
  CheckCheck,
  Archive
} from 'lucide-react'

// Types
interface Message {
  id: string
  ticketId: string
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM'
  senderId: string
  content: string
  attachments?: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
  }
}

interface Ticket {
  id: string
  subject: string
  description?: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdById: string
  assignedToId?: string
  orderId?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  messages: Message[]
  _count?: {
    messages: number
  }
}

interface QuickResponse {
  id: string
  title: string
  content: string
  category?: string
}

// Priority config
const priorityConfig = {
  LOW: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Low', icon: ArrowUpCircle },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Medium', icon: Clock3 },
  HIGH: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High', icon: AlertCircle },
  URGENT: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Urgent', icon: AlertCircle }
}

// Status config
const statusConfig = {
  OPEN: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Open', icon: MessageCircle },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'In Progress', icon: Clock },
  RESOLVED: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Resolved', icon: CheckCircle2 },
  CLOSED: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Closed', icon: Archive }
}

// Quick response templates
const defaultQuickResponses: QuickResponse[] = [
  { id: '1', title: 'Greeting', content: 'Hello! Thank you for reaching out. How can I help you today?', category: 'General' },
  { id: '2', title: 'Acknowledge', content: 'I understand your concern. Let me look into this for you right away.', category: 'General' },
  { id: '3', title: 'Resolved', content: 'Great! I\'m glad we could resolve this issue for you. Is there anything else I can help you with?', category: 'Closing' },
  { id: '4', title: 'Issue Fixed', content: 'The issue has been resolved. You should now be able to use the system without any problems.', category: 'Technical' },
  { id: '5', title: 'Refund Processing', content: 'Your refund request has been approved and is being processed. You should see the amount credited within 3-5 business days.', category: 'Billing' },
  { id: '6', title: 'Escalating', content: 'I\'m escalating this to our senior support team. They will contact you within 24 hours with a resolution.', category: 'Escalation' },
  { id: '7', title: 'Order Status', content: 'Let me check the status of your order for you. One moment please.', category: 'Orders' },
  { id: '8', title: 'Need More Info', content: 'To better assist you, could you please provide more details about the issue you\'re experiencing?', category: 'General' }
]

interface LiveChatSupportProps {
  userId: string
  userName: string
  userEmail: string
  userRole?: 'CUSTOMER' | 'AGENT' | 'ADMIN'
}

export function LiveChatSupport({ userId, userName, userEmail, userRole = 'CUSTOMER' }: LiveChatSupportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeView, setActiveView] = useState<'list' | 'chat' | 'new'>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [newTicketSubject, setNewTicketSubject] = useState('')
  const [newTicketDescription, setNewTicketDescription] = useState('')
  const [newTicketPriority, setNewTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>(defaultQuickResponses)
  const [showQuickResponses, setShowQuickResponses] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch tickets and unread count
  const fetchData = useCallback(async () => {
    try {
      // Fetch tickets
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : ''
      const ticketsRes = await fetch(`/api/chat?userId=${userId}&type=list${statusParam}`)
      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(data.tickets || [])
      }

      // Fetch unread count
      const unreadRes = await fetch(`/api/chat?userId=${userId}&type=unread`)
      if (unreadRes.ok) {
        const data = await unreadRes.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching chat data:', error)
    }
  }, [userId, filterStatus])

  // Initial load and polling
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(() => {
      if (isOpen) {
        fetchData()
        if (currentTicket) {
          fetchTicketMessages(currentTicket.id)
        }
      } else {
        // Still poll for unread count when closed
        fetch(`/api/chat?userId=${userId}&type=unread`)
          .then(res => res.json())
          .then(data => setUnreadCount(data.unreadCount || 0))
          .catch(console.error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isOpen, userId, currentTicket, fetchData])

  // Scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen && !isMinimized && activeView === 'chat' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized, activeView])

  // Fetch messages for a ticket
  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/chat?userId=${userId}&ticketId=${ticketId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        
        // Mark messages as read
        const unreadMessageIds = data.messages
          ?.filter((m: Message) => !m.isRead && m.senderType !== 'CUSTOMER')
          ?.map((m: Message) => m.id)
        
        if (unreadMessageIds?.length > 0) {
          await fetch('/api/chat', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'mark-read',
              ticketId,
              userId,
              messageIds: unreadMessageIds
            })
          })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  // Open a specific ticket
  const openTicket = async (ticket: Ticket) => {
    setCurrentTicket(ticket)
    setActiveView('chat')
    await fetchTicketMessages(ticket.id)
  }

  // Create new ticket
  const createTicket = async () => {
    if (!newTicketSubject.trim()) {
      toast.error('Please enter a subject for your support request')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ticket',
          subject: newTicketSubject,
          description: newTicketDescription,
          priority: newTicketPriority,
          createdById: userId
        })
      })

      if (res.ok) {
        const ticket = await res.json()
        toast.success('Support ticket created successfully')
        setNewTicketSubject('')
        setNewTicketDescription('')
        setNewTicketPriority('MEDIUM')
        setActiveView('list')
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create ticket')
      }
    } catch (error) {
      toast.error('Failed to create ticket')
    } finally {
      setIsLoading(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return
    if (!currentTicket) return

    const content = inputMessage.trim()
    setInputMessage('')
    setSelectedFiles([])

    // Handle file uploads (simulate for now)
    const attachments = selectedFiles.length > 0 
      ? selectedFiles.map(file => URL.createObjectURL(file))
      : undefined

    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          ticketId: currentTicket.id,
          senderId: userId,
          senderType: userRole === 'AGENT' || userRole === 'ADMIN' ? 'AGENT' : 'CUSTOMER',
          content,
          attachments
        })
      })

      if (res.ok) {
        const message = await res.json()
        setMessages(prev => [...prev, message])
        
        // Simulate agent typing indicator for demo
        if (userRole === 'CUSTOMER') {
          setIsTyping(true)
          setTimeout(() => setIsTyping(false), 3000)
        }
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  // Update ticket status
  const updateTicketStatus = async (status: string) => {
    if (!currentTicket) return

    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-ticket',
          ticketId: currentTicket.id,
          status
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setCurrentTicket({ ...currentTicket, status: updated.status })
        toast.success(`Ticket marked as ${status.toLowerCase().replace('_', ' ')}`)
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to update ticket status')
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (files.length > 5) {
        toast.error('Maximum 5 files allowed')
        return
      }
      setSelectedFiles(files)
    }
  }

  // Handle quick response selection
  const handleQuickResponse = (response: QuickResponse) => {
    setInputMessage(response.content)
    setShowQuickResponses(false)
    inputRef.current?.focus()
  }

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 1000)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Get status badge
  const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge className={cn('font-medium', config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  // Get priority badge
  const PriorityBadge = ({ priority }: { priority: keyof typeof priorityConfig }) => {
    const config = priorityConfig[priority]
    const Icon = config.icon
    return (
      <Badge variant="outline" className={cn('font-medium', config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  // Render file attachments
  const FileAttachments = ({ attachments }: { attachments?: string[] }) => {
    if (!attachments || attachments.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((url, index) => {
          const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {isImage ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span>Attachment {index + 1}</span>
            </a>
          )
        })}
      </div>
    )
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 relative"
        >
          <Headphones className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Card className={cn(
      'fixed bottom-6 right-6 shadow-2xl z-50 transition-all duration-300 flex flex-col',
      isMinimized ? 'w-80 h-14' : 'w-[450px] h-[650px]'
    )}>
      {/* Header */}
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-white">Live Support</CardTitle>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">
                {userRole === 'AGENT' || userRole === 'ADMIN' ? 'Agent Dashboard' : 'We\'re here to help'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" color="#fff" /> : <Minimize2 className="h-4 w-4" color="#fff" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" color="#fff" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Ticket List View */}
          {activeView === 'list' && (
            <>
              <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-2 bg-white">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                        <Filter className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className='bg-white hover:bg-black'>
                        <SelectItem value="all">All Tickets</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setActiveView('new')}
                    className="h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Ticket
                  </Button>
                </div>

                {/* Tickets List */}
                <ScrollArea className="flex-1 -mx-4 px-4">
                  <div className="space-y-3">
                    {tickets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No support tickets yet</p>
                        <p className="text-xs mt-1">Create a new ticket to get help</p>
                      </div>
                    ) : (
                      tickets.map(ticket => (
                        <div
                          key={ticket.id}
                          onClick={() => openTicket(ticket)}
                          className="p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 mr-2">
                              <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <StatusBadge status={ticket.status} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={ticket.priority} />
                              {ticket._count && ticket._count.messages > 0 && (
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  {ticket._count.messages} new
                                </Badge>
                              )}
                            </div>
                            {ticket.assignedTo && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-[80px]">{ticket.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          )}

          {/* New Ticket View */}
          {activeView === 'new' && (
            <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveView('list')}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h3 className="font-semibold text-white">Create New Ticket</h3>
              </div>

              <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Subject *</label>
                    <Input
                      placeholder="Brief description of your issue"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white">Priority</label>
                    <Select value={newTicketPriority} onValueChange={(v: any) => setNewTicketPriority(v)}>
                      <SelectTrigger className='bg-white'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Description</label>
                    <Textarea
                      placeholder="Provide more details about your issue..."
                      value={newTicketDescription}
                      onChange={(e) => setNewTicketDescription(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setActiveView('list')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={createTicket}
                      disabled={isLoading || !newTicketSubject.trim()}
                    >
                      {isLoading ? 'Creating...' : 'Create Ticket'}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          )}

          {/* Chat View */}
          {activeView === 'chat' && currentTicket && (
            <>
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setActiveView('list')
                          setCurrentTicket(null)
                          setMessages([])
                        }}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                      </Button>
                      <div>
                        <h4 className="font-medium text-sm">{currentTicket.subject}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={currentTicket.status} />
                          <span className="text-xs text-gray-500">
                            #{currentTicket.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" color="#fff" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {currentTicket.status !== 'RESOLVED' && (
                          <DropdownMenuItem onClick={() => updateTicketStatus('RESOLVED')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </DropdownMenuItem>
                        )}
                        {currentTicket.status === 'RESOLVED' && (
                          <DropdownMenuItem onClick={() => updateTicketStatus('CLOSED')}>
                            <Archive className="w-4 h-4 mr-2" />
                            Close Ticket
                          </DropdownMenuItem>
                        )}
                        {currentTicket.status === 'CLOSED' && (
                          <DropdownMenuItem onClick={() => updateTicketStatus('OPEN')}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Reopen Ticket
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {currentTicket.assignedTo && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>Assigned to:</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                            {currentTicket.assignedTo.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{currentTicket.assignedTo.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Start the conversation below</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isAgent = message.senderType === 'AGENT' || message.senderType === 'SYSTEM'
                        const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              'flex gap-3',
                              isAgent ? '' : 'flex-row-reverse'
                            )}
                          >
                            {showAvatar && (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={isAgent ? '' : ''} />
                                <AvatarFallback className={cn(
                                  'text-xs',
                                  isAgent 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700'
                                )}>
                                  {isAgent ? 'S' : message.sender.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {!showAvatar && <div className="w-8 shrink-0" />}

                            <div className={cn(
                              'max-w-[75%] space-y-1',
                              isAgent ? '' : 'items-end'
                            )}>
                              <div
                                className={cn(
                                  'p-3 rounded-2xl text-sm',
                                  isAgent
                                    ? 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'
                                    : 'bg-blue-600 text-white rounded-tr-none'
                                )}
                              >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <FileAttachments attachments={message.attachments} />
                              </div>
                              <div className={cn(
                                'flex items-center gap-1 text-xs text-gray-400',
                                isAgent ? '' : 'justify-end'
                              )}>
                                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {!isAgent && message.isRead && (
                                  <CheckCheck className="w-3 h-3 text-blue-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            S
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick Action Buttons */}
                <div className="px-4 py-2 border-t bg-gray-50 dark:bg-gray-900 shrink-0">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => updateTicketStatus('RESOLVED')}
                      disabled={['RESOLVED', 'CLOSED'].includes(currentTicket.status)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Issue Resolved
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => {
                        setInputMessage('I need more help with this issue.')
                        inputRef.current?.focus()
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Need More Help
                    </Button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t shrink-0">
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span className="max-w-[100px] truncate">{file.name}</span>
                          <button
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* Quick Responses for Agents */}
                    {(userRole === 'AGENT' || userRole === 'ADMIN') && (
                      <Dialog open={showQuickResponses} onOpenChange={setShowQuickResponses}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Quick Responses</DialogTitle>
                            <DialogDescription>Select a template to insert</DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[400px]">
                            <div className="space-y-2">
                              {quickResponses.map(response => (
                                <button
                                  key={response.id}
                                  onClick={() => handleQuickResponse(response)}
                                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <div className="font-medium text-sm">{response.title}</div>
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{response.content}</div>
                                  {response.category && (
                                    <Badge variant="outline" className="mt-2 text-xs">
                                      {response.category}
                                    </Badge>
                                  )}
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* File Attachment */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={selectedFiles.length >= 5}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>

                    {/* Message Input */}
                    <Input
                      ref={inputRef}
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      className="flex-1"
                      disabled={currentTicket.status === 'CLOSED'}
                    />

                    {/* Send Button */}
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || (!inputMessage.trim() && selectedFiles.length === 0) || currentTicket.status === 'CLOSED'}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {currentTicket.status === 'CLOSED' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      This ticket is closed. Reopen it to send messages.
                    </p>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </>
      )}
    </Card>
  )
}