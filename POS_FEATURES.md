# Universal POS System - Multi-Type POS Features

## Overview

This is a comprehensive, multi-type Point of Sale (POS) system that supports Food, Garment, Retail, and General business types. The system dynamically activates features based on the POS type configured via environment variables.

## POS Types

### 1. FOOD POS (Restaurants, Cafes, Food Service)
**Environment Variable:** `NEXT_PUBLIC_POS_TYPE=FOOD`

**Features:**
- Table Management
- Kitchen Display System (KDS)
- Order Modifiers & Customizations
- Waitlist Management
- Table Reservations
- Table Splitting & Merging

### 2. GARMENT POS (Clothing, Fashion, Apparel)
**Environment Variable:** `NEXT_PUBLIC_POS_TYPE=GARMENT`

**Features:**
- Size & Color Variants
- Returns & Exchanges
- Barcode Scanning
- SKU Management
- Product Bundles
- Size Charts

### 3. RETAIL POS (General Retail, Electronics, Pharmacy)
**Environment Variable:** `NEXT_PUBLIC_POS_TYPE=RETAIL`

**Features:**
- Barcode Scanning
- Serial Number Tracking
- Inventory Management
- Supplier Management
- Purchase Orders
- Stock Reorder Alerts

### 4. GENERAL POS (Universal)
**Environment Variable:** `NEXT_PUBLIC_POS_TYPE=GENERAL`

**Features:**
- All features from all POS types
- Multi-Store Support
- Advanced Analytics

## Environment Configuration

### Required Environment Variables (`.env.local`)

```env
# POS System Configuration
NEXT_PUBLIC_POS_TYPE=GENERAL

# Feature Flags (Optional - Override POS type defaults)
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

# Database
DATABASE_URL="file:../db/custom.db"

# App Configuration
NEXT_PUBLIC_APP_NAME="Universal POS System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## API Endpoints

### Configuration
- `GET /api/pos/config` - Get POS type and active features

### Food POS APIs
#### Table Management
- `GET /api/pos/tables` - List all tables
- `POST /api/pos/tables` - Create new table
- `PUT /api/pos/tables/[id]` - Update table
- `DELETE /api/pos/tables/[id]` - Delete table

#### Kitchen Display System (KDS)
- `GET /api/pos/kds` - Get orders for kitchen display
- `PUT /api/pos/kds` - Update order item status

### Garment POS APIs
#### Product Variants
- `GET /api/pos/variants?menuItemId=xxx` - Get product variants
- `POST /api/pos/variants` - Create product variant (size/color)

#### Returns & Exchanges
- `GET /api/pos/returns` - List returns/exchanges
- `POST /api/pos/returns` - Create return/exchange request
- `PUT /api/pos/returns/[id]` - Update return status (approve/reject/complete)
- `DELETE /api/pos/returns/[id]` - Delete return request

### Retail POS APIs
#### Barcode Scanning
- `GET /api/pos/barcode?barcode=xxx` - Lookup product by barcode
- `POST /api/pos/barcode` - Generate barcodes for products

#### Inventory Management
- `GET /api/pos/inventory` - List inventory (with optional lowStock filter)
- `POST /api/pos/inventory` - Create/update inventory item
- `PUT /api/pos/inventory/[id]` - Update inventory quantity
- `DELETE /api/pos/inventory/[id]` - Delete inventory item

### Shared Features APIs
#### Cash Drawer
- `GET /api/pos/cashdrawer` - List cash drawers
- `POST /api/pos/cashdrawer` - Open cash drawer
- `PUT /api/pos/cashdrawer/[id]` - Close cash drawer

#### Gift Cards
- `GET /api/pos/giftcards?cardNumber=xxx` - Lookup gift card
- `POST /api/pos/giftcards` - Issue new gift card
- `PUT /api/pos/giftcards/[id]` - Update gift card balance/status
- `DELETE /api/pos/giftcards/[id]` - Delete gift card

### Core POS APIs
- `GET /api/pos/menu-items` - List menu items
- `POST /api/pos/menu-items` - Create menu item
- `PUT /api/pos/menu-items/[id]` - Update menu item
- `DELETE /api/pos/menu-items/[id]` - Delete menu item
- `GET /api/pos/categories` - List categories
- `GET /api/pos/orders` - List orders
- `POST /api/pos/orders` - Create order

### Advanced Features APIs
#### AI Insights
- `GET /api/ai/insights?days=7` - Get AI-powered business insights

#### Reports
- `GET /api/reports/gst` - Generate GST reports (GSTR-1, GSTR-3B)
- `GET /api/reports/custom?type=sales` - Generate custom reports (sales, inventory, items, payments, customers, comprehensive)

#### Receipts
- `POST /api/receipts/generate` - Generate printable receipt
- `POST /api/receipts/whatsapp` - Generate WhatsApp message
- `POST /api/receipts/email` - Generate email receipt

#### Data Management
- `GET /api/export?type=all` - Export data (JSON)
- `POST /api/import` - Import data with validation

#### Loyalty Program
- `GET /api/loyalty?customerId=xxx` - Get customer loyalty info
- `POST /api/loyalty` - Create/update loyalty record
- `PUT /api/loyalty` - Add loyalty points

#### Discounts
- `GET /api/discounts` - List discounts
- `POST /api/discounts` - Create discount
- `PUT /api/discounts/[id]` - Update discount
- `DELETE /api/discounts/[id]` - Delete discount
- `POST /api/discounts/apply` - Apply discount to order

## Database Schema

### Core Models
- **User** - Staff and admin accounts
- **Category** - Product/Menu categories
- **MenuItem** - Products/Menu items
- **Customer** - Customer profiles with loyalty points
- **Order** - Sales orders
- **OrderItem** - Individual items in orders
- **Payment** - Payment transactions
- **StoreSettings** - Store configuration

### Food POS Models
- **Table** - Restaurant tables
- **TableAssignment** - Table-to-order assignments
- **OrderModifier** - Order customizations

### Garment POS Models
- **ProductVariant** - Size and color variants
- **Return** - Return and exchange requests

### Retail POS Models
- **InventoryItem** - Stock tracking
- **Supplier** - Vendor information
- **PurchaseOrder** - Restocking orders
- **PurchaseOrderItem** - Items in purchase orders

### Shared Models
- **Discount** - Discount codes and promotions
- **Refund** - Refund transactions
- **CashDrawer** - Cash management
- **CashTransaction** - Individual cash transactions
- **StaffPerformance** - Employee performance metrics
- **Shift** - Work shift tracking
- **GiftCard** - Gift card management
- **Announcement** - System announcements

## UI Tabs

The main dashboard includes the following tabs (shown based on POS type):

1. **POS** - Main point of sale interface
2. **Orders** - Order history and management
3. **Tables** (Food POS) - Table management and status
4. **KDS** (Food POS) - Kitchen display system
5. **AI Insights** - AI-powered business analytics
6. **Reports** - Sales, inventory, GST reports
7. **Inventory** (Retail POS) - Stock management
8. **Menu** (Admin/Manager) - Menu and product management
9. **Staff** (Admin) - User and role management
10. **Returns** (Garment/Retail POS) - Returns and exchanges
11. **Gift Cards** (All POS) - Gift card management
12. **Cash Drawer** (All POS) - Cash management
13. **Barcode** (Retail POS) - Barcode scanning
14. **Variants** (Garment POS) - Product variant management

## Indian GST Compliance

The system is fully GST compliant for Indian businesses:

- **GST Rates**: 0%, 5%, 12%, 18%, 28%
- **Tax Types**: CGST (Central GST) and SGST (State GST)
- **HSN Codes**: Support for product HSN/SAC codes
- **GSTIN**: GST Identification Number support
- **Reports**: GSTR-1 and GSTR-3B report generation

## Deployment Options

### 1. Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### 2. Docker
```bash
# Build image
docker build -t universal-pos .

# Run container
docker run -p 3000:3000 universal-pos
```

### 3. VPS/Cloud Server
```bash
# Clone repository
git clone <repo-url>
cd <project-dir>

# Install dependencies
bun install

# Build
bun run build

# Start production server
bun start
```

### 4. Railway/Render
Push to GitHub and connect repository to Railway or Render for automatic deployment.

## Security Checklist

- [ ] Use hashed passwords for authentication
- [ ] Enable HTTPS in production
- [ ] Set up CORS policies
- [ ] Implement rate limiting on API endpoints
- [ ] Validate all user inputs
- [ ] Use prepared statements for database queries
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use environment variables for sensitive data
- [ ] Implement proper error handling

## Feature Comparison by POS Type

| Feature | Food | Garment | Retail | General |
|---------|------|---------|--------|---------|
| Table Management | ✅ | ❌ | ❌ | ✅ |
| Kitchen Display | ✅ | ❌ | ❌ | ✅ |
| Size/Color Variants | ❌ | ✅ | ❌ | ✅ |
| Barcode Scanning | ❌ | ✅ | ✅ | ✅ |
| Serial Numbers | ❌ | ❌ | ✅ | ✅ |
| Returns | ❌ | ✅ | ✅ | ✅ |
| Exchanges | ❌ | ✅ | ❌ | ✅ |
| Inventory | ✅ | ✅ | ✅ | ✅ |
| Loyalty Program | ✅ | ✅ | ✅ | ✅ |
| Gift Cards | ✅ | ✅ | ✅ | ✅ |
| Cash Drawer | ✅ | ✅ | ✅ | ✅ |
| AI Insights | ✅ | ✅ | ✅ | ✅ |
| GST Reports | ✅ | ✅ | ✅ | ✅ |

## Performance Optimization Tips

1. **Database Indexing**: Add indexes to frequently queried fields
2. **Caching**: Implement Redis for session and data caching
3. **CDN**: Use CDN for static assets and images
4. **Lazy Loading**: Load heavy components on demand
5. **Pagination**: Implement pagination for large data sets
6. **Background Jobs**: Move heavy tasks to background workers
7. **Compression**: Enable gzip compression for responses

## Support & Learning Resources

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- shadcn/ui Components: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs
- Indian GST Guide: https://www.gst.gov.in

## Future Enhancements

- Multi-currency support
- Multi-language support
- Advanced analytics dashboard
- Mobile app (React Native)
- Integration with payment gateways
- Accounting software integration
- Email marketing integration
- Advanced reporting with charts
- Real-time notifications
- Offline mode support

---

**Version**: 1.0.0
**Last Updated**: 2025
**License**: MIT
