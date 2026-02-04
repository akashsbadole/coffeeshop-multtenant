'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  AlertTriangle, 
  Package, 
  RefreshCw, 
  CheckCircle, 
  X,
  Bell,
  ArrowRight
} from 'lucide-react'
import { useLowStockStore } from '@/store/low-stock'

export function LowStockBadge() {
  const { summary, fetchAlerts } = useLowStockStore()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchAlerts(true) // Fetch critical only initially
    
    // Poll for new alerts every 5 minutes
    const interval = setInterval(() => {
      fetchAlerts(true)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchAlerts])

  const totalAlerts = summary?.totalAlerts || 0
  const criticalAlerts = (summary?.critical || 0) + (summary?.outOfStock || 0)

  if (totalAlerts === 0) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative bg-white/20 hover:bg-white/30 text-white"
      >
        <Bell className="h-5 w-5" />
        {criticalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {criticalAlerts}
          </span>
        )}
      </Button>

      {isOpen && <LowStockAlertsPanel onClose={() => setIsOpen(false)} />}
    </>
  )
}

interface LowStockAlertsPanelProps {
  onClose: () => void
}

export function LowStockAlertsPanel({ onClose }: LowStockAlertsPanelProps) {
  const { alerts, summary, isLoading, fetchAlerts, dismissAlert, acknowledgeAlert } = useLowStockStore()

  useEffect(() => {
    fetchAlerts() // Fetch all alerts when panel opens
  }, [fetchAlerts])

  const handleDismiss = (id: string) => {
    dismissAlert(id)
    toast.success('Alert dismissed')
  }

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id, 'Acknowledged by user')
    toast.success('Alert acknowledged')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'bg-red-600'
      case 'critical':
        return 'bg-orange-500'
      case 'low':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'Out of Stock'
      case 'critical':
        return 'Critical'
      case 'low':
        return 'Low Stock'
      default:
        return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>
                  {summary ? (
                    <span className="flex items-center gap-2">
                      {summary.critical > 0 && (
                        <Badge variant="destructive">{summary.critical} Critical</Badge>
                      )}
                      {summary.outOfStock > 0 && (
                        <Badge variant="destructive" className="bg-red-600">
                          {summary.outOfStock} Out of Stock
                        </Badge>
                      )}
                      {summary.low > 0 && (
                        <Badge variant="secondary">{summary.low} Low</Badge>
                      )}
                    </span>
                  ) : (
                    'Monitor your inventory levels'
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchAlerts()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" color="#fff" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">All Stock Levels Normal</p>
                <p className="text-gray-500">No low stock alerts at this time</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-800">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(alert.status)}>
                            {getStatusLabel(alert.status)}
                          </Badge>
                          <span className="text-sm text-gray-500">{alert.category}</span>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{alert.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-gray-400" />
                            Current: <strong className={alert.currentQuantity === 0 ? 'text-red-600' : ''}>
                              {alert.currentQuantity}
                            </strong>
                          </span>
                          <span className="text-gray-400">|</span>
                          <span>
                            Reorder at: <strong>{alert.reorderLevel}</strong>
                          </span>
                          {alert.sku && (
                            <>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-500">SKU: {alert.sku}</span>
                            </>
                          )}
                        </div>
                        {alert.lastRestocked && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last restocked: {new Date(alert.lastRestocked).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ack
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <Button variant="outline" className="w-full" onClick={onClose}>
              View Full Inventory
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
