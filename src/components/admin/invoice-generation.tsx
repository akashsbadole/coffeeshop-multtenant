'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Receipt, Printer, Download, IndianRupee, Package, X, Search } from 'lucide-react'

interface OrderItem {
  menuItem: {
    name: string
    price: number
    hsnCode: string | null
  }
  quantity: number
  price: number
  gstRate: string
  gstAmount: number
  subtotal: number
}

interface Order {
  id: string
  orderNumber: string
  subtotal: number
  totalGst: number
  sgst: number
  cgst: number
  totalAmount: number
  status: string
  paymentMethod: string
  notes: string | null
  createdAt: string
  items: OrderItem[]
  customer: {
    name: string | null
    phone: string | null
  } | null
}

interface InvoiceGenerationProps {
  order: Order
  onClose: () => void
}

export function InvoiceGeneration({ order, onClose }: InvoiceGenerationProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 500)
  }

  const handleDownload = () => {
    const invoiceContent = generateInvoiceContent()
    const blob = new Blob([invoiceContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice_${order.orderNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Invoice downloaded successfully')
  }

  const generateInvoiceContent = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${order.orderNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #d97706;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #d97706;
            margin-bottom: 5px;
        }
        .invoice-title {
            font-size: 24px;
            margin: 20px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-section h3 {
            color: #d97706;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background: #fef3c7;
            color: #92400e;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #d97706;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .totals-section {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .total-row.final {
            font-size: 24px;
            font-weight: bold;
            color: #d97706;
            border-top: 2px solid #d97706;
            padding-top: 15px;
            margin-top: 15px;
        }
        .gst-section {
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Coffee Shop POS</div>
        <div>India GST Compliant System</div>
    </div>

    <h1 class="invoice-title">Invoice #${order.orderNumber}</h1>

    <div class="info-grid">
        <div class="info-section">
            <h3>BILL TO:</h3>
            ${order.customer?.name ? `<p><strong>${order.customer.name}</strong></p>` : '<p>Walk-in Customer</p>'}
            ${order.customer?.phone ? `<p>Phone: ${order.customer.phone}</p>` : ''}
        </div>
        <div class="info-section">
            <h3>INVOICE DETAILS:</h3>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod}</p>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Price (₹)</th>
                <th>GST %</th>
                <th>GST (₹)</th>
                <th>Total (₹)</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => `
            <tr>
                <td><strong>${item.menuItem.name}</strong></td>
                <td>${item.menuItem.hsnCode || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.gstRate.replace('_', ' ')}</td>
                <td>${item.gstAmount.toFixed(2)}</td>
                <td><strong>${item.subtotal.toFixed(2)}</strong></td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="gst-section">
            <div class="total-row">
                <span>CGST (${((order.totalGst/2)/order.subtotal*100).toFixed(1)}%):</span>
                <span>₹${order.cgst.toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>SGST (${((order.totalGst/2)/order.subtotal*100).toFixed(1)}%):</span>
                <span>₹${order.sgst.toFixed(2)}</span>
            </div>
        </div>
        <div class="total-row final">
            <span>Grand Total:</span>
            <span>₹${order.totalAmount.toFixed(2)}</span>
        </div>
    </div>

    ${order.notes ? `
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
        <strong>Order Notes:</strong>
        <p>${order.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
        <p>Thank you for your order!</p>
        <p>For any queries, contact: +91 98765 43210</p>
        <p>Generated by Coffee Shop POS - India GST Compliant</p>
    </div>
</body>
</html>
    `
  }

  return (
    <DialogContent className="max-w-4xl border-0 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-7 w-7" />
              Invoice #{order.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              GST Compliant Bill
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white border-0 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Invoice Header */}
            <div className="text-center pb-6 border-b-2 border-amber-300">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Coffee Shop POS
              </h2>
              <p className="text-sm text-gray-600 mt-1">India GST Compliant System</p>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  BILL TO
                </h3>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="font-semibold text-lg">
                    {order.customer?.name || 'Walk-in Customer'}
                  </p>
                  {order.customer?.phone && (
                    <p className="text-sm text-gray-600 mt-1">{order.customer.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  INVOICE DETAILS
                </h3>
                <div className="bg-amber-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="bg-green-600">{order.status}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment:</span>
                    <Badge className="bg-blue-600">{order.paymentMethod}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 px-4 py-3 grid grid-cols-8 gap-2 text-sm font-semibold text-gray-700">
                <div>Item</div>
                <div>HSN Code</div>
                <div>Qty</div>
                <div>Price (₹)</div>
                <div>GST %</div>
                <div>GST (₹)</div>
                <div>Total (₹)</div>
              </div>
              <div className="divide-y divide-amber-200">
                {order.items.map((item, index) => (
                  <div key={index} className="px-4 py-3 grid grid-cols-8 gap-2 text-sm hover:bg-amber-50 transition-colors">
                    <div className="font-medium">{item.menuItem.name}</div>
                    <div className="text-gray-600">{item.menuItem.hsnCode || 'N/A'}</div>
                    <div className="font-semibold">{item.quantity}</div>
                    <div>₹{item.price.toFixed(2)}</div>
                    <div>
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                        {item.gstRate.replace('_', ' ')}%
                      </Badge>
                    </div>
                    <div className="text-green-600">₹{item.gstAmount.toFixed(2)}</div>
                    <div className="font-bold">₹{item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-300">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-green-700">
                    <span>CGST ({((order.totalGst/2)/order.subtotal*100).toFixed(1)}%):</span>
                    <span className="font-semibold">₹{order.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-700">
                    <span>SGST ({((order.totalGst/2)/order.subtotal*100).toFixed(1)}%):</span>
                    <span className="font-semibold">₹{order.sgst.toFixed(2)}</span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent pt-3">
                  <span>Grand Total:</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Order Notes:</h4>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
              <p className="font-medium mb-1">Thank you for your order!</p>
              <p>For any queries, contact: +91 98765 43210</p>
              <p className="text-xs mt-2">Generated by Coffee Shop POS - India GST Compliant</p>
            </div>
          </div>
        </ScrollArea>
      </div>

      <DialogFooter className="gap-3 p-6 border-t-2 border-amber-200 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 h-12 border-amber-200 hover:bg-amber-50"
        >
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
        <Button
          onClick={handleDownload}
          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          onClick={handlePrint}
          disabled={isPrinting}
          className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
        >
          <Printer className="h-4 w-4 mr-2" />
          {isPrinting ? 'Printing...' : 'Print Invoice'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
