import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  customerId: z.string().optional(),
  category: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  excludeOrdered: z.coerce.boolean().default(false)
})

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

interface Suggestion {
  menuItemId: string
  name: string
  reason: string
  confidence: number
  category: 'popular_with_customer' | 'time_based_popular' | 'complementary' | 'seasonal_trend' | 'trending'
  price: number
  categoryName: string
}

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = querySchema.parse({
      customerId: searchParams.get('customerId') || undefined,
      category: searchParams.get('category') || undefined,
      timeOfDay: searchParams.get('timeOfDay') as TimeOfDay || undefined,
      limit: searchParams.get('limit') || '10',
      excludeOrdered: searchParams.get('excludeOrdered') === 'true'
    })

    const suggestions: Suggestion[] = []
    const currentHour = new Date().getHours()
    const currentTimeOfDay = params.timeOfDay || getTimeOfDay(currentHour)
    const currentSeason = getCurrentSeason()

    const allMenuItems = await db.menuItem.findMany({
      where: {
        isAvailable: true,
        isActive: true,
        ...(params.category && {
          category: { name: params.category }
        })
      },
      include: { category: true }
    })

    if (allMenuItems.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const allOrders = await db.order.findMany({
      where: {
        status: { in: ['COMPLETED', 'READY'] },
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        items: {
          include: { menuItem: { include: { category: true } } }
        }
      }
    })

    let customerOrders: typeof allOrders = []
    let customerItemFrequency: Map<string, { count: number; lastOrdered: Date }> = new Map()

    if (params.customerId) {
      customerOrders = await db.order.findMany({
        where: {
          customerId: params.customerId,
          status: { in: ['COMPLETED', 'READY'] }
        },
        include: {
          items: {
            include: { menuItem: { include: { category: true } } }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      customerOrders.forEach(order => {
        order.items.forEach(item => {
          const existing = customerItemFrequency.get(item.menuItemId)
          if (existing) {
            existing.count++
            if (new Date(order.createdAt) > existing.lastOrdered) {
              existing.lastOrdered = new Date(order.createdAt)
            }
          } else {
            customerItemFrequency.set(item.menuItemId, {
              count: 1,
              lastOrdered: new Date(order.createdAt)
            })
          }
        })
      })

      const sortedCustomerItems = Array.from(customerItemFrequency.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)

      sortedCustomerItems.forEach(([menuItemId, data]) => {
        const menuItem = allMenuItems.find(item => item.id === menuItemId)
        if (menuItem) {
          const daysSinceLastOrder = Math.floor(
            (Date.now() - data.lastOrdered.getTime()) / (1000 * 60 * 60 * 24)
          )
          const recencyBoost = daysSinceLastOrder < 7 ? 0.1 : daysSinceLastOrder < 30 ? 0.05 : 0
          const confidence = Math.min(0.95, 0.5 + data.count * 0.1 + recencyBoost)

          suggestions.push({
            menuItemId,
            name: menuItem.name,
            reason: `Customer ordered this ${data.count} time${data.count > 1 ? 's' : ''} before${daysSinceLastOrder < 30 ? ', recently' : ''}`,
            confidence,
            category: 'popular_with_customer',
            price: menuItem.price,
            categoryName: menuItem.category?.name || 'General'
          })
        }
      })
    }

    const timeBasedOrders = allOrders.filter(order => {
      const orderHour = new Date(order.createdAt).getHours()
      const orderTimeOfDay = getTimeOfDay(orderHour)
      return orderTimeOfDay === currentTimeOfDay
    })

    const timeBasedItemCounts = new Map<string, { count: number; revenue: number }>()
    timeBasedOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = timeBasedItemCounts.get(item.menuItemId)
        if (existing) {
          existing.count += item.quantity
          existing.revenue += item.subtotal
        } else {
          timeBasedItemCounts.set(item.menuItemId, {
            count: item.quantity,
            revenue: item.subtotal
          })
        }
      })
    })

    const sortedTimeBasedItems = Array.from(timeBasedItemCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)

    sortedTimeBasedItems.forEach(([menuItemId, data]) => {
      if (!suggestions.find(s => s.menuItemId === menuItemId)) {
        const menuItem = allMenuItems.find(item => item.id === menuItemId)
        if (menuItem) {
          const totalItemsInTimeSlot = Array.from(timeBasedItemCounts.values())
            .reduce((sum, item) => sum + item.count, 0)
          const popularityRate = totalItemsInTimeSlot > 0 ? data.count / totalItemsInTimeSlot : 0
          const confidence = Math.min(0.9, 0.4 + popularityRate * 2)

          suggestions.push({
            menuItemId,
            name: menuItem.name,
            reason: `Popular during ${currentTimeOfDay} (${data.count} orders)`,
            confidence,
            category: 'time_based_popular',
            price: menuItem.price,
            categoryName: menuItem.category?.name || 'General'
          })
        }
      }
    })

    if (params.customerId && customerOrders.length > 0) {
      const recentOrderItems = customerOrders[0]?.items.map(item => item.menuItemId) || []

      if (recentOrderItems.length > 0) {
        const complementaryPairs = new Map<string, { count: number; pairedWith: string }>()

        allOrders.forEach(order => {
          const orderItemIds = order.items.map(item => item.menuItemId)
          const hasRecentItem = recentOrderItems.some(id => orderItemIds.includes(id))

          if (hasRecentItem) {
            order.items.forEach(item => {
              if (!recentOrderItems.includes(item.menuItemId)) {
                const existing = complementaryPairs.get(item.menuItemId)
                if (existing) {
                  existing.count++
                } else {
                  complementaryPairs.set(item.menuItemId, {
                    count: 1,
                    pairedWith: recentOrderItems.find(id => orderItemIds.includes(id)) || ''
                  })
                }
              }
            })
          }
        })

        const sortedComplementary = Array.from(complementaryPairs.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)

        sortedComplementary.forEach(([menuItemId, data]) => {
          if (!suggestions.find(s => s.menuItemId === menuItemId)) {
            const menuItem = allMenuItems.find(item => item.id === menuItemId)
            const pairedItem = allMenuItems.find(item => item.id === data.pairedWith)
            if (menuItem && pairedItem) {
              const confidence = Math.min(0.85, 0.3 + data.count * 0.05)

              suggestions.push({
                menuItemId,
                name: menuItem.name,
                reason: `Often ordered with ${pairedItem.name} (${data.count} times)`,
                confidence,
                category: 'complementary',
                price: menuItem.price,
                categoryName: menuItem.category?.name || 'General'
              })
            }
          }
        })
      }
    }

    const trendingItems = new Map<string, { count: number; trend: number }>()
    const recentWindow = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const previousWindow = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt)
      order.items.forEach(item => {
        const existing = trendingItems.get(item.menuItemId)
        if (orderDate >= recentWindow) {
          if (existing) {
            existing.count += item.quantity
            existing.trend += 1
          } else {
            trendingItems.set(item.menuItemId, { count: item.quantity, trend: 1 })
          }
        } else if (orderDate >= previousWindow && orderDate < recentWindow) {
          if (existing) {
            existing.trend -= 0.5
          }
        }
      })
    })

    const sortedTrending = Array.from(trendingItems.entries())
      .filter(([_, data]) => data.trend > 0)
      .sort((a, b) => b[1].trend - a[1].trend)
      .slice(0, 5)

    sortedTrending.forEach(([menuItemId, data]) => {
      if (!suggestions.find(s => s.menuItemId === menuItemId)) {
        const menuItem = allMenuItems.find(item => item.id === menuItemId)
        if (menuItem) {
          const confidence = Math.min(0.8, 0.3 + data.trend * 0.1)

          suggestions.push({
            menuItemId,
            name: menuItem.name,
            reason: `Trending now (${data.count} orders this week)`,
            confidence,
            category: 'trending',
            price: menuItem.price,
            categoryName: menuItem.category?.name || 'General'
          })
        }
      }
    })

    const seasonalKeywords: Record<string, string[]> = {
      spring: ['fresh', 'spring', 'salad', 'light', 'green'],
      summer: ['cold', 'ice', 'cool', 'summer', 'refreshing', 'lemon', 'mango'],
      autumn: ['warm', 'spiced', 'pumpkin', 'autumn', 'cozy', 'hot'],
      winter: ['hot', 'warm', 'soup', 'winter', 'spiced', 'chocolate', 'coffee']
    }

    const seasonalItems = allMenuItems.filter(item => {
      const itemName = item.name.toLowerCase()
      const itemDesc = (item.description || '').toLowerCase()
      const keywords = seasonalKeywords[currentSeason]
      return keywords.some(keyword => itemName.includes(keyword) || itemDesc.includes(keyword))
    })

    seasonalItems.slice(0, 3).forEach(menuItem => {
      if (!suggestions.find(s => s.menuItemId === menuItem.id)) {
        suggestions.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          reason: `Perfect for ${currentSeason} season`,
          confidence: 0.6,
          category: 'seasonal_trend',
          price: menuItem.price,
          categoryName: menuItem.category?.name || 'General'
        })
      }
    })

    let filteredSuggestions = suggestions

    if (params.excludeOrdered && params.customerId) {
      const orderedItemIds = new Set(customerItemFrequency.keys())
      filteredSuggestions = suggestions.filter(s => !orderedItemIds.has(s.menuItemId))
    }

    const finalSuggestions = filteredSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, params.limit)

    return NextResponse.json({
      suggestions: finalSuggestions,
      meta: {
        totalSuggestions: suggestions.length,
        returnedCount: finalSuggestions.length,
        customerId: params.customerId || null,
        currentTimeOfDay,
        currentSeason,
        categoryFilter: params.category || null,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    console.error('AI suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
