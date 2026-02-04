import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContextFromEmail } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantContextFromEmail(email)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    const userId = searchParams.get('userId')

    if (!paymentId && !userId) {
      return NextResponse.json({ error: 'Payment ID or User ID required' }, { status: 400 })
    }

    if (paymentId) {
      const payment = await db.salaryPayment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            include: {
              organization: true
            }
          },
          staffSalary: true
        }
      })

      if (!payment) {
        return NextResponse.json({ error: 'Salary payment not found' }, { status: 404 })
      }

      const salarySlip = generateSalarySlip(payment)
      return NextResponse.json(salarySlip)
    }

    if (userId) {
      const payments = await db.salaryPayment.findMany({
        where: { userId },
        include: {
          user: {
            include: { organization: true }
          },
          staffSalary: true
        },
        orderBy: { periodEnd: 'desc' },
        take: 12
      })

      const slips = payments.map(p => generateSalarySlip(p))
      return NextResponse.json(slips)
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error generating salary slip:', error)
    return NextResponse.json({ error: 'Failed to generate salary slip' }, { status: 500 })
  }
}

function generateSalarySlip(payment: any) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const basicSalary = payment.basicSalary || 0
  const allowances = payment.allowances || 0
  const grossSalary = payment.grossSalary || 0
  const deductions = payment.deductions || 0
  const netSalary = payment.netSalary || 0

  return {
    slipId: `SAL-${payment.id.substring(0, 8).toUpperCase()}`,
    organization: {
      name: payment.user?.organization?.name || 'Coffee Shop',
      address: payment.user?.organization?.address || '',
      gstin: payment.user?.organization?.gstin || ''
    },
    employee: {
      name: payment.user?.name || 'Staff Member',
      email: payment.user?.email || '',
      role: payment.user?.role || ''
    },
    salaryPeriod: {
      start: formatDate(payment.periodStart),
      end: formatDate(payment.periodEnd)
    },
    earnings: {
      basicSalary: { label: 'Basic Salary', amount: basicSalary },
      regularHours: { label: 'Regular Hours', amount: payment.regularHours || 0, isHours: true },
      overtime: { label: 'Overtime Hours', amount: payment.overtimeHours || 0, isHours: true },
      allowances: {
        label: 'Allowances',
        breakdown: {
          da: 'Dearness Allowance',
          hra: 'House Rent Allowance',
          transport: 'Transport Allowance',
          medical: 'Medical Allowance',
          other: 'Other Allowances'
        },
        total: allowances
      },
      grossSalary: { label: 'Gross Salary', amount: grossSalary, isBold: true }
    },
    deductions: {
      providentFund: { label: 'Provident Fund', amount: (payment.staffSalary?.pfContribution || 0) * basicSalary / 100 },
      esi: { label: 'ESI', amount: (payment.staffSalary?.esiContribution || 0) * basicSalary / 100 },
      tax: { label: 'Tax Deduction', amount: (payment.staffSalary?.taxDeduction || 0) * basicSalary / 100 },
      total: { label: 'Total Deductions', amount: deductions, isBold: true }
    },
    netSalary: {
      label: 'Net Salary Payable',
      amount: netSalary,
      inWords: numberToWords(netSalary)
    },
    paymentDetails: {
      paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : 'Pending',
      paymentMethod: payment.paymentMethod || 'Pending',
      transactionId: payment.transactionId || 'N/A'
    },
    generatedAt: new Date().toISOString(),
    footer: 'This is a computer-generated salary slip. No signature required.'
  }
}

function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const scales = ['', 'Thousand', 'Lakh', 'Crore']

  if (amount === 0) return 'Zero'

  let rupees = Math.floor(amount)
  let paise = Math.round((amount - rupees) * 100)

  let words = ''
  let scaleIndex = 0

  while (rupees > 0) {
    let chunk = rupees % 1000
    if (chunk !== 0) {
      let chunkWords = ''
      let hundreds = Math.floor(chunk / 100)
      let remainder = chunk % 100

      if (hundreds > 0) {
        chunkWords += ones[hundreds] + ' Hundred '
      }

      if (remainder < 20) {
        chunkWords += ones[remainder]
      } else {
        chunkWords += tens[Math.floor(remainder / 10)]
        if (remainder % 10 > 0) {
          chunkWords += ' ' + ones[remainder % 10]
        }
      }

      words = chunkWords + ' ' + scales[scaleIndex] + ' ' + words
    }
    rupees = Math.floor(rupees / 1000)
    scaleIndex++
  }

  words = words.trim() + ' Rupees'

  if (paise > 0) {
    words += ' and ' + (paise < 20 ? ones[paise] : tens[Math.floor(paise / 10)] + ' ' + ones[paise % 10]) + ' Paise'
  }

  return words
}
