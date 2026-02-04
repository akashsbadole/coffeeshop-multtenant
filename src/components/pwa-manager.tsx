'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Wifi, WifiOff, Download, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

interface PWAStatus {
  isOnline: boolean
  isInstallable: boolean
  isInstalled: boolean
  isUpdateAvailable: boolean
  registration?: ServiceWorkerRegistration
}

export function PWAManager() {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: true,
    isInstallable: false,
    isInstalled: false,
    isUpdateAvailable: false
  })
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  
  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }))
      toast.success('You are back online')
    }
    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }))
      toast.warning('You are offline. Some features may be limited.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setStatus(prev => ({ ...prev, isOnline: navigator.onLine }))
    
    // Register service worker with error handling
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('SW registered:', registration)
          setStatus(prev => ({ ...prev, registration }))
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setStatus(prev => ({ ...prev, isUpdateAvailable: true }))
                  setShowBanner(true)
                }
              })
            }
          })
        })
        .catch(error => {
          console.warn('SW registration not available:', error.message)
        })
    }
    
    // Handle install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setStatus(prev => ({ ...prev, isInstallable: true }))
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setStatus(prev => ({ ...prev, isInstalled: true }))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setStatus(prev => ({ 
        ...prev, 
        isInstallable: false,
        isInstalled: true 
      }))
      toast.success('App installed successfully!')
      setShowBanner(false)
    }

    setDeferredPrompt(null)
  }

  const handleUpdate = () => {
    if (status.registration?.waiting) {
      status.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const handleClearCache = async () => {
    if (status.registration) {
      status.registration.active?.postMessage({ type: 'CLEAR_CACHE' })
      toast.success('Cache cleared')
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  // Don't show banner if already installed or no update available
  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      {status.isUpdateAvailable ? (
        <Card className="border-2 border-blue-400 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Update Available</h4>
                  <p className="text-xs text-gray-500">A new version of the app is ready</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                >
                  Later
                </Button>
                <Button size="sm" onClick={handleUpdate}>
                  Update Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : status.isInstallable ? (
        <Card className="border-2 border-purple-400 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Download className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Install App</h4>
                  <p className="text-xs text-gray-500">Add to your home screen for offline access</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                >
                  Not Now
                </Button>
                <Button size="sm" onClick={handleInstall}>
                  Install
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" color="#fff" />
      <span className="text-sm font-medium">You are offline. Some features may be limited.</span>
    </div>
  )
}

export function PWADashboard() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false
  })

  useEffect(() => {
    setStatus({
      isOnline: navigator.onLine,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isInstallable: false
    })

    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status.isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
            Connection Status
          </CardTitle>
          <CardDescription>
            {status.isOnline ? 'You are connected to the internet' : 'You are currently offline'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              {status.isOnline ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              <span className="font-medium">Status</span>
            </div>
            <Badge variant={status.isOnline ? 'default' : 'secondary'}>
              {status.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">App Installed</span>
            </div>
            <Badge variant={status.isInstalled ? 'default' : 'secondary'}>
              {status.isInstalled ? 'Yes' : 'No'}
            </Badge>
          </div>

          {!status.isOnline && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Offline Mode Active</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You can still access cached data and continue working. Changes will sync when you're back online.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}