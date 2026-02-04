'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Plus, Package, Barcode, QrCode, RotateCcw } from 'lucide-react'

interface ProductResult {
  found: boolean
  type: 'product' | 'variant'
  data: any
  message?: string
}

interface ScannedProduct {
  id: string
  name: string
  price: number
  category: string
  barcode: string
  sku: string | null
  variantInfo?: {
    size: string | null
    color: string | null
    stockQuantity: number
  }
  quantity: number
}

export function BarcodeScanner() {
  const [barcode, setBarcode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ProductResult | null>(null)
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([])
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle barcode scanner input (USB scanners typically send barcode + Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If not already focused and a barcode scanner is used, it might capture input
      if (e.key === 'Enter' && barcode.length > 0) {
        lookupBarcode()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [barcode])

  const lookupBarcode = async () => {
    if (!barcode.trim()) {
      toast.error('Please enter a barcode')
      return
    }

    setIsLoading(true)
    setLastResult(null)

    try {
      const response = await fetch(`/api/pos/barcode?barcode=${encodeURIComponent(barcode.trim())}`)
      const result: ProductResult = await response.json()
      setLastResult(result)

      if (result.found) {
        toast.success('Product found!')

        // Add to scanned products if not already added
        const existingIndex = scannedProducts.findIndex(
          p => p.barcode === barcode.trim()
        )

        if (existingIndex >= 0) {
          // Increment quantity if already scanned
          const updated = [...scannedProducts]
          updated[existingIndex].quantity += 1
          setScannedProducts(updated)
        } else {
          // Add new product
          let newProduct: ScannedProduct

          if (result.type === 'variant') {
            const variant = result.data
            newProduct = {
              id: variant.id,
              name: variant.menuItem.name,
              price: variant.menuItem.price + variant.priceAdjustment,
              category: variant.menuItem.category.name,
              barcode: variant.barcode,
              sku: variant.sku,
              variantInfo: {
                size: variant.size,
                color: variant.color,
                stockQuantity: variant.stockQuantity
              },
              quantity: 1
            }
          } else {
            const product = result.data
            newProduct = {
              id: product.id,
              name: product.name,
              price: product.price,
              category: product.category.name,
              barcode: product.barcode,
              sku: product.sku,
              quantity: 1
            }
          }

          setScannedProducts([...scannedProducts, newProduct])
        }
      } else {
        toast.error('Product not found')
      }
    } catch (error) {
      console.error('Barcode lookup error:', error)
      toast.error('Failed to lookup barcode')
    } finally {
      setIsLoading(false)
      setBarcode('')
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const incrementQuantity = (index: number) => {
    const updated = [...scannedProducts]
    updated[index].quantity += 1
    setScannedProducts(updated)
  }

  const decrementQuantity = (index: number) => {
    const updated = [...scannedProducts]
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1
      setScannedProducts(updated)
    } else {
      updated.splice(index, 1)
      setScannedProducts(updated)
    }
  }

  const removeProduct = (index: number) => {
    const updated = [...scannedProducts]
    updated.splice(index, 1)
    setScannedProducts(updated)
  }

  const clearAll = () => {
    setScannedProducts([])
    setLastResult(null)
    setBarcode('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const totalItems = scannedProducts.reduce((sum, p) => sum + p.quantity, 0)
  const totalAmount = scannedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barcode Scanner</h2>
          <p className="text-gray-500">Scan products to add to order</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="space-y-6">
          {/* Barcode Input */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-amber-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-6 w-6" />
                Scan Product
              </CardTitle>
              <CardDescription className="text-amber-100">
                Use a barcode scanner or enter barcode manually
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white h-5 w-5" color='#fff' />
                  <Input
                    ref={inputRef}
                    id="barcode"
                    placeholder="Enter or scan barcode..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        lookupBarcode()
                      }
                    }}
                    className="pl-10 h-14 text-lg font-mono text-white"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                <Button
                  onClick={lookupBarcode}
                  disabled={isLoading || !barcode.trim()}
                  className="w-full h-12 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  {isLoading ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" color='#fff' />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Barcode className="h-4 w-4 mr-2" color='#fff' />
                      Lookup Barcode
                    </>
                  )}
                </Button>
              </div>

              {/* Last Result */}
              {lastResult && (
                <div className={`mt-6 p-4 rounded-lg ${
                  lastResult.found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {lastResult.found ? (
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">
                          {lastResult.type === 'variant' ? lastResult.data.menuItem.name : lastResult.data.name}
                        </h4>
                        <p className="text-sm text-green-600">
                          Price: ₹{lastResult.type === 'variant' 
                            ? (lastResult.data.menuItem.price + lastResult.data.priceAdjustment).toFixed(2)
                            : lastResult.data.price.toFixed(2)}
                        </p>
                        {lastResult.type === 'variant' && lastResult.data.size && (
                          <Badge className="mt-1" variant="outline">
                            {lastResult.data.size} / {lastResult.data.color}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Barcode className="h-5 w-5 text-red-600" color='#000' />
                      </div>
                      <div>
                        <h4 className="font-semibold text-black">Product Not Found</h4>
                        <p className="text-sm text-black">{lastResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tips */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Scanner Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use a USB barcode scanner for fastest input</li>
                  <li>• Most scanners automatically submit after scanning</li>
                  <li>• You can also manually type the barcode and press Enter</li>
                  <li>• Ensure the barcode is clearly visible and undamaged</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20">
                  <QrCode className="h-6 w-6 mb-2" color='#fff' />
                  <span className="block text-white">Generate QR</span>
                </Button>
                <Button variant="outline" className="h-20">
                  <Barcode className="h-6 w-6 mb-2" color='#fff' />
                  <span className="block text-white">Print Barcode</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scanned Products Section */}
        <div className="space-y-6">
          {/* Summary */}
          <Card className="shadow-xl border-0 bg-linear-to-r from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100">Total Items</p>
                  <p className="text-3xl font-bold">{totalItems}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-100">Total Amount</p>
                  <p className="text-3xl font-bold">₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scanned Products List */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className='text-white'>Scanned Products</span>
                <Badge variant="secondary" color='#fff'>{scannedProducts.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scannedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Barcode className="h-16 w-16 mx-auto text-gray-300 mb-4" color='#fff' />
                  <h3 className="text-lg font-semibold text-white">No products scanned</h3>
                  <p className="text-white mt-1">Scan a barcode to add products</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-125 overflow-y-auto">
                  {scannedProducts.map((product, index) => (
                    <div
                      key={`${product.id}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{product.category}</span>
                          {product.variantInfo && (
                            <>
                              <span>•</span>
                              <span>
                                {product.variantInfo.size} {product.variantInfo.color}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-medium text-amber-600 mt-1">
                          ₹{product.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => decrementQuantity(index)}
                            className="h-8 w-8"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {product.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => incrementQuantity(index)}
                            className="h-8 w-8"
                          >
                            +
                          </Button>
                        </div>
                        <div className="text-right min-w-20">
                          <p className="font-bold text-gray-900">
                            ₹{(product.price * product.quantity).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add to Order Button */}
              {scannedProducts.length > 0 && (
                <Button
                  className="w-full mt-4 h-12 bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  onClick={() => {
                    toast.success(`Added ${totalItems} items to order`)
                    clearAll()
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Order - ₹{totalAmount.toFixed(2)}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
