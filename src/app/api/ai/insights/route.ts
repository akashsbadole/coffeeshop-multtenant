import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7')

    // Fetch recent orders for analysis
    const ordersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pos/orders?limit=100`)
    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders')
    }
    const orders = await ordersResponse.json()

    // Fetch menu items for context
    const menuResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pos/menu-items`)
    if (!menuResponse.ok) {
      throw new Error('Failed to fetch menu items')
    }
    const menuItems = await menuResponse.json()

    // Calculate basic statistics
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const filteredOrders = orders.filter((order: any) => new Date(order.createdAt) >= startDate)

    const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
    const totalOrders = filteredOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate top selling items
    const itemSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
    filteredOrders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const itemName = item.menuItem?.name || 'Unknown'
        if (!itemSales[itemName]) {
          itemSales[itemName] = { name: itemName, quantity: 0, revenue: 0 }
        }
        itemSales[itemName].quantity += item.quantity
        itemSales[itemName].revenue += item.subtotal || 0
      })
    })

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate payment method distribution
    const paymentMethods: { [key: string]: number } = {}
    filteredOrders.forEach((order: any) => {
      const method = order.paymentMethod || 'Unknown'
      paymentMethods[method] = (paymentMethods[method] || 0) + order.totalAmount
    })

    // Calculate daily sales trend
    const dailySales: { [key: string]: number } = {}
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dailySales[dateStr] = 0
    }

    filteredOrders.forEach((order: any) => {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0]
      if (dailySales.hasOwnProperty(dateStr)) {
        dailySales[dateStr] += order.totalAmount
      }
    })

    // AI-powered insights generation
    const insights = []

    // Revenue trend analysis
    const salesValues = Object.values(dailySales)
    const avgDailySales = salesValues.reduce((a, b) => a + b, 0) / (days || 1)
    const recentSales = salesValues.slice(0, 3)
    const recentAvg = recentSales.reduce((a, b) => a + b, 0) / (recentSales.length || 1)

    if (recentAvg > avgDailySales * 1.1) {
      insights.push({
        type: 'positive',
        title: 'Sales Trend: Increasing',
        message: `Recent sales are ${((recentAvg / avgDailySales - 1) * 100).toFixed(1)}% above average. Great performance!`,
        recommendation: 'Consider increasing inventory for top-selling items to maintain momentum.'
      })
    } else if (recentAvg < avgDailySales * 0.9) {
      insights.push({
        type: 'warning',
        title: 'Sales Trend: Decreasing',
        message: `Recent sales are ${((1 - recentAvg / avgDailySales) * 100).toFixed(1)}% below average.`,
        recommendation: 'Consider running promotions or analyzing the cause of the decline.'
      })
    } else {
      insights.push({
        type: 'info',
        title: 'Sales Trend: Stable',
        message: 'Sales are consistent with the daily average.',
        recommendation: 'Maintain current operations and consider gradual growth strategies.'
      })
    }

    // Peak hours analysis
    const hourlySales: { [key: number]: number } = {}
    filteredOrders.forEach((order: any) => {
      const hour = new Date(order.createdAt).getHours()
      hourlySales[hour] = (hourlySales[hour] || 0) + order.totalAmount
    })

    const peakHour = Object.entries(hourlySales).sort((a, b) => b[1] - a[1])[0]
    if (peakHour) {
      insights.push({
        type: 'info',
        title: 'Peak Sales Hour',
        message: `Most sales occur around ${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00 with ₹${peakHour[1].toFixed(2)}.`,
        recommendation: 'Ensure sufficient staff and inventory during peak hours.'
      })
    }

    // Top items analysis
    if (topItems.length > 0) {
      const topItemRevenue = topItems[0].revenue
      const topItemPercentage = (topItemRevenue / totalRevenue * 100).toFixed(1)

      insights.push({
        type: 'info',
        title: 'Best Selling Item',
        message: `${topItems[0].name} accounts for ${topItemPercentage}% of total revenue.`,
        recommendation: 'Keep adequate stock and consider creating bundles or promotions around this item.'
      })
    }

    // Payment method analysis
    const totalPayments = Object.values(paymentMethods).reduce((a, b) => a + b, 0)
    const dominantPayment = Object.entries(paymentMethods).sort((a, b) => b[1] - a[1])[0]
    if (dominantPayment && totalPayments > 0) {
      const percentage = (dominantPayment[1] / totalPayments * 100).toFixed(1)
      insights.push({
        type: 'info',
        title: 'Popular Payment Method',
        message: `${dominantPayment[0]} is used for ${percentage}% of transactions.`,
        recommendation: 'Ensure smooth processing for the preferred payment method.'
      })
    }

    // Forecast next week
    const growthRate = recentAvg > 0 ? (recentAvg / avgDailySales) : 1
    const forecastNextWeek = avgDailySales * 7 * growthRate
    insights.push({
      type: 'info',
      title: '7-Day Sales Forecast',
      message: `Based on current trends, expect approximately ₹${forecastNextWeek.toFixed(2)} in revenue next week.`,
      recommendation: 'Plan inventory and staffing accordingly.'
    })

    return NextResponse.json({
      period: `${days} days`,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: averageOrderValue.toFixed(2)
      },
      topItems,
      paymentMethods,
      dailySales: Object.entries(dailySales)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      insights,
      hourlySales
    })
  } catch (error) {
    console.error('AI insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI insights' },
      { status: 500 }
    )
  }
}
