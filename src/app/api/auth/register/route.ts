import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Register new user with phone number
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove non-numeric characters)
    const cleanedPhone = phone.replace(/\D/g, '')

    if (cleanedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Check if user with this phone already exists
    const existingUserByPhone = await db.user.findFirst({
      where: { phone: cleanedPhone }
    })

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }

    // Check if user with this email already exists (if email provided)
    if (email) {
      const existingUserByEmail = await db.user.findUnique({
        where: { email }
      })

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email: email || null,
        phone: cleanedPhone,
        password: password || 'password123', // Default password if none provided
        role: role || 'CASHIER',
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      message: 'Registration successful'
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
