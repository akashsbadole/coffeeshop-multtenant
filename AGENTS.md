# AGENTS.md - Coffee Shop POS Development Guidelines

## Development Commands

### Build & Development
- `bun run dev` - Start development server on port 3000
- `bun run build` - Build production application
- `bun run start` - Start production server
- `bun run lint` - Run ESLint (configured with Next.js rules)

### Database Commands
- `bun run db:push` - Push schema changes to database
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:reset` - Reset database to initial state
- `bun run db:seed` - Seed database with initial data

### Testing
- No test framework currently configured
- Use `bun run lint` for code quality checks
- Manual testing required for features

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: Enabled (`"strict": true`)
- **Target**: ES2017
- **Module Resolution**: Bundler
- **Path aliases**: `@/*` maps to `./src/*`
- **JSX**: React-JSX
- **Implicit Any**: Disabled (`"noImplicitAny": false` for flexibility)

### Import Organization
```typescript
// 1. React/Next.js imports
import React, { useEffect } from 'react'
import { NextResponse } from 'next/server'

// 2. Third-party libraries
import { z } from 'zod'
import { toast } from 'sonner'

// 3. UI components (from @/)
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 4. Store/hooks
import { useCart } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'

// 5. Utilities
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
```

### Component Patterns
- Use functional components with React hooks
- Default export for components
- Named exports for utilities
- Server components for data fetching
- Client components (`'use client'`) for interactivity

### UI Components (shadcn/ui)
- All UI components located in `src/components/ui/`
- Use `cn()` utility for class merging
- Follow Radix UI patterns
- Consistent variant props structure
- TypeScript-first approach with proper typing

### State Management (Zustand)
- Stores located in `src/store/`
- TypeScript interfaces for all state types
- Separate stores by feature domain
- Use `create<T>()` for type safety
- Include proper error handling in async actions

### Database (Prisma)
- Schema in `prisma/schema.prisma`
- SQLite provider (configurable to PostgreSQL)
- Generated client in `node_modules/.prisma`
- Use `db` import from `@/lib/db`
- Proper type safety with generated types

### API Routes
- Located in `src/app/api/`
- RESTful conventions
- Proper HTTP status codes
- JSON responses
- Error handling with try/catch
- Input validation using Zod schemas

### File Naming Conventions
- **Components**: PascalCase (e.g., `Button.tsx`, `MenuManagement.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useToast.ts`)
- **Utils**: camelCase (e.g., `utils.ts`, `auth.ts`)
- **Stores**: camelCase (e.g., `cart.ts`, `auth.ts`)
- **API Routes**: lowercase with hyphens (e.g., `menu-items/route.ts`)

### Code Organization
```
src/
├── app/                 # Next.js App Router (pages, API routes)
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── admin/          # Admin-specific components
│   ├── pos/            # POS-specific components
│   └── auth/           # Authentication components
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
└── types/              # TypeScript type definitions
```

### Error Handling
- API routes: Return proper HTTP status codes with error messages
- Components: Use toast notifications (`sonner`) for user feedback
- Async operations: Wrap in try/catch with user-friendly errors
- Database operations: Handle Prisma errors gracefully

### CSS/Styling
- Tailwind CSS 4 with custom config
- CSS custom properties for theme colors
- Consistent spacing using Tailwind scale
- Responsive design with mobile-first approach
- Dark mode support via `dark:` prefixes

### Form Handling
- React Hook Form with Zod validation
- Use shadcn/ui form components
- Proper TypeScript types for form data
- Client and server-side validation

### Accessibility
- Semantic HTML elements
- ARIA support where needed
- Keyboard navigation
- Screen reader compatibility
- Focus management

## Development Workflow

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `bun run db:generate` to update client
3. Run `bun run db:push` to apply changes
4. Update related types and components

### Adding New Features
1. Create/modify Prisma models if needed
2. Add API routes for data operations
3. Create React components for UI
4. Add Zustand store for state management
5. Update types in `src/store/types.ts`

### Code Quality
- ESLint configured with Next.js rules
- TypeScript strict mode enabled
- No unused variables/imports warnings suppressed
- Prefer explicit typing over `any`
- Use `null` and `undefined` appropriately

## Environment Setup

### Required Environment Variables
```env
DATABASE_URL="file:./dev.db"  # or PostgreSQL connection string
NEXTAUTH_URL="http://localhost:3000"
```

### Dependencies
- **Runtime**: Bun (recommended) or npm
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI**: shadcn/ui components
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner

## Important Notes

### Security
- Input validation on all API endpoints
- SQL injection prevention via Prisma ORM
- Session management for authentication
- Environment variables for sensitive data

### Performance
- Server-side rendering where possible
- Optimized database queries
- Component lazy loading
- Efficient state updates

### Testing Strategy
- No automated tests currently configured
- Manual testing recommended
- Use development server for feature testing
- Test API endpoints with tools like Postman

This POS system is built with modern web technologies and follows industry best practices for point-of-sale systems. All development should adhere to these guidelines for consistency and maintainability.