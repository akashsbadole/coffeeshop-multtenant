import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'sales' // sales, inventory, items, payments, customers
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month, category, item, payment

    // Fetch orders
    const ordersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pos/orders?limit=1000`)
    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders')
    }
    const orders = await ordersResponse.json()

    // Fetch menu items
    const menuResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pos/menu-items`)
    if (!menuResponse.ok) {
      throw new Error('Failed to fetch menu items')
    }
    const menuItems = await menuResponse.json()

    // Filter by date range if provided
    let filteredOrders = orders
    if (startDate) {
      filteredOrders = filteredOrders.filter((order: any) =>
        new Date(order.createdAt) >= new Date(startDate)
      )
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      filteredOrders = filteredOrders.filter((order: any) =>
        new Date(order.createdAt) <= endDateTime
      )
    }

    // Generate report based on type
    switch (reportType) {
      case 'sales':
        return NextResponse.json(generateSalesReport(filteredOrders, groupBy, startDate, endDate))
      case 'inventory':
        return NextResponse.json(generateInventoryReport(orders, menuItems))
      case 'items':
        return NextResponse.json(generateItemsReport(filteredOrders, menuItems, groupBy))
      case 'payments':
        return NextResponse.json(generatePaymentsReport(filteredOrders, groupBy, startDate, endDate))
      case 'customers':
        return NextResponse.json(generateCustomersReport(filteredOrders))
      case 'comprehensive':
        return NextResponse.json(generateComprehensiveReport(filteredOrders, menuItems, groupBy, startDate, endDate))
      default:
        return NextResponse.json({
          error: 'Invalid report type. Use: sales, inventory, items, payments, customers, or comprehensive'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Custom report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate custom report' },
      { status: 500 }
    )
  }
}

function generateSalesReport(orders: any[], groupBy: string, startDate?: string, endDate?: string) {
  // Calculate basic sales metrics
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
  const totalSubtotal = orders.reduce((sum: number, order: any) => sum + (order.subtotal || 0), 0)
  const totalGST = orders.reduce((sum: number, order: any) => sum + (order.totalGst || 0), 0)
  const totalOrders = orders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Group sales based on groupBy parameter
  let groupedData: any[] = []

  if (groupBy === 'day') {
    const salesByDay: { [key: string]: any } = {}
    orders.forEach((order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      if (!salesByDay[date]) {
        salesByDay[date] = { date, orders: 0, revenue: 0, gst: 0 }
      }
      salesByDay[date].orders++
      salesByDay[date].revenue += order.totalAmount
      salesByDay[date].gst += order.totalGst || 0
    })
    groupedData = Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date))
  } else if (groupBy === 'week') {
    const salesByWeek: { [key: string]: any } = {}
    orders.forEach((order: any) => {
      const date = new Date(order.createdAt)
      const weekNumber = getWeekNumber(date)
      const year = date.getFullYear()
      const weekKey = `${year}-W${weekNumber}`
      if (!salesByWeek[weekKey]) {
        salesByWeek[weekKey] = { week: weekKey, orders: 0, revenue: 0, gst: 0 }
      }
      salesByWeek[weekKey].orders++
      salesByWeek[weekKey].revenue += order.totalAmount
      salesByWeek[weekKey].gst += order.totalGst || 0
    })
    groupedData = Object.values(salesByWeek)
  } else if (groupBy === 'month') {
    const salesByMonth: { [key: string]: any } = {}
    orders.forEach((order: any) => {
      const date = new Date(order.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!salesByMonth[monthKey]) {
        salesByMonth[monthKey] = { month: monthKey, orders: 0, revenue: 0, gst: 0 }
      }
      salesByMonth[monthKey].orders++
      salesByMonth[monthKey].revenue += order.totalAmount
      salesByMonth[monthKey].gst += order.totalGst || 0
    })
    groupedData = Object.values(salesByMonth)
  }

  // Calculate peak hours
  const hourlySales: { [key: number]: number } = {}
  orders.forEach((order: any) => {
    const hour = new Date(order.createdAt).getHours()
    hourlySales[hour] = (hourlySales[hour] || 0) + order.totalAmount
  })
  const peakHours = Object.entries(hourlySales)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([hour, revenue]) => ({
      hour: `${hour}:00 - ${parseInt(hour) + 1}:00`,
      revenue: revenue.toFixed(2)
    }))

  return {
    reportType: 'Sales Report',
    reportPeriod: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    summary: {
      totalRevenue: totalRevenue.toFixed(2),
      totalSubtotal: totalSubtotal.toFixed(2),
      totalGST: totalGST.toFixed(2),
      totalOrders,
      averageOrderValue: averageOrderValue.toFixed(2),
      averageOrdersPerDay: (totalOrders / (groupBy === 'day' ? groupedData.length || 1 : 1)).toFixed(2)
    },
    groupedBy: groupBy,
    groupedData,
    peakHours,
    growth: calculateGrowth(groupedData),
    generatedAt: new Date().toISOString()
  }
}

function generateInventoryReport(orders: any[], menuItems: any[]) {
  // Calculate item usage from orders
  const itemUsage: { [key: string]: {
    id: string
    name: string
    category: string
    quantitySold: number
    revenue: number
    lastSold: string | null
  } } = {}

  orders.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const itemName = item.menuItem?.name || item.name
      const itemId = item.menuItemId || item.id
      const category = item.menuItem?.category?.name || 'Unknown'

      if (!itemUsage[itemId]) {
        itemUsage[itemId] = {
          id: itemId,
          name: itemName,
          category,
          quantitySold: 0,
          revenue: 0,
          lastSold: null
        }
      }

      itemUsage[itemId].quantitySold += item.quantity
      itemUsage[itemId].revenue += item.subtotal || (item.price * item.quantity)
      itemUsage[itemId].lastSold = order.createdAt
    })
  })

  // Match with current menu
  const inventoryItems = menuItems.map((menuItem: any) => {
    const usage = itemUsage[menuItem.id] || { quantitySold: 0, revenue: 0, lastSold: null }
    return {
      id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category?.name || 'Unknown',
      price: menuItem.price,
      quantitySold: usage.quantitySold,
      revenue: usage.revenue.toFixed(2),
      lastSold: usage.lastSold,
      isAvailable: menuItem.isAvailable,
      recommendation: generateInventoryRecommendation(usage.quantitySold, menuItem.isAvailable)
    }
  })

  return {
    reportType: 'Inventory Report',
    summary: {
      totalItems: menuItems.length,
      availableItems: menuItems.filter((m: any) => m.isAvailable).length,
      unavailableItems: menuItems.filter((m: any) => !m.isAvailable).length,
      totalQuantitySold: Object.values(itemUsage).reduce((sum: number, item: any) => sum + item.quantitySold, 0)
    },
    items: inventoryItems.sort((a, b) => b.quantitySold - a.quantitySold),
    generatedAt: new Date().toISOString()
  }
}

function generateItemsReport(orders: any[], menuItems: any[], groupBy: string) {
  const itemSales: { [key: string]: any } = {}

  orders.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const itemName = item.menuItem?.name || item.name
      const key = groupBy === 'category' ? (item.menuItem?.category?.name || 'Unknown') : itemName

      if (!itemSales[key]) {
        itemSales[key] = {
          name: key,
          quantitySold: 0,
          revenue: 0,
          orders: 0
        }
      }

      itemSales[key].quantitySold += item.quantity
      itemSales[key].revenue += item.subtotal || (item.price * item.quantity)
      itemSales[key].orders++
    })
  })

  return {
    reportType: 'Items Report',
    groupBy,
    items: Object.values(itemSales)
      .sort((a: any, b: any) => b.revenue - a.revenue),
    summary: {
      totalUniqueItems: Object.keys(itemSales).length,
      totalQuantity: Object.values(itemSales).reduce((sum: number, item: any) => sum + item.quantitySold, 0),
      topPerformer: Object.values(itemSales).sort((a: any, b: any) => b.revenue - a.revenue)[0]
    },
    generatedAt: new Date().toISOString()
  }
}

function generatePaymentsReport(orders: any[], groupBy: string, startDate?: string, endDate?: string) {
  const paymentStats: { [key: string]: {
    count: number
    amount: number
    percentage: number
  } } = {}

  const totalAmount = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)

  orders.forEach((order: any) => {
    const method = order.paymentMethod || 'CASH'
    if (!paymentStats[method]) {
      paymentStats[method] = { count: 0, amount: 0, percentage: 0 }
    }
    paymentStats[method].count++
    paymentStats[method].amount += order.totalAmount
  })

  // Calculate percentages
  Object.keys(paymentStats).forEach(method => {
    paymentStats[method].percentage = (paymentStats[method].amount / totalAmount * 100)
  })

  return {
    reportType: 'Payments Report',
    reportPeriod: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    summary: {
      totalAmount: totalAmount.toFixed(2),
      totalTransactions: orders.length,
      averageTransaction: orders.length > 0 ? (totalAmount / orders.length).toFixed(2) : 0
    },
    paymentMethods: Object.entries(paymentStats).map(([method, stats]: [string, any]) => ({
      method,
      count: stats.count,
      amount: stats.amount.toFixed(2),
      percentage: stats.percentage.toFixed(2)
    })),
    generatedAt: new Date().toISOString()
  }
}

function generateCustomersReport(orders: any[]) {
  const customers: { [key: string]: any } = {}

  orders.forEach((order: any) => {
    const phone = order.customerPhone || 'Walk-in'
    const name = order.customerName || 'Guest'

    if (!customers[phone]) {
      customers[phone] = {
        phone,
        name,
        orders: 0,
        totalAmount: 0,
        lastOrder: null,
        firstOrder: null
      }
    }

    customers[phone].orders++
    customers[phone].totalAmount += order.totalAmount

    const orderDate = new Date(order.createdAt)
    if (!customers[phone].lastOrder || orderDate > new Date(customers[phone].lastOrder)) {
      customers[phone].lastOrder = order.createdAt
    }
    if (!customers[phone].firstOrder || orderDate < new Date(customers[phone].firstOrder)) {
      customers[phone].firstOrder = order.createdAt
    }
  })

  const customerList = Object.values(customers).sort((a, b) => b.totalAmount - a.totalAmount)

  return {
    reportType: 'Customers Report',
    summary: {
      totalCustomers: Object.keys(customers).length,
      totalOrders: orders.reduce((sum: number, customer: any) => sum + customer.orders, 0),
      averageOrdersPerCustomer: Object.keys(customers).length > 0
        ? (orders.reduce((sum: number, customer: any) => sum + customer.orders, 0) / Object.keys(customers).length).toFixed(2)
        : 0,
      topCustomer: customerList[0]
    },
    customers: customerList,
    generatedAt: new Date().toISOString()
  }
}

function generateComprehensiveReport(orders: any[], menuItems: any[], groupBy: string, startDate?: string, endDate?: string) {
  return {
    reportType: 'Comprehensive Business Report',
    reportPeriod: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    sales: generateSalesReport(orders, groupBy, startDate, endDate),
    inventory: generateInventoryReport(orders, menuItems),
    items: generateItemsReport(orders, menuItems, 'category'),
    payments: generatePaymentsReport(orders, groupBy, startDate, endDate),
    customers: generateCustomersReport(orders),
    summary: {
      totalRevenue: orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0).toFixed(2),
      totalOrders: orders.length,
      uniqueCustomers: Object.keys(orders.reduce((acc: any, order: any) => {
        const phone = order.customerPhone || 'Walk-in'
        acc[phone] = true
        return acc
      }, {})).length,
      averageOrderValue: orders.length > 0
        ? (orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0) / orders.length).toFixed(2)
        : 0
    },
    generatedAt: new Date().toISOString()
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function calculateGrowth(data: any[]): { period: string; growth: string; trend: string } | null {
  if (data.length < 2) return null

  const latest = data[data.length - 1].revenue
  const previous = data[data.length - 2].revenue

  if (previous === 0) return null

  const growth = ((latest - previous) / previous * 100).toFixed(2)
  const trend = parseFloat(growth) >= 0 ? 'increasing' : 'decreasing'

  return {
    period: data.length >= 2 ? `Compare last 2 periods` : 'N/A',
    growth: `${trend === 'increasing' ? '+' : ''}${growth}%`,
    trend
  }
}

function generateInventoryRecommendation(quantitySold: number, isAvailable: boolean): string {
  if (!isAvailable && quantitySold > 0) {
    return 'Consider making available - has sales history'
  } else if (isAvailable && quantitySold === 0) {
    return 'No sales - consider reviewing pricing or marketing'
  } else if (quantitySold > 10) {
    return 'High performer - ensure adequate stock'
  } else if (quantitySold > 5) {
    return 'Good performer'
  } else {
    return 'Monitor sales'
  }
}
