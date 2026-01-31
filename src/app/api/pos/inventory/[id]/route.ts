import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Inventory by ID API
 * Handles individual inventory item operations
 */

// PUT - Update inventory quantity (add or remove stock)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { quantity, adjustment, serialNumbers } = body

    const inventoryItem = await db.inventoryItem.findUnique({
      where: { id: params.id }
    })

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    let newQuantity = inventoryItem.quantity

    if (quantity !== undefined) {
      // Set exact quantity
      newQuantity = quantity
    } else if (adjustment !== undefined) {
      // Adjust quantity (positive or negative)
      newQuantity = inventoryItem.quantity + adjustment
    }

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      )
    }

    const updatedItem = await db.inventoryItem.update({
      where: { id: params.id },
      data: {
        quantity: newQuantity,
        serialNumbers: serialNumbers ? JSON.stringify(serialNumbers) : undefined,
        lastRestocked: newQuantity > inventoryItem.quantity ? new Date() : inventoryItem.lastRestocked
      }
    })

    const isLowStock = updatedItem.quantity <= updatedItem.reorderLevel

    return NextResponse.json({
      ...updatedItem,
      serialNumbers: updatedItem.serialNumbers ? JSON.parse(updatedItem.serialNumbers) : null,
      isLowStock,
      previousQuantity: inventoryItem.quantity,
      adjustment: newQuantity - inventoryItem.quantity
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.inventoryItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
