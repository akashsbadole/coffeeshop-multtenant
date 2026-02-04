import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Salary Management API
 * Handles staff salary profiles, salary calculations, and payments
 */

// GET - Fetch salary profiles and payment history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'profile' or 'payments'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    if (type === 'profile' || !type) {
      // Fetch salary profiles
      const where: any = {}
      if (userId) where.userId = userId

      const profiles = await db.staffSalary.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!type) {
        return NextResponse.json({ profiles })
      }

      return NextResponse.json(profiles)
    }

    if (type === 'payments') {
      // Fetch salary payments
      const where: any = {}
      if (userId) where.userId = userId
      if (status) where.status = status.toUpperCase()

      if (startDate || endDate) {
        where.periodStart = {}
        if (startDate) where.periodStart.gte = new Date(startDate)
        if (endDate) where.periodStart.lte = new Date(endDate)
      }

      const payments = await db.salaryPayment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          staffSalary: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(payments)
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching salary data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary data' },
      { status: 500 }
    )
  }
}

// POST - Create salary profile or calculate salary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, ...salaryData } = body

    if (action === 'createProfile') {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Check if profile already exists
      const existing = await db.staffSalary.findUnique({
        where: { userId }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Salary profile already exists for this user. Use PUT to update.' },
          { status: 400 }
        )
      }

      const profile = await db.staffSalary.create({
        data: {
          userId,
          basicSalary: salaryData.basicSalary || 0,
          hourlyRate: salaryData.hourlyRate || 0,
          overtimeRate: salaryData.overtimeRate || 0,
          da: salaryData.da || 0,
          hra: salaryData.hra || 0,
          transportAllowance: salaryData.transportAllowance || 0,
          medicalAllowance: salaryData.medicalAllowance || 0,
          otherAllowances: salaryData.otherAllowances || 0,
          pfContribution: salaryData.pfContribution || 0,
          esiContribution: salaryData.esiContribution || 0,
          taxDeduction: salaryData.taxDeduction || 0,
          effectiveDate: salaryData.effectiveDate || new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        profile,
        message: 'Salary profile created successfully'
      }, { status: 201 })
    }

    if (action === 'calculate') {
      const { periodStart, periodEnd } = salaryData

      if (!periodStart || !periodEnd) {
        return NextResponse.json(
          { error: 'Period start and end dates are required' },
          { status: 400 }
        )
      }

      // Get all active staff with their salary profiles
      const staffWithSalaries = await db.staffSalary.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      // Calculate salary for each staff member
      const calculations = await Promise.all(
        staffWithSalaries.map(async (staff) => {
          // Get attendance data for the period
          const attendance = await db.attendance.findMany({
            where: {
              userId: staff.userId,
              date: {
                gte: new Date(periodStart),
                lte: new Date(periodEnd)
              },
              status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] }
            }
          })

          // Calculate regular hours and overtime
          const totalRegularHours = attendance.reduce((sum, a) => sum + a.regularHours, 0)
          const totalOvertimeHours = attendance.reduce((sum, a) => sum + a.overtimeHours, 0)

          // Calculate salary components
          const dailyBasic = staff.basicSalary / 26 // Assuming 26 working days
          const hourlyRate = staff.hourlyRate || (dailyBasic / 8)
          const regularPay = totalRegularHours * hourlyRate
          const overtimePay = totalOvertimeHours * (staff.overtimeRate || hourlyRate * 1.5)
          
          const totalAllowances = staff.da + staff.hra + staff.transportAllowance + 
                                  staff.medicalAllowance + staff.otherAllowances
          
          // Calculate deductions
          const pfDeduction = (staff.pfContribution / 100) * staff.basicSalary
          const esiDeduction = (staff.esiContribution / 100) * staff.basicSalary
          const taxDeduction = (staff.taxDeduction / 100) * staff.basicSalary
          const totalDeductions = pfDeduction + esiDeduction + taxDeduction + staff.leaveDeductions

          const grossSalary = regularPay + overtimePay + totalAllowances
          const netSalary = grossSalary - totalDeductions

          return {
            userId: staff.userId,
            userName: staff.user.name,
            regularHours: totalRegularHours,
            overtimeHours: totalOvertimeHours,
            basicSalary: staff.basicSalary,
            allowances: totalAllowances,
            grossSalary: Math.round(grossSalary * 100) / 100,
            deductions: Math.round(totalDeductions * 100) / 100,
            netSalary: Math.round(netSalary * 100) / 100
          }
        })
      )

      return NextResponse.json({
        periodStart,
        periodEnd,
        calculations
      })
    }

    if (action === 'processPayment') {
      const { userId, periodStart, periodEnd, paymentMethod, transactionId, remarks } = salaryData

      // Get salary profile
      const salaryProfile = await db.staffSalary.findUnique({
        where: { userId }
      })

      if (!salaryProfile) {
        return NextResponse.json(
          { error: 'Salary profile not found' },
          { status: 404 }
        )
      }

      // Calculate salary for this period
      const attendance = await db.attendance.findMany({
        where: {
          userId,
          date: {
            gte: new Date(periodStart),
            lte: new Date(periodEnd)
          },
          status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] }
        }
      })

      const totalRegularHours = attendance.reduce((sum, a) => sum + a.regularHours, 0)
      const totalOvertimeHours = attendance.reduce((sum, a) => sum + a.overtimeHours, 0)

      const hourlyRate = salaryProfile.hourlyRate || (salaryProfile.basicSalary / 26 / 8)
      const regularPay = totalRegularHours * hourlyRate
      const overtimePay = totalOvertimeHours * (salaryProfile.overtimeRate || hourlyRate * 1.5)
      
      const totalAllowances = salaryProfile.da + salaryProfile.hra + salaryProfile.transportAllowance + 
                              salaryProfile.medicalAllowance + salaryProfile.otherAllowances
      
      const pfDeduction = (salaryProfile.pfContribution / 100) * salaryProfile.basicSalary
      const esiDeduction = (salaryProfile.esiContribution / 100) * salaryProfile.basicSalary
      const taxDeduction = (salaryProfile.taxDeduction / 100) * salaryProfile.basicSalary
      const totalDeductions = pfDeduction + esiDeduction + taxDeduction

      const grossSalary = regularPay + overtimePay + totalAllowances
      const netSalary = grossSalary - totalDeductions

      // Create payment record
      const payment = await db.salaryPayment.create({
        data: {
          staffSalaryId: salaryProfile.id,
          userId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          regularHours: totalRegularHours,
          overtimeHours: totalOvertimeHours,
          basicSalary: salaryProfile.basicSalary,
          allowances: totalAllowances,
          grossSalary,
          deductions: totalDeductions,
          netSalary,
          status: 'PROCESSING',
          paymentDate: new Date(),
          paymentMethod,
          transactionId,
          remarks
        }
      })

      return NextResponse.json({
        success: true,
        payment,
        message: 'Salary payment processed successfully'
      }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use createProfile, calculate, or processPayment' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing salary:', error)
    return NextResponse.json(
      { error: 'Failed to process salary' },
      { status: 500 }
    )
  }
}

// PUT - Update salary profile or payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'profile') {
      const { userId, ...salaryData } = data

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        )
      }

      const profile = await db.staffSalary.update({
        where: { userId },
        data: {
          basicSalary: salaryData.basicSalary,
          hourlyRate: salaryData.hourlyRate,
          overtimeRate: salaryData.overtimeRate,
          da: salaryData.da,
          hra: salaryData.hra,
          transportAllowance: salaryData.transportAllowance,
          medicalAllowance: salaryData.medicalAllowance,
          otherAllowances: salaryData.otherAllowances,
          pfContribution: salaryData.pfContribution,
          esiContribution: salaryData.esiContribution,
          taxDeduction: salaryData.taxDeduction,
          isActive: salaryData.isActive
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        profile,
        message: 'Salary profile updated successfully'
      })
    }

    if (type === 'payment') {
      const { id, status, remarks } = data

      if (!id) {
        return NextResponse.json(
          { error: 'Payment ID is required' },
          { status: 400 }
        )
      }

      const updateData: any = {}
      if (status) updateData.status = status.toUpperCase()
      if (status === 'PAID') updateData.paymentDate = new Date()
      if (remarks !== undefined) updateData.remarks = remarks

      const payment = await db.salaryPayment.update({
        where: { id },
        data: updateData
      })

      return NextResponse.json({
        success: true,
        payment,
        message: 'Payment status updated successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid type. Use profile or payment' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating salary:', error)
    return NextResponse.json(
      { error: 'Failed to update salary' },
      { status: 500 }
    )
  }
}
