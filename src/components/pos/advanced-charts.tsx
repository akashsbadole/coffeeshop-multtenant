'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { RefreshCw, Download, TrendingUp, TrendingDown, DollarSign, Users, Package } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts'

interface SalesChartData {
  date: string
  sales: number
  orders: number
  customers: number
}

interface CategoryChartData {
  name: string
  value: number
  percentage: number
}

interface HourlyChartData {
  hour: string
  sales: number
  orders: number
}

interface PaymentChartData {
  method: string
  amount: number
  count: number
}

const COLORS = ['#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#6366f1', '#ec4899']

export function AdvancedCharts() {
  const [salesData, setSalesData] = useState<SalesChartData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryChartData[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyChartData[]>([])
  const [paymentData, setPaymentData] = useState<PaymentChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchChartData()
  }, [timeRange])

  const fetchChartData = async () => {
    setIsLoading(true)
    try {
      // Fetch sales trends
      const salesResponse = await fetch(`/api/reports/sales?range=${timeRange}`)
      if (salesResponse.ok) {
        const data = await salesResponse.json()
        setSalesData(data.dailyData || [])
      }

      // Fetch category distribution
      const categoryResponse = await fetch('/api/reports/items')
      if (categoryResponse.ok) {
        const data = await categoryResponse.json()
        const categoryMap = new Map()
        
        data.items?.forEach((item: any) => {
          const category = item.category || 'Uncategorized'
          const current = categoryMap.get(category) || { value: 0, count: 0 }
          categoryMap.set(category, {
            value: current.value + (item.revenue || 0),
            count: current.count + 1
          })
        })

        const total = Array.from(categoryMap.values()).reduce((sum: number, cat: any) => sum + cat.value, 0)
        const categoryChartData = Array.from(categoryMap.entries()).map(([name, data]: [string, any]) => ({
          name,
          value: data.value,
          percentage: total > 0 ? Math.round((data.value / total) * 100) : 0
        })).sort((a: any, b: any) => b.value - a.value)

        setCategoryData(categoryChartData)
      }

      // Fetch hourly data
      const hourlyResponse = await fetch('/api/reports/sales?breakdown=hourly')
      if (hourlyResponse.ok) {
        const data = await hourlyResponse.json()
        setHourlyData(data.hourlyData || [])
      }

      // Fetch payment methods
      const paymentResponse = await fetch('/api/reports/payments')
      if (paymentResponse.ok) {
        const data = await paymentResponse.json()
        setPaymentData(data.methods || [])
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      toast.error('Failed to load chart data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportChartData = () => {
    const exportData = {
      salesTrend: salesData,
      categoryDistribution: categoryData,
      hourlyBreakdown: hourlyData,
      paymentMethods: paymentData,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Chart data exported successfully')
  }

  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0)
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Advanced Analytics</h2>
          <p className="text-gray-500">Visualize your business performance with interactive charts</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={fetchChartData}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={exportChartData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">₹{totalSales.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{totalOrders.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Order Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">₹{avgOrderValue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold">{categoryData.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <Tabs defaultValue="sales" className="h-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Trend</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="h-[500px]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Sales & Orders Trend</CardTitle>
              <CardDescription>Daily sales and order volume over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'sales' ? `₹${value.toLocaleString()}` : value,
                      name === 'sales' ? 'Sales' : 'Orders'
                    ]}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.3}
                    name="Sales"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Orders"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="h-[500px]">
          <div className="grid grid-cols-2 gap-4 h-full">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Sales distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Revenue per category with comparison</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hourly" className="h-[500px]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Hourly Sales Pattern</CardTitle>
              <CardDescription>Peak hours and daily sales patterns</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: any) => [
                    name === 'sales' ? `₹${value.toLocaleString()}` : value,
                    name === 'sales' ? 'Sales' : 'Orders'
                  ]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Sales"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="h-[500px]">
          <div className="grid grid-cols-2 gap-4 h-full">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any, props: any) => {
                      const method = props?.payload?.method || ''
                      return [`₹${value.toLocaleString()}`, method]
                    }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Count</CardTitle>
                <CardDescription>Number of transactions by method</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
