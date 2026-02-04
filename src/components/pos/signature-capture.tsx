'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Pen, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  RefreshCw,
  FileText
} from 'lucide-react'

interface Signature {
  id: string
  orderId: string
  signatureData: string
  signedAt: string
  signedBy: string
  isValid: boolean
  ipAddress?: string
  deviceInfo?: string
}

interface SignatureCaptureProps {
  orderId: string
  orderNumber: string
  totalAmount: number
  onSignatureSaved?: (signature: Signature) => void
}

export function SignatureCapture({ orderId, orderNumber, totalAmount, onSignatureSaved }: SignatureCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [signatureData, setSignatureData] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<string[]>([])
  const [showOptions, setShowOptions] = useState(false)
  
  // Signature capture settings
  const [penColor, setPenColor] = useState('#000000')
  const [penWidth, setPenWidth] = useState(2)
  const [showSignatureGuide, setShowSignatureGuide] = useState(false)
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw')

  const [clearHistory, setClearHistory] = useState(false)
  // const historyRef = useRef<string[]>([])

  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width - 32
        canvas.height = 300
        redrawCanvas()
      }
    }
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (canvas && signatureData) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = signatureData
      }
    }
  }

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureType !== 'draw') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Save current state to history before starting new stroke
    if (hasSignature) {
      const currentData = canvas.toDataURL()
      historyRef.current = [...historyRef.current, currentData]
      setCanUndo(true)
    }

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureType !== 'draw') return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    setHasSignature(true)
  }

  const handleStopDrawing = () => {
    setIsDrawing(false)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (signatureType !== 'draw') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (hasSignature) {
      const currentData = canvas.toDataURL()
      historyRef.current = [...historyRef.current, currentData]
      setCanUndo(true)
    }

    setIsDrawing(true)
    const touch = e.touches[0]
    const rect = canvas?.getBoundingClientRect()
    if (!rect) return
    
    ctx.beginPath()
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureType !== 'draw') return

    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const touch = e.touches[0]
    const rect = canvas?.getBoundingClientRect()
    if (!rect) return
    
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    setHasSignature(true)
  }

  const handleTouchEnd = () => {
    setIsDrawing(false)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      // Save current state to history before clearing
      if (hasSignature) {
        const currentData = canvas.toDataURL()
        historyRef.current = [...historyRef.current, currentData]
        setCanUndo(true)
      }

      if (canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      setSignatureData('')
      setHasSignature(false)
    }
  }

  const handleUndo = () => {
    if (historyRef.current.length > 0) {
      historyRef.current.pop()
      const previousData = historyRef.current[historyRef.current.length - 1]
      
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas?.width, canvas?.height)
          ctx.drawImage(img, 0, 0)
        }
        img.src = previousData
      }

      // Update canUndo state
      setCanUndo(historyRef.current.length > 0)
      setHasSignature(true)
    }
  }

  const handleSave = async () => {
    if (!hasSignature) {
      toast.error('Please provide your signature first')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')
    setSignatureData(imageData)
    setHasSignature(true)

    if (onSignatureSaved) {
      const signature: Signature = {
        id: Date.now().toString(),
        orderId,
        signatureData: imageData,
        signedAt: new Date().toISOString(),
        signedBy: 'current-user',
        isValid: true
      }
      
      try {
        const response = await fetch('/api/digital-signatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            signatureData: imageData,
            deviceInfo: JSON.stringify({
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              screenResolution: `${window.screen.width}x${window.screen.height}`
            })
          })
        })

        if (response.ok) {
          const data = await response.json()
          onSignatureSaved(data.signature)
          toast.success('Signature saved successfully')
          setIsOpen(false)
          setIsSaving(false)
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to save signature')
          setIsSaving(false)
        }
      } catch (error) {
        toast.error('Failed to save signature')
        setIsSaving(false)
      }
    }
  }

  const handleTypeSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsSaving(true)
    try {
      // Simulate AI typing detection (would use actual API in production)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const imageData = canvas.toDataURL('image/png')
      setSignatureData(imageData)
      setHasSignature(true)
      setShowOptions(false)
      setIsSaving(false)
      
      toast.success('Signature processed successfully')
    } catch (error) {
      toast.error('Failed to process signature')
      setIsSaving(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Digital Signature
            </DialogTitle>
            <DialogDescription>
              Order #{orderNumber} - {totalAmount} Total
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Signature Guide */}
            {!hasSignature && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Need a Signature</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Please sign in the box below to confirm this order. Your signature will be legally binding.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 mt-2"
                      onClick={() => setShowSignatureGuide(!showSignatureGuide)}
                    >
                      {showSignatureGuide ? 'Hide Guide' : 'Show Guide'}
                    </Button>
                  </div>
                </div>

                {showSignatureGuide && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <h5 className="font-semibold mb-2">Signature Guidelines:</h5>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Sign inside the designated box</li>
                      <li>• Use your normal signature as you would on a receipt</li>
                      <li>• Ensure the signature is clear and legible</li>
                      <li>• Draw continuously for a smooth line</li>
                      <li>• Use the stylus/pen tools for best results</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Canvas */}
            <div className="border-2 rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                onMouseDown={handleStartDrawing}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDrawing}
                onMouseLeave={handleStopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
              />
            </div>

            {/* Options */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium mb-2">Pen Color:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPenColor('#000000')}
                      className={`w-8 h-8 rounded border-2 ${penColor === '#000000' ? 'ring-2 ring-offset-2' : ''}`}
                      style={{ backgroundColor: '#000000' }}
                    />
                    <button
                      onClick={() => setPenColor('#2563eb')}
                      className={`w-8 h-8 rounded border-2 ${penColor === '#2563eb' ? 'ring-2 ring-offset-2' : ''}`}
                      style={{ backgroundColor: '#2563eb' }}
                    />
                    <button
                      onClick={() => setPenColor('#059669')}
                      className={`w-8 h-8 rounded border-2 ${penColor === '#059669' ? 'ring-2 ring-offset-2' : ''}`}
                      style={{ backgroundColor: '#059669' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2">Pen Width:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPenWidth(1)}
                      className={`w-12 h-8 rounded border-2 ${penWidth === 1 ? 'ring-2 ring-offset-2' : ''}`}
                    >
                      <div className="h-0.5 bg-current" style={{ width: '100%' }} />
                    </button>
                    <button
                      onClick={() => setPenWidth(2)}
                      className={`w-12 h-8 rounded border-2 ${penWidth === 2 ? 'ring-2 ring-offset-2' : ''}`}
                    >
                      <div className="h-1.5 bg-current" style={{ width: '100%' }} />
                    </button>
                    <button
                      onClick={() => setPenWidth(3)}
                      className={`w-12 h-8 rounded border-2 ${penWidth === 3 ? 'ring-2 ring-offset-2' : ''}`}
                    >
                      <div className="h-2.5 bg-current" style={{ width: '100%' }} />
                    </button>
                    <button
                      onClick={() => setPenWidth(4)}
                      className={`w-12 h-8 rounded border-2 ${penWidth === 4 ? 'ring-2 ring-offset-2' : ''}`}
                    >
                      <div className="h-3.5 bg-current" style={{ width: '100%' }} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={!hasSignature}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p><strong>By signing, you agree to:</strong></p>
                <ul className="mt-1 space-y-1">
                  <li>Confirm the order details are correct</li>
                  <li>Accept the terms and conditions</li>
                  <li>Authorize the transaction</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasSignature}
            >
              {isSaving ? 'Saving...' : 'Save Signature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="h-14 w-14 rounded-full"
        title="Add Digital Signature"
      >
        <Pen className="h-6 w-6" />
      </Button>
    </>
  )
}