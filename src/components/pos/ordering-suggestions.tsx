'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  ShoppingCart, 
  Sparkles, 
  TrendingUp, 
  Package, 
  Clock,
  ArrowRight,
  X,
  Info
} from 'lucide-react'

interface Suggestion {
  id: string
  type: 'upsell' | 'bundle' | 'popular' | 'frequent' | 'seasonal'
  title: string
  description: string
  items: Array<{
    menuItemId: string
    name: string
    price: number
  }>
  discount?: number
  confidence: number
  reason: string
  expiresAt?: string
}

interface OrderingSuggestionsProps {
  onAddItem: (itemId: string) => void
  onAddBundle: (items: string[]) => void
}

export function OrderingSuggestions({ onAddItem, onAddBundle }: OrderingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = (itemId: string) => {
    onAddItem(itemId)
    toast.success('Item added to cart')
  }

  const handleAddBundle = (suggestion: Suggestion) => {
    const itemIds = suggestion.items.map(item => item.menuItemId)
    onAddBundle(itemIds)
    toast.success('Bundle added to cart')
  }

  const handleDismiss = (suggestionId: string) => {
    setDismissed(prev => new Set([...prev, suggestionId]))
  }

  const visibleSuggestions = showAll 
    ? suggestions.filter(s => !dismissed.has(s.id))
    : suggestions.filter(s => !dismissed.has(s.id)).slice(0, 3)

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'upsell': return <TrendingUp className="h-4 w-4" color="#fff" />
      case 'bundle': return <Package className="h-4 w-4" color="#fff" />
      case 'popular': return <Sparkles className="h-4 w-4" color="#fff" />
      case 'frequent': return <Clock className="h-4 w-4" color="#fff" />
      case 'seasonal': return <Package className="h-4 w-4" color="#fff" />
      default: return <Sparkles className="h-4 w-4" color="#fff" />
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'upsell': return 'from-purple-500 to-purple-600'
      case 'bundle': return 'from-orange-500 to-orange-600'
      case 'popular': return 'from-green-500 to-green-600'
      case 'frequent': return 'from-blue-500 to-blue-600'
      case 'seasonal': return 'from-pink-500 to-pink-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Loading suggestions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Smart Suggestions</h3>
          <Badge variant="secondary" className="text-xs">
            {visibleSuggestions.length}
          </Badge>
        </div>
        {suggestions.filter(s => !dismissed.has(s.id)).length > 3 && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="text-xs"
          >
            See All
          </Button>
        )}
        {showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(false)}
            className="text-xs"
          >
            Show Less
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <Card 
            key={suggestion.id}
            className="border-l-4 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: suggestion.confidence > 0.8 ? '#22c55e' : '#f59e0b' }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`bg-gradient-to-r ${getSuggestionColor(suggestion.type)} p-1.5 rounded-lg`}>
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                      <p className="text-xs text-gray-500">{suggestion.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    {suggestion.items.map((item, index) => (
                      <div 
                        key={item.menuItemId}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{index + 1}.</span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">₹{item.price.toFixed(2)}</span>
                          {suggestion.type !== 'bundle' && (
                            <Button
                              size="sm"
                              onClick={() => handleAddItem(item.menuItemId)}
                              className="h-7 text-xs"
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {suggestion.discount && (
                    <div className="mt-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Save {suggestion.discount}%
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <Info className="h-3 w-3" />
                    <span>{suggestion.reason}</span>
                  </div>

                  {suggestion.expiresAt && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        Offer expires {new Date(suggestion.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(suggestion.id)}
                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {suggestion.type === 'bundle' && (
                <div className="mt-4 pt-3 border-t">
                  <Button
                    className="w-full"
                    onClick={() => handleAddBundle(suggestion)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add Bundle to Cart
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}