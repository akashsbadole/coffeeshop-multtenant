import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Table by ID API
 * Handles individual table operations
 */

// PUT - Update a table
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, capacity, section, status, qrCode } = body

    const table = await db.table.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(capacity !== undefined && { capacity }),
        ...(section && { section }),
        ...(status && { status }),
        ...(qrCode !== undefined && { qrCode })
      }
    })

    return NextResponse.json(table)
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.table.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    )
  }
}
