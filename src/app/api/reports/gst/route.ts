import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'GSTR1' // GSTR1, GSTR3B
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch orders
    const ordersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pos/orders?limit=1000`)
    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders')
    }
    const orders = await ordersResponse.json()

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

    // Calculate GST totals by rate
    const gstByRate: { [key: string]: {
      taxableValue: number
      cgst: number
      sgst: number
      totalGst: number
      totalAmount: number
      itemCount: number
    } } = {}

    filteredOrders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const gstRate = item.gstRate || '0'
        if (!gstByRate[gstRate]) {
          gstByRate[gstRate] = {
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            totalGst: 0,
            totalAmount: 0,
            itemCount: 0
          }
        }

        const subtotal = item.subtotal || (item.price * item.quantity)
        const gstAmount = item.gstAmount || 0

        gstByRate[gstRate].taxableValue += subtotal - gstAmount
        gstByRate[gstRate].cgst += order.cgst ? (order.cgst / order.items.length) : gstAmount / 2
        gstByRate[gstRate].sgst += order.sgst ? (order.sgst / order.items.length) : gstAmount / 2
        gstByRate[gstRate].totalGst += gstAmount
        gstByRate[gstRate].totalAmount += subtotal
        gstByRate[gstRate].itemCount += item.quantity
      })
    })

    // Generate report based on type
    if (reportType === 'GSTR1') {
      return NextResponse.json(generateGSTR1(filteredOrders, gstByRate, startDate, endDate))
    } else if (reportType === 'GSTR3B') {
      return NextResponse.json(generateGSTR3B(filteredOrders, gstByRate, startDate, endDate))
    } else {
      return NextResponse.json({
        type: reportType,
        error: 'Invalid report type. Use GSTR1 or GSTR3B'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('GST report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate GST report' },
      { status: 500 }
    )
  }
}

function generateGSTR1(orders: any[], gstByRate: any, startDate?: string, endDate?: string) {
  // B2B Invoices (In this POS, all are B2C, but structure is ready)
  const b2bInvoices = []

  // B2C Large (Orders > ₹2.5 lakh)
  const b2cLargeInvoices = orders.filter((order: any) => order.totalAmount > 250000).map((order: any) => ({
    invoiceNumber: order.orderNumber,
    invoiceDate: new Date(order.createdAt).toISOString().split('T')[0],
    customerName: order.customerName || 'Walk-in Customer',
    customerGSTIN: 'URP', // Unregistered Person
    totalAmount: order.totalAmount,
    taxableValue: order.subtotal,
    cgst: order.cgst,
    sgst: order.sgst,
    totalGst: order.totalGst,
    placeOfSupply: '22-Maharashtra'
  }))

  // B2C Small (Orders ≤ ₹2.5 lakh)
  const b2cSmallTotal = orders.filter((order: any) => order.totalAmount <= 250000).reduce((sum: number, order: any) => {
    return sum + (order.subtotal || 0)
  }, 0)

  const b2cSmallGst = orders.filter((order: any) => order.totalAmount <= 250000).reduce((sum: number, order: any) => {
    return sum + (order.totalGst || 0)
  }, 0)

  // Summary by GST Rate
  const rateSummary = Object.entries(gstByRate).map(([rate, data]: [string, any]) => ({
    gstRate: `${rate}%`,
    taxableValue: data.taxableValue.toFixed(2),
    totalAmount: data.totalAmount.toFixed(2),
    cgst: data.cgst.toFixed(2),
    sgst: data.sgst.toFixed(2),
    totalGst: data.totalGst.toFixed(2),
    itemCount: data.itemCount
  }))

  return {
    reportType: 'GSTR-1',
    reportPeriod: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    summary: {
      totalInvoices: orders.length,
      totalTaxableValue: orders.reduce((sum: number, order: any) => sum + (order.subtotal || 0), 0).toFixed(2),
      totalCGST: orders.reduce((sum: number, order: any) => sum + (order.cgst || 0), 0).toFixed(2),
      totalSGST: orders.reduce((sum: number, order: any) => sum + (order.sgst || 0), 0).toFixed(2),
      totalIGST: 0, // Intra-state only
      totalAmount: orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0).toFixed(2)
    },
    sections: {
      b2b: {
        description: 'B2B - Registered Taxable Person Supplies',
        invoices: b2bInvoices
      },
      b2cLarge: {
        description: 'B2C (Large) - Unregistered Persons > ₹2.5 Lakh',
        invoices: b2cLargeInvoices,
        total: b2cLargeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)
      },
      b2cSmall: {
        description: 'B2C (Small) - Unregistered Persons ≤ ₹2.5 Lakh',
        totalTaxableValue: b2cSmallTotal.toFixed(2),
        totalGst: b2cSmallGst.toFixed(2),
        totalAmount: (b2cSmallTotal + b2cSmallGst).toFixed(2),
        placeOfSupply: '22-Maharashtra',
        itemCount: orders.filter((order: any) => order.totalAmount <= 250000).length
      },
      rateSummary: {
        description: 'Summary by GST Rate',
        rates: rateSummary
      }
    },
    generatedAt: new Date().toISOString(),
    gstin: '22AAAAA0000A1Z5 (Demo)',
    legalName: 'Coffee Shop POS Demo',
    tradeName: 'Coffee Shop POS'
  }
}

function generateGSTR3B(orders: any[], gstByRate: any, startDate?: string, endDate?: string) {
  // Calculate totals
  const totalSales = orders.reduce((sum: number, order: any) => sum + (order.subtotal || 0), 0)
  const totalCGST = orders.reduce((sum: number, order: any) => sum + (order.cgst || 0), 0)
  const totalSGST = orders.reduce((sum: number, order: any) => sum + (order.sgst || 0), 0)
  const totalIGST = 0 // Intra-state only
  const totalAmount = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)

  // Reverse charge (not applicable for this POS)
  const reverseCharge = 0

  // Non-GST supplies (not applicable)
  const nonGstSupplies = 0

  // Inter-state supplies to unregistered persons
  const interstateSupplies = 0

  // Ineligible ITC (not applicable)
  const ineligibleITC = 0

  // Tax payable
  const taxPayable = {
    cgst: totalCGST.toFixed(2),
    sgst: totalSGST.toFixed(2),
    igst: totalIGST.toFixed(2),
    cess: 0 // No cess in this POS
  }

  return {
    reportType: 'GSTR-3B',
    reportPeriod: {
      startDate: startDate || 'All time',
      endDate: endDate || 'Present'
    },
    part1: {
      summary: {
        outwardSupplies: {
          totalSales: totalSales.toFixed(2),
          totalCGST: totalCGST.toFixed(2),
          totalSGST: totalSGST.toFixed(2),
          totalIGST: totalIGST.toFixed(2),
          totalCess: 0
        },
        inwardSupplies: {
          eligibleITC: 0, // Not tracking purchases
          ineligibleITC: ineligibleITC.toFixed(2)
        }
      }
    },
    part2: {
      detailsOfOutwardSupplies: {
        totalSales: totalSales.toFixed(2),
        zeroRatedSupplies: 0,
        otherNilRatedSupplies: 0,
        nonGstSupplies: nonGstSupplies.toFixed(2)
      },
      detailsOfInwardSupplies: {
        interstateSupplies: interstateSupplies.toFixed(2),
        reverseCharge: reverseCharge.toFixed(2)
      },
      detailsOfITC: {
        totalITC: 0,
        ineligibleITC: ineligibleITC.toFixed(2)
      }
    },
    part3: {
      taxPayable: {
        totalCGST: totalCGST.toFixed(2),
        totalSGST: totalSGST.toFixed(2),
        totalIGST: totalIGST.toFixed(2),
        totalCess: 0,
        total: (totalCGST + totalSGST + totalIGST).toFixed(2)
      },
      taxPaidThroughCash: {
        cgst: totalCGST.toFixed(2),
        sgst: totalSGST.toFixed(2),
        igst: totalIGST.toFixed(2),
        cess: 0,
        total: (totalCGST + totalSGST + totalIGST).toFixed(2)
      },
      taxPaidThroughITC: {
        cgst: 0,
        sgst: 0,
        igst: 0,
        cess: 0,
        total: 0
      }
    },
    part4: {
      tdsCredit: 0,
      tdsDebit: 0
    },
    part5: {
      interestAndLateFees: {
        interest: 0,
        lateFees: 0,
        total: 0
      }
    },
    summary: {
      totalInvoices: orders.length,
      totalSales: totalSales.toFixed(2),
      totalGstLiability: (totalCGST + totalSGST).toFixed(2),
      totalAmountPayable: (totalCGST + totalSGST).toFixed(2)
    },
    rateBreakdown: Object.entries(gstByRate).map(([rate, data]: [string, any]) => ({
      gstRate: `${rate}%`,
      taxableValue: data.taxableValue.toFixed(2),
      cgst: data.cgst.toFixed(2),
      sgst: data.sgst.toFixed(2),
      totalGst: data.totalGst.toFixed(2)
    })),
    generatedAt: new Date().toISOString(),
    gstin: '22AAAAA0000A1Z5 (Demo)',
    legalName: 'Coffee Shop POS Demo',
    tradeName: 'Coffee Shop POS'
  }
}
