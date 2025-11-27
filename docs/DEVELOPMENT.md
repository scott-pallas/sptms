# SPTMS Development Guide

Development workflow, best practices, and guidelines for contributing to SPTMS.

## Table of Contents

- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Working with Payload CMS](#working-with-payload-cms)
- [Database Development](#database-development)
- [Testing](#testing)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Common Tasks](#common-tasks)

## Development Environment

### Recommended Tools

- **IDE**: VS Code with extensions:
  - ESLint
  - Prettier - Code formatter
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **Terminal**: iTerm2 (Mac) or Windows Terminal
- **Git Client**: GitHub Desktop or command line
- **API Testing**: Postman or Insomnia
- **Database Tool**: MongoDB Compass

### Environment Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/scott-pallas/sptms.git
   cd sptms
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

## Project Structure

```
sptms/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/        # Public pages
│   │   │   ├── layout.tsx     # Frontend layout
│   │   │   ├── page.tsx       # Homepage
│   │   │   └── styles.css     # Global styles
│   │   └── (payload)/         # Admin/API
│   │       ├── admin/         # Admin UI
│   │       ├── api/           # REST API
│   │       └── layout.tsx     # Admin layout
│   ├── collections/           # Payload collections
│   │   ├── Users.ts
│   │   ├── Customers.ts
│   │   ├── CustomerLocations.ts
│   │   ├── Carriers.ts
│   │   ├── Loads.ts
│   │   └── Media.ts
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utilities
│   │   └── utils.ts          # Helper functions
│   └── payload.config.ts      # Payload configuration
├── docs/                      # Documentation
├── tests/                     # Test files
│   ├── e2e/                  # End-to-end tests
│   └── int/                  # Integration tests
├── public/                    # Static assets
└── media/                     # Uploaded files
```

## Development Workflow

### Daily Workflow

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start dev server**:
   ```bash
   pnpm dev
   ```

4. **Make changes** and test

5. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

6. **Push to GitHub**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Hot Reload

Next.js supports hot module replacement (HMR):
- Frontend changes reload automatically
- API route changes reload automatically
- Payload config changes require manual restart

### Restarting the Server

When to restart:
- Changes to `payload.config.ts`
- Changes to collection schemas
- Adding new collections
- Environment variable changes

```bash
# Stop server (Ctrl+C)
# Start again
pnpm dev
```

## Working with Payload CMS

### Creating a New Collection

1. **Create collection file**:
   ```typescript
   // src/collections/YourCollection.ts
   import type { CollectionConfig } from 'payload'

   export const YourCollection: CollectionConfig = {
     slug: 'your-collection',
     admin: {
       useAsTitle: 'name',
     },
     fields: [
       {
         name: 'name',
         type: 'text',
         required: true,
       },
     ],
   }
   ```

2. **Add to payload.config.ts**:
   ```typescript
   import { YourCollection } from './collections/YourCollection'

   export default buildConfig({
     collections: [
       Users,
       Customers,
       // ... other collections
       YourCollection, // Add here
     ],
   })
   ```

3. **Generate types**:
   ```bash
   pnpm generate:types
   ```

4. **Regenerate import map**:
   ```bash
   pnpm generate:importmap
   ```

### Adding Fields to Existing Collections

1. Edit the collection file
2. Add your field definition
3. Regenerate types: `pnpm generate:types`
4. Restart dev server

### Field Types

Common field types in Payload:

```typescript
// Text
{ name: 'title', type: 'text', required: true }

// Textarea
{ name: 'description', type: 'textarea' }

// Number
{ name: 'price', type: 'number', min: 0 }

// Checkbox
{ name: 'active', type: 'checkbox', defaultValue: true }

// Select
{
  name: 'status',
  type: 'select',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ]
}

// Date
{ name: 'dueDate', type: 'date' }

// Relationship
{
  name: 'customer',
  type: 'relationship',
  relationTo: 'customers',
  required: true
}

// Array
{
  name: 'items',
  type: 'array',
  fields: [
    { name: 'name', type: 'text' },
    { name: 'quantity', type: 'number' },
  ],
}

// Group
{
  name: 'address',
  type: 'group',
  fields: [
    { name: 'street', type: 'text' },
    { name: 'city', type: 'text' },
  ],
}
```

## Database Development

### Viewing Data

Use MongoDB Compass to view/edit data:

1. **Connect to MongoDB Atlas**:
   - Open MongoDB Compass
   - Paste your connection string
   - Browse the `sptms` database

2. **Collections**:
   - `users` - System users
   - `customers` - Customer data
   - `customer-locations` - Addresses
   - `carriers` - Carrier data
   - `loads` - Load records
   - `media` - Uploaded files

### Seeding Data

For development, you may want to seed test data:

```typescript
// scripts/seed.ts
import payload from 'payload'

async function seed() {
  await payload.create({
    collection: 'customers',
    data: {
      companyName: 'Test Customer',
      status: 'active',
      email: 'test@customer.com',
    },
  })
}
```

Run with:
```bash
node scripts/seed.ts
```

### Resetting Database

To reset your development database:

1. Delete all collections in MongoDB Compass
2. Restart dev server
3. Re-create admin user at `/admin`

## Testing

### Unit/Integration Tests (Vitest)

Run integration tests:
```bash
pnpm test:int
```

Create a test:
```typescript
// tests/int/customers.int.spec.ts
import { describe, it, expect } from 'vitest'

describe('Customer API', () => {
  it('should create a customer', async () => {
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Corp',
        status: 'active',
      }),
    })

    expect(response.ok).toBe(true)
  })
})
```

### End-to-End Tests (Playwright)

Run E2E tests:
```bash
pnpm test:e2e
```

Create an E2E test:
```typescript
// tests/e2e/loads.e2e.spec.ts
import { test, expect } from '@playwright/test'

test('create a new load', async ({ page }) => {
  await page.goto('/admin/collections/loads')
  await page.click('text=Create New')
  await page.fill('[name="loadNumber"]', 'TEST-001')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/admin\/collections\/loads\//)
})
```

## Code Style

### TypeScript

- Use strict TypeScript
- Define proper types for all data
- Avoid `any` type

```typescript
// Good
interface Customer {
  companyName: string
  email: string
}

const customer: Customer = {
  companyName: 'Acme Corp',
  email: 'contact@acme.com',
}

// Bad
const customer: any = { ... }
```

### React Components

```typescript
// Use functional components
export function LoadCard({ load }: { load: Load }) {
  return (
    <div className="border p-4 rounded">
      <h3>{load.loadNumber}</h3>
      <p>{load.status}</p>
    </div>
  )
}
```

### Tailwind CSS

- Use Tailwind utility classes
- Use `cn()` helper for conditional classes

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "px-4 py-2",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50"
)}>
```

### Naming Conventions

- **Files**: kebab-case (`customer-list.tsx`)
- **Components**: PascalCase (`CustomerList`)
- **Functions**: camelCase (`getCustomerById`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Collections**: PascalCase (`Customers.ts`)

## Git Workflow

### Branch Naming

```
feature/add-invoice-generation
fix/load-status-bug
docs/update-setup-guide
refactor/carrier-validation
```

### Commit Messages

Follow conventional commits:

```
feat: Add invoice generation feature
fix: Resolve load status update bug
docs: Update API documentation
refactor: Simplify carrier validation logic
test: Add tests for load creation
```

### Pull Requests

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Push to GitHub
6. Create PR with description
7. Request review
8. Merge after approval

## Common Tasks

### Add a New Field to Loads

1. Edit `src/collections/Loads.ts`
2. Add field to appropriate tab
3. Run `pnpm generate:types`
4. Restart dev server
5. Test in admin panel

### Create a Custom API Endpoint

```typescript
// src/app/api/custom-endpoint/route.ts
import { NextResponse } from 'next/server'
import payload from 'payload'

export async function GET() {
  const loads = await payload.find({
    collection: 'loads',
    where: { status: { equals: 'in-transit' } },
  })

  return NextResponse.json(loads)
}
```

### Add a shadcn/ui Component

```bash
npx shadcn@latest add button
```

This adds the component to `src/components/ui/button.tsx`.

### Generate Payload Types

After schema changes:

```bash
pnpm generate:types
```

This updates `src/payload-types.ts`.

### Format Code

```bash
# Format all files
pnpm prettier --write .

# Check formatting
pnpm prettier --check .
```

### Lint Code

```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

---

**Last Updated**: November 2024

For more information:
- [Next.js Documentation](https://nextjs.org/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
