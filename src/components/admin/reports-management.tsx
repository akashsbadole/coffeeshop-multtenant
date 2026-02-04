'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, CreditCard } from 'lucide-react'

interface ReportData {
  reportType: string
  reportPeriod?: { startDate: string; endDate: string }
  summary: any
  groupedBy?: string
  groupedData?: any[]
  peakHours?: any[]
  growth?: { period: string; growth: string; trend: string } | null
  items?: any[]
  paymentMethods?: any[]
  customers?: any[]
  generatedAt: string
}

function ReportsManagement() {
  const [activeReport, setActiveReport] = useState('sales')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [groupBy, setGroupBy] = useState('day')

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeReport,
        startDate: startDate || '',
        endDate: endDate || '',
        groupBy
      })
      const response = await fetch(`/api/reports/custom?${params}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [activeReport, groupBy])

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num)
  }

  const exportReport = () => {
    if (!reportData) return
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">View sales, inventory, and business reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport} disabled={!reportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchReport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-white'>Report Filters</CardTitle>
        </CardHeader>
        <CardContent className='text-white'>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
            <div>
              <label className="text-sm font-medium mb-1 block text-white">Report Type</label>
              <Select value={activeReport} onValueChange={setActiveReport}>
                <SelectTrigger className='text-white'>
                  <SelectValue className='text-white' />
                </SelectTrigger>
                <SelectContent className='text-white'>
                  <SelectItem value="sales" className='text-white'>Sales Report</SelectItem>
                  <SelectItem value="items" className='text-white'>Items Report</SelectItem>
                  <SelectItem value="inventory" className='text-white'>Inventory Report</SelectItem>
                  <SelectItem value="payments" className='text-white'>Payments Report</SelectItem>
                  <SelectItem value="customers" className='text-white'>Customers Report</SelectItem>
                  <SelectItem value="comprehensive" className='text-white'>Comprehensive Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Group By</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="item">Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
              <CardTitle>{reportData.reportType}</CardTitle>
              <CardDescription className="text-blue-100">
                {reportData.reportPeriod?.startDate !== 'All time'
                  ? `Period: ${reportData.reportPeriod?.startDate} to ${reportData.reportPeriod?.endDate}`
                  : 'All Time'}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportData.summary.totalRevenue !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" color='#fff' />
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{formatCurrency(reportData.summary.totalRevenue)}</p>
                </CardContent>
              </Card>
            )}
            {reportData.summary.totalOrders !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-500" color='#fff' />
                    <span className="text-sm text-muted-foreground">Total Orders</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{reportData.summary.totalOrders}</p>
                </CardContent>
              </Card>
            )}
            {reportData.summary.totalCustomers !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" color='#fff' />
                    <span className="text-sm text-muted-foreground">Customers</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{reportData.summary.totalCustomers}</p>
                </CardContent>
              </Card>
            )}
            {reportData.summary.averageOrderValue !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" color='#fff' />
                    <span className="text-sm text-muted-foreground">Avg Order Value</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{formatCurrency(reportData.summary.averageOrderValue)}</p>
                </CardContent>
              </Card>
            )}
            {reportData.summary.totalAmount !== undefined && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-500" color='#fff' />
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{formatCurrency(reportData.summary.totalAmount)}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {reportData.growth && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {reportData.growth.trend === 'increasing' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" color='#fff' />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" color='#fff' />
                  )}
                  <span className="text-sm text-muted-foreground">Growth Trend</span>
                </div>
                <p className="text-2xl font-bold mt-2 text-white">{reportData.growth.growth}</p>
                <p className="text-sm text-muted-foreground">{reportData.growth.period}</p>
              </CardContent>
            </Card>
          )}

          {reportData.groupedData && reportData.groupedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Grouped Data ({reportData.groupedBy})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">{reportData.groupedBy === 'day' ? 'Date' : reportData.groupedBy === 'week' ? 'Week' : reportData.groupedBy === 'month' ? 'Month' : 'Name'}</th>
                        <th className="text-right py-2 px-4">Orders</th>
                        <th className="text-right py-2 px-4">Revenue</th>
                        <th className="text-right py-2 px-4">GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.groupedData.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{item.date || item.week || item.month || item.name}</td>
                          <td className="text-right py-2 px-4">{item.orders || 0}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(item.revenue)}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(item.gst || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.items && reportData.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Item</th>
                        <th className="text-right py-2 px-4">Quantity Sold</th>
                        <th className="text-right py-2 px-4">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.items.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{item.name}</td>
                          <td className="text-right py-2 px-4">{item.quantitySold}</td>
                          <td className="text-right py-2 px-4">{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.paymentMethods && reportData.paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.paymentMethods.map((method: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{method.method}</span>
                        <span className="text-sm text-muted-foreground">{method.percentage}%</span>
                      </div>
                      <p className="text-lg font-bold mt-1">{formatCurrency(method.amount)}</p>
                      <p className="text-sm text-muted-foreground">{method.count} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.peakHours && reportData.peakHours.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.peakHours.map((hour: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{hour.hour}</span>
                      <span className="font-medium">{formatCurrency(hour.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No report data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReportsManagement
