# Universal POS System - Multi-Type Configuration Guide

## Overview

The Universal POS System supports multiple POS types (Food, Garment, Retail, and General) with environment-based configuration. This allows you to easily switch between different business types without code changes.

## Supported POS Types

### 1. Food POS
**Best for:** Restaurants, cafes, food courts, cloud kitchens
**Key Features:**
- Table Management
- Kitchen Display System (KDS)
- Order Modifiers & Customizations
- Waitlist Management
- Table Reservations
- Table Splitting & Merging

### 2. Garment POS
**Best for:** Clothing stores, fashion boutiques, apparel shops
**Key Features:**
- Size & Color Variants
- Returns & Exchanges
- Barcode Scanning
- SKU Management
- Product Bundles
- Size Charts

### 3. Retail POS
**Best for:** Electronics stores, supermarkets, pharmacies, general retail
**Key Features:**
- Barcode Scanning
- Serial Number Tracking
- Inventory Management
- Supplier Management
- Purchase Orders
- Stock Reorder Alerts

### 4. General POS (Universal)
**Best for:** Multi-store operations, businesses needing all features
**Key Features:**
- All Food POS Features
- All Garment POS Features
- All Retail POS Features
- Advanced Analytics

## Configuration

### Environment Variables

Create or edit `.env.local` file:

```bash
# Select POS Type (FOOD, GARMENT, RETAIL, or GENERAL)
NEXT_PUBLIC_POS_TYPE=GENERAL

# Feature Flags (optional - override defaults)
NEXT_PUBLIC_ENABLE_TABLE_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_KITCHEN_DISPLAY=true
NEXT_PUBLIC_ENABLE_MODIFIERS=true
NEXT_PUBLIC_ENABLE_SIZE_VARIANTS=true
NEXT_PUBLIC_ENABLE_COLOR_VARIANTS=true
NEXT_PUBLIC_ENABLE_BARCODES=true
NEXT_PUBLIC_ENABLE_SERIAL_NUMBERS=true
NEXT_PUBLIC_ENABLE_RETURNS_EXCHANGES=true
NEXT_PUBLIC_ENABLE_LOYALTY_PROGRAM=true
NEXT_PUBLIC_ENABLE_DISCOUNTS=true
NEXT_PUBLIC_ENABLE_REFUNDS=true
NEXT_PUBLIC_ENABLE_CASH_DRAWER=true
NEXT_PUBLIC_ENABLE_STAFF_PERFORMANCE=true
NEXT_PUBLIC_ENABLE_GIFTCARDS=true
```

## API Endpoints

### POS Configuration
**GET** `/api/pos/config`

Returns the current POS configuration including:
- POS Type (FOOD, GARMENT, RETAIL, GENERAL)
- Name of the POS system
- Active features
- Capabilities list

### Food POS APIs

#### Tables
- `GET /api/pos/tables` - List all tables
- `POST /api/pos/tables` - Create new table
- `PUT /api/pos/tables/[id]` - Update table
- `DELETE /api/pos/tables/[id]` - Delete table

#### Kitchen Display System (KDS)
- `GET /api/pos/kds` - Get kitchen orders
- `PUT /api/pos/kds` - Update order item status

### Garment POS APIs

#### Product Variants
- `GET /api/pos/variants?menuItemId=xxx` - Get variants for a product
- `POST /api/pos/variants` - Create new variant

#### Returns & Exchanges
- `GET /api/pos/returns` - List returns
- `POST /api/pos/returns` - Create return/exchange request
- `PUT /api/pos/returns/[id]` - Process return (approve/reject/complete)
- `DELETE /api/pos/returns/[id]` - Delete return request

### Retail POS APIs

#### Barcode Scanning
- `GET /api/pos/barcode?barcode=xxx` - Lookup product by barcode
- `POST /api/pos/barcode` - Generate barcodes

#### Inventory Management
- `GET /api/pos/inventory` - List inventory
- `GET /api/pos/inventory?lowStock=true` - Get low stock items
- `POST /api/pos/inventory` - Create/update inventory
- `PUT /api/pos/inventory/[id]` - Update inventory quantity
- `DELETE /api/pos/inventory/[id]` - Delete inventory item

### Shared Features

#### Cash Drawer
- `GET /api/pos/cashdrawer` - List cash drawers
- `POST /api/pos/cashdrawer` - Open new cash drawer
- `PUT /api/pos/cashdrawer/[id]` - Close cash drawer

#### Gift Cards
- `GET /api/pos/giftcards` - List gift cards
- `GET /api/pos/giftcards?cardNumber=xxx` - Lookup gift card
- `POST /api/pos/giftcards` - Create gift card
- `PUT /api/pos/giftcards/[id]` - Update balance/status
- `DELETE /api/pos/giftcards/[id]` - Delete gift card

#### Staff Performance
- (Implemented in database schema, API endpoints can be added)

## Database Schema

### POS Type Specific Models

#### Food POS
- `Table` - Restaurant tables with capacity and status
- `TableAssignment` - KDS order-to-table assignments
- `OrderModifier` - Order customizations

#### Garment POS
- `ProductVariant` - Size and color variants for products
- `Return` - Return and exchange requests

#### Retail POS
- `InventoryItem` - Stock levels and reorder points
- `Supplier` - Product suppliers
- `PurchaseOrder` - Restocking orders
- `PurchaseOrderItem` - Items in purchase orders

### Shared Models
- `CashDrawer` - Cash register management
- `CashTransaction` - Cash in/out transactions
- `StaffPerformance` - Employee performance tracking
- `Shift` - Work shift management
- `GiftCard` - Gift card system
- `Refund` - Order refunds
- `Discount` - Promotions and coupons
- `Announcement` - System notifications

## Switching POS Types

To change the POS type:

1. Edit `.env.local`
2. Change `NEXT_PUBLIC_POS_TYPE` to desired type (FOOD, GARMENT, RETAIL, or GENERAL)
3. Restart the development server
4. The UI will automatically update to show relevant features

### Example: Switch to Food POS

```bash
# .env.local
NEXT_PUBLIC_POS_TYPE=FOOD
```

The system will now show:
- Tables tab
- KDS tab
- Order modifiers
- Restaurant-specific features

### Example: Switch to Garment POS

```bash
# .env.local
NEXT_PUBLIC_POS_TYPE=GARMENT
```

The system will now show:
- Size/Color variant selection
- Returns & Exchanges tab
- Barcode scanning
- Clothing-specific features

## Feature Override

You can override default features for any POS type:

```bash
# Use FOOD POS but disable table management
NEXT_PUBLIC_POS_TYPE=FOOD
NEXT_PUBLIC_ENABLE_TABLE_MANAGEMENT=false
```

## UI Features by POS Type

### Food POS UI
- Table Management Tab
- Kitchen Display System (KDS) Tab
- Order Status (Pending → Preparing → Ready)
- Table-based checkout
- Order modifiers (customizations)

### Garment POS UI
- Product Variant Selector (Size/Color)
- Returns Management Tab
- Exchange Requests
- Size Charts
- Barcode Scanner

### Retail POS UI
- Inventory Management Tab
- Barcode Scanner Integration
- Serial Number Tracking
- Low Stock Alerts
- Purchase Orders

### General POS UI
- All tabs visible
- Complete feature set
- Multi-store support
- Advanced analytics

## GST Compliance

All POS types are India GST compliant:
- Automatic CGST/SGST calculation
- HSN Code support
- GSTIN management
- GSTR-1 & GSTR-3B Reports
- Tax invoice generation

## Deployment Considerations

### Environment-Specific Deployment

When deploying to different environments:

```bash
# Production
NEXT_PUBLIC_POS_TYPE=GENERAL

# Store 1 (Restaurant)
NEXT_PUBLIC_POS_TYPE=FOOD

# Store 2 (Clothing Store)
NEXT_PUBLIC_POS_TYPE=GARMENT

# Store 3 (Electronics Store)
NEXT_PUBLIC_POS_TYPE=RETAIL
```

### Database Migration

When switching POS types, ensure database schema is up to date:

```bash
bun run db:push
```

## Testing

### Testing Different POS Types

1. Stop the dev server
2. Update `.env.local` with desired POS type
3. Restart dev server
4. Test relevant features

### API Testing

```bash
# Test POS Configuration
curl http://localhost:3000/api/pos/config

# Test Table Management (Food POS)
curl http://localhost:3000/api/pos/tables

# Test Barcode Lookup (Retail/Garment POS)
curl "http://localhost:3000/api/pos/barcode?barcode=123456789"

# Test Returns (Garment POS)
curl http://localhost:3000/api/pos/returns
```

## Troubleshooting

### Features Not Showing
1. Check `.env.local` is configured correctly
2. Restart the dev server
3. Check browser console for errors

### API 404 Errors
1. Verify API route files exist
2. Check database schema is synced (`bun run db:push`)

### Database Errors
1. Run `bun run db:push` to sync schema
2. Check SQLite database file permissions

## Extending the System

### Adding a New POS Type

1. Add new enum value in `prisma/schema.prisma`:
   ```prisma
   enum PosType {
     FOOD
     GARMENT
     RETAIL
     GENERAL
     YOUR_NEW_TYPE  // Add here
   }
   ```

2. Add configuration in `/src/app/api/pos/config/route.ts`:
   ```typescript
   const posConfigs = {
     YOUR_NEW_TYPE: {
       posType: 'YOUR_NEW_TYPE',
       name: 'Your New POS Name',
       features: { /* your features */ },
       capabilities: [ /* list capabilities */ ]
     }
   }
   ```

3. Create API routes for your specific features

4. Add UI components in `page.tsx`

## Support and Resources

- Database Schema: `/prisma/schema.prisma`
- Configuration API: `/src/app/api/pos/config/route.ts`
- Environment Config: `.env.local`
- Documentation: `/todo.md`

## License

Universal POS System - Multi-Type POS Solution
