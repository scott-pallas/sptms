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
│   │   │   ├── api/           # Custom API endpoints
│   │   │   │   ├── loads/[id]/     # Load operations (rate con, tracking, duplicate)
│   │   │   │   ├── invoices/       # Invoice generation and PDF
│   │   │   │   ├── carrier-payments/ # Pay sheet generation
│   │   │   │   ├── webhooks/       # External webhooks (MacroPoint)
│   │   │   │   └── reports/        # Profitability reports
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
│   │   ├── TrackingEvents.ts  # MacroPoint tracking history
│   │   ├── Invoices.ts        # Customer invoices
│   │   ├── CarrierPayments.ts # Carrier pay sheets
│   │   └── Media.ts
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utilities and services
│   │   ├── utils.ts          # Helper functions
│   │   ├── pdf/              # PDF templates
│   │   │   ├── rate-confirmation.tsx
│   │   │   └── invoice.tsx
│   │   ├── email/            # Email templates
│   │   │   └── rate-confirmation-email.tsx
│   │   ├── integrations/     # External service integrations
│   │   │   ├── macropoint.ts  # MacroPoint tracking API
│   │   │   ├── quickbooks.ts  # QuickBooks Online API
│   │   │   └── epay.ts        # ePay carrier payments API
│   │   └── services/         # Business logic services
│   │       └── profitability.ts # Profitability calculations
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

## Working with Integrations

### MacroPoint Integration

The MacroPoint integration provides real-time freight tracking.

**File**: `src/lib/integrations/macropoint.ts`

**Usage**:
```typescript
import { macropoint } from '@/lib/integrations/macropoint'

// Create tracking request
const result = await macropoint.createTrackingRequest(
  load,
  carrier,
  pickupLocation,
  deliveryLocation
)

// Handle webhook
const event = macropoint.parseWebhookPayload(webhookData)
const newStatus = macropoint.shouldUpdateLoadStatus(event.eventCode)
```

**Environment Variables**:
```env
MACROPOINT_API_URL=https://api.macropoint.com/v2
MACROPOINT_API_KEY=your_api_key
MACROPOINT_API_SECRET=your_api_secret
MACROPOINT_WEBHOOK_SECRET=your_webhook_secret
```

### QuickBooks Integration

Syncs customers and invoices to QuickBooks Online.

**File**: `src/lib/integrations/quickbooks.ts`

**Usage**:
```typescript
import { quickbooks } from '@/lib/integrations/quickbooks'

// Sync customer
const result = await quickbooks.syncCustomer(customer, existingQbId)

// Create invoice
const invoice = await quickbooks.createInvoice({
  invoiceNumber: 'INV-001',
  customerQbId: 'qb-customer-id',
  lineItems: [...]
})
```

**Environment Variables**:
```env
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox  # or production
QUICKBOOKS_REALM_ID=your_company_id
QUICKBOOKS_ACCESS_TOKEN=access_token
QUICKBOOKS_REFRESH_TOKEN=refresh_token
```

### ePay Integration

Handles carrier payments through ePay.

**File**: `src/lib/integrations/epay.ts`

**Usage**:
```typescript
import { epay } from '@/lib/integrations/epay'

// Submit payment
const result = await epay.submitPayment(paymentRequest)

// Get payment status
const status = await epay.getPaymentStatus(transactionId)
```

**Environment Variables**:
```env
EPAY_API_URL=https://api.epay.com/v1
EPAY_MEMBER_ID=your_member_id
EPAY_API_KEY=your_api_key
EPAY_API_SECRET=your_api_secret
```

### DAT Load Board Integration

Integrates with DAT for load posting, truck search, and market rates.

**File**: `src/lib/integrations/dat.ts`

**Usage**:
```typescript
import { dat } from '@/lib/integrations/dat'

// Post a load to DAT
const loadPost = dat.buildLoadPost(load, pickupLocation, deliveryLocation, contactInfo)
const result = await dat.postLoad(loadPost)

// Search for available trucks
const trucks = await dat.searchTrucks({
  origin: { city: 'Dallas', state: 'TX' },
  destination: { city: 'Houston', state: 'TX' },
  equipmentTypes: ['dry-van'],
})

// Get market rates
const rates = await dat.getRates({
  origin: { city: 'Dallas', state: 'TX' },
  destination: { city: 'Houston', state: 'TX' },
  equipmentType: 'dry-van',
})

// Get suggested rates with target margin
const suggested = await dat.getSuggestedRate(
  { city: 'Dallas', state: 'TX' },
  { city: 'Houston', state: 'TX' },
  'dry-van',
  0.15 // 15% margin
)

// Get rate history for a lane
const history = await dat.getLaneHistory(
  { city: 'Dallas', state: 'TX' },
  { city: 'Houston', state: 'TX' },
  'dry-van',
  90 // days
)

// Remove a posting
await dat.removeLoadPost(postingId)
```

**Environment Variables**:
```env
DAT_API_URL=https://api.dat.com
DAT_CLIENT_ID=your_client_id
DAT_CLIENT_SECRET=your_client_secret
DAT_USERNAME=your_dat_username
DAT_PASSWORD=your_dat_password
```

**Requirements**:
- Connexion seat + load board seat for posting loads and searching trucks
- RateView subscription for market rate data

---

## Profitability Service

Calculate margins and generate financial reports.

**File**: `src/lib/services/profitability.ts`

**Usage**:
```typescript
import { profitability } from '@/lib/services/profitability'

// Calculate load profitability
const loadProfit = profitability.calculateLoadProfitability(load)

// Calculate batch profitability
const batchResult = profitability.calculateBatchProfitability(loads)

// Generate summary report
const summary = profitability.generateSummary(
  loads,
  customersMap,
  startDate,
  endDate
)

// Calculate target rates
const target = profitability.calculateTargetRate(carrierRate, targetMarginPercent)
```

---

## PDF Generation

Generate PDFs using React-PDF.

**Files**:
- `src/lib/pdf/rate-confirmation.tsx`
- `src/lib/pdf/invoice.tsx`

**Usage**:
```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { RateConfirmationPDF } from '@/lib/pdf/rate-confirmation'
import { InvoicePDF } from '@/lib/pdf/invoice'

// Generate PDF buffer
const pdfBuffer = await renderToBuffer(
  RateConfirmationPDF(props) as any
)

// Return as response
return new NextResponse(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="document.pdf"`,
  },
})
```

---

## Email Sending

Send emails using Resend.

**File**: `src/lib/email/rate-confirmation-email.tsx`

**Usage**:
```typescript
import { Resend } from 'resend'
import { RateConfirmationEmail } from '@/lib/email/rate-confirmation-email'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: carrierEmail,
  subject: `Rate Confirmation - Load ${loadNumber}`,
  react: RateConfirmationEmail(props),
  attachments: [
    {
      filename: 'RateConfirmation.pdf',
      content: pdfBuffer,
    },
  ],
})
```

---

**Last Updated**: November 2024

For more information:
- [Next.js Documentation](https://nextjs.org/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React-PDF Documentation](https://react-pdf.org/)
- [Resend Documentation](https://resend.com/docs)
