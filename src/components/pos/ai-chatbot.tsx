'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  Package, 
  DollarSign,
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'insight' | 'suggestion'
}

interface AIResponse {
  content: string
  type: 'text' | 'insight' | 'suggestion'
  action?: string
}

// AI Response patterns and handlers
const getAIResponse = async (message: string): Promise<AIResponse> => {
  const lowerMessage = message.toLowerCase()
  
  // Sales related queries
  if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('today')) {
    try {
      const response = await fetch('/api/reports/sales?range=7d')
      const data = await response.json()
      const totalSales = data.summary?.totalSales || 0
      const orderCount = data.summary?.totalOrders || 0
      
      return {
        content: `📊 **Sales Summary (Last 7 Days)**\n\n• Total Sales: ₹${totalSales.toLocaleString()}\n• Orders: ${orderCount}\n• Average Order Value: ₹${orderCount > 0 ? (totalSales / orderCount).toFixed(2) : '0.00'}\n\nWould you like to see a detailed breakdown?`,
        type: 'insight',
        action: 'view-sales-report'
      }
    } catch (error) {
      return {
        content: "I'm having trouble fetching the sales data right now. Please try again in a moment.",
        type: 'text'
      }
    }
  }
  
  // Inventory queries
  if (lowerMessage.includes('stock') || lowerMessage.includes('inventory') || lowerMessage.includes('low stock')) {
    try {
      const response = await fetch('/api/inventory/low-stock?critical=true')
      const data = await response.json()
      const alerts = data.alerts || []
      
      if (alerts.length === 0) {
        return {
          content: "✅ Good news! All items are well-stocked. No low stock alerts at the moment.",
          type: 'insight'
        }
      }
      
      return {
        content: `⚠️ **Low Stock Alerts**\n\n${alerts.slice(0, 5).map((a: any) => `• ${a.name}: ${a.currentQuantity} remaining (reorder at ${a.reorderLevel})`).join('\n')}\n\n${alerts.length > 5 ? `...and ${alerts.length - 5} more items` : ''}`,
        type: 'suggestion',
        action: 'view-inventory'
      }
    } catch (error) {
      return {
        content: "I can't check the inventory right now. Please visit the Inventory tab for current stock levels.",
        type: 'text'
      }
    }
  }
  
  // Popular items
  if (lowerMessage.includes('popular') || lowerMessage.includes('best seller') || lowerMessage.includes('top')) {
    try {
      const response = await fetch('/api/reports/items')
      const data = await response.json()
      const topItems = data.items?.slice(0, 5) || []
      
      return {
        content: `🏆 **Top Selling Items**\n\n${topItems.map((item: any, i: number) => `${i + 1}. ${item.name} - ${item.quantitySold} sold (₹${item.revenue.toLocaleString()})`).join('\n')}`,
        type: 'insight',
        action: 'view-items-report'
      }
    } catch (error) {
      return {
        content: "Here are some of our popular items based on recent sales data. Check the Items Report for more details!",
        type: 'text'
      }
    }
  }
  
  // Help and guidance
  if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('guide')) {
    return {
      content: "🤝 **I can help you with:**\n\n• Sales reports and revenue analysis\n• Stock levels and low inventory alerts\n• Top-selling items and trends\n• Order information\n• General POS operations\n\nJust ask me anything about your business!",
      type: 'text'
    }
  }
  
  // Greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      content: "👋 Hello! I'm your AI assistant. I can help you with sales insights, inventory checks, and answering questions about your POS system. What would you like to know?",
      type: 'text'
    }
  }
  
  // Default response
  return {
    content: "I'm not sure I understood that. Try asking about:\n• Today's sales or revenue\n• Low stock items\n• Popular products\n• Or type 'help' for more options",
    type: 'text'
  }
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your AI assistant. I can help you check sales, inventory, and answer questions about your business. What would you like to know?",
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await getAIResponse(userMessage.content)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        type: response.type
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      toast.error('Failed to get AI response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    { label: "Today's Sales", query: "What are today's sales?" },
    { label: 'Low Stock', query: 'Show low stock items' },
    { label: 'Popular Items', query: 'What are the popular items?' },
    { label: 'Help', query: 'What can you help me with?' }
  ]

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-50"
      >
        <Bot className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-2xl z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
    }`}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Online</span>
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
            <span className="text-lg">×</span>
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="p-4 flex flex-col h-[calc(100%-140px)]">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" color="#fff" />
                      ) : (
                        <Sparkles className="h-4 w-4" color="#fff" />
                      )}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.type === 'insight' && (
                        <Badge variant="secondary" className="mt-2 bg-white/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Insight
                        </Badge>
                      )}
                      {message.type === 'suggestion' && (
                        <Badge variant="secondary" className="mt-2 bg-white/20">
                          <Package className="h-3 w-3 mr-1" />
                          Suggestion
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <Sparkles className="h-4 w-4" color="#fff" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
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

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInputMessage(action.query)
                    inputRef.current?.focus()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>

          <div className="p-4 pt-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask about sales, inventory, or anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" color="#fff" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
