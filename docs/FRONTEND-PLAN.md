# SPTMS Frontend Development Plan

Custom dispatcher dashboard for daily operations, with Payload CMS admin for configuration and data management.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        SPTMS                                │
├─────────────────────────────┬───────────────────────────────┤
│   Custom Dashboard (/)      │    Payload Admin (/admin)     │
│   - Dispatcher workflow     │    - Data management          │
│   - Load operations         │    - User management          │
│   - Tracking & maps         │    - System configuration     │
│   - Reports & analytics     │    - Bulk operations          │
└─────────────────────────────┴───────────────────────────────┘
```

## Tech Stack

- **Framework**: Next.js 15 App Router
- **UI Components**: shadcn/ui (already configured)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query) for server state
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Maps**: Mapbox GL or Leaflet
- **Tables**: TanStack Table

---

## Phase 1: Foundation & Layout

### 1.1 App Shell & Navigation

**Files to create:**
- `src/components/layout/app-shell.tsx` - Main layout wrapper
- `src/components/layout/sidebar.tsx` - Navigation sidebar
- `src/components/layout/header.tsx` - Top header with user menu
- `src/components/layout/mobile-nav.tsx` - Mobile navigation

**Features:**
- Responsive sidebar (collapsible on mobile)
- User dropdown (profile, logout)
- Breadcrumbs
- Global search
- Notification bell

### 1.2 Dashboard Home

**Route**: `/dashboard`

**Components:**
- KPI cards (loads today, revenue MTD, margin %, open AR)
- Active loads summary (by status)
- Recent activity feed
- Quick actions (new load, search trucks, etc.)
- Alerts panel (late loads, missing docs, expiring insurance)

---

## Phase 2: Load Management

### 2.1 Load Board / List View

**Route**: `/dashboard/loads`

**Features:**
- Filterable/sortable data table
- Status filters (tabs or dropdown)
- Quick status change
- Bulk actions (invoice, update status)
- Column customization
- Export to CSV

**Views:**
- Table view (default)
- Kanban board view (by status)
- Calendar view (by pickup/delivery date)

### 2.2 Load Detail Page

**Route**: `/dashboard/loads/[id]`

**Sections:**
- Header with status badge, quick actions
- Customer & billing info
- Pickup/delivery details with map
- Carrier & driver info
- Tracking timeline (MacroPoint events)
- Documents panel
- Accessorials
- Notes & activity log

**Actions:**
- Edit load (modal or inline)
- Change status
- Assign carrier
- Generate/send rate con
- Initiate tracking
- Create invoice
- Duplicate load

### 2.3 New Load Form

**Route**: `/dashboard/loads/new`

**Features:**
- Multi-step wizard or tabbed form
- Customer autocomplete with recent locations
- DAT rate lookup integration
- Margin calculator
- Equipment type selection
- Save as draft

### 2.4 Rate Calculator

**Component**: `src/components/loads/rate-calculator.tsx`

**Features:**
- Origin/destination input
- Equipment type selection
- Fetch DAT rates button
- Display spot/contract rates
- Margin slider/input
- Suggested customer rate
- Rate history chart

---

## Phase 3: Carrier Management

### 3.1 Carrier List

**Route**: `/dashboard/carriers`

**Features:**
- Search and filter
- Status indicators (active, pending, inactive)
- Quick view panel
- Compliance status badges (insurance, authority)

### 3.2 Carrier Detail

**Route**: `/dashboard/carriers/[id]`

**Sections:**
- Company info & contacts
- Equipment & lanes
- Compliance documents
- Load history with carrier
- Payment history
- Performance metrics

### 3.3 Truck Search (DAT Integration)

**Route**: `/dashboard/trucks/search`

**Features:**
- Origin/destination search
- Equipment type filter
- Date range
- Results table with carrier info
- Click to view carrier details
- Quick assign to load

---

## Phase 4: Tracking & Visibility

### 4.1 Tracking Dashboard

**Route**: `/dashboard/tracking`

**Features:**
- Map view with all active loads
- Load markers with status colors
- Click marker for load details popup
- Filter by status, customer, carrier
- ETA information
- Exception alerts

### 4.2 Load Tracking Detail

**Integrated in**: `/dashboard/loads/[id]`

**Features:**
- Real-time map with route
- Location history timeline
- ETA to next stop
- Geofence events
- Manual check call logging

---

## Phase 5: Financial Management

### 5.1 Invoicing

**Route**: `/dashboard/invoices`

**Features:**
- Invoice list with status filters
- Create invoice from loads
- Invoice preview
- Email invoice
- Mark as paid
- Aging report view

### 5.2 Carrier Payments

**Route**: `/dashboard/payments`

**Features:**
- Pay sheet list
- Create pay sheet from loads
- Payment status tracking
- Quick pay processing
- Aging report view

### 5.3 Profitability Reports

**Route**: `/dashboard/reports`

**Report Types:**
- Summary dashboard
- By customer
- By carrier
- By lane
- By time period

**Features:**
- Date range picker
- Interactive charts
- Drill-down capability
- Export to PDF/Excel

---

## Phase 6: Customer Management

### 6.1 Customer List

**Route**: `/dashboard/customers`

**Features:**
- Search and filter
- Status filter
- Credit status indicators
- Quick view panel

### 6.2 Customer Detail

**Route**: `/dashboard/customers/[id]`

**Sections:**
- Company info & contacts
- Locations list
- Load history
- Invoice history
- Profitability summary
- Credit information

---

## Component Library

### Core UI Components (shadcn/ui)

Install required components:
```bash
npx shadcn@latest add button card input label select textarea
npx shadcn@latest add table tabs dialog sheet dropdown-menu
npx shadcn@latest add badge avatar separator skeleton
npx shadcn@latest add form toast sonner popover command
npx shadcn@latest add calendar date-picker checkbox radio-group
npx shadcn@latest add progress alert alert-dialog
```

### Custom Components to Build

**Data Display:**
- `DataTable` - Sortable, filterable table with pagination
- `KPICard` - Metric display card
- `StatusBadge` - Load/invoice status badges
- `Timeline` - Activity/tracking timeline
- `LoadCard` - Load summary card for kanban

**Forms:**
- `AddressInput` - Address autocomplete
- `CustomerSelect` - Customer search/select
- `CarrierSelect` - Carrier search/select
- `LocationSelect` - Location picker
- `RateInput` - Currency input with formatting
- `DateRangePicker` - Date range selection

**Maps:**
- `LoadMap` - Single load tracking map
- `FleetMap` - Multiple loads on map
- `RouteDisplay` - Origin/destination route

**Charts:**
- `RevenueChart` - Revenue over time
- `MarginChart` - Margin trends
- `LoadVolumeChart` - Load counts
- `RateHistoryChart` - DAT rate history

---

## File Structure

```
src/
├── app/
│   └── (frontend)/
│       ├── dashboard/
│       │   ├── layout.tsx
│       │   ├── page.tsx              # Dashboard home
│       │   ├── loads/
│       │   │   ├── page.tsx          # Load list
│       │   │   ├── new/
│       │   │   │   └── page.tsx      # New load form
│       │   │   └── [id]/
│       │   │       └── page.tsx      # Load detail
│       │   ├── carriers/
│       │   │   ├── page.tsx          # Carrier list
│       │   │   └── [id]/
│       │   │       └── page.tsx      # Carrier detail
│       │   ├── trucks/
│       │   │   └── search/
│       │   │       └── page.tsx      # DAT truck search
│       │   ├── customers/
│       │   │   ├── page.tsx          # Customer list
│       │   │   └── [id]/
│       │   │       └── page.tsx      # Customer detail
│       │   ├── invoices/
│       │   │   ├── page.tsx          # Invoice list
│       │   │   └── [id]/
│       │   │       └── page.tsx      # Invoice detail
│       │   ├── payments/
│       │   │   └── page.tsx          # Carrier payments
│       │   ├── tracking/
│       │   │   └── page.tsx          # Tracking map
│       │   └── reports/
│       │       └── page.tsx          # Reports dashboard
│       ├── layout.tsx
│       └── page.tsx                  # Landing/login redirect
├── components/
│   ├── ui/                           # shadcn components
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── mobile-nav.tsx
│   ├── dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── recent-activity.tsx
│   │   ├── alerts-panel.tsx
│   │   └── quick-actions.tsx
│   ├── loads/
│   │   ├── load-table.tsx
│   │   ├── load-card.tsx
│   │   ├── load-form.tsx
│   │   ├── load-detail.tsx
│   │   ├── status-badge.tsx
│   │   ├── rate-calculator.tsx
│   │   └── tracking-timeline.tsx
│   ├── carriers/
│   │   ├── carrier-table.tsx
│   │   ├── carrier-select.tsx
│   │   └── truck-search.tsx
│   ├── customers/
│   │   ├── customer-table.tsx
│   │   └── customer-select.tsx
│   ├── invoices/
│   │   ├── invoice-table.tsx
│   │   └── invoice-preview.tsx
│   ├── maps/
│   │   ├── load-map.tsx
│   │   └── fleet-map.tsx
│   └── charts/
│       ├── revenue-chart.tsx
│       ├── margin-chart.tsx
│       └── rate-history-chart.tsx
├── hooks/
│   ├── use-loads.ts
│   ├── use-carriers.ts
│   ├── use-customers.ts
│   ├── use-invoices.ts
│   └── use-dat-rates.ts
└── lib/
    ├── api-client.ts                 # API wrapper
    └── utils.ts                      # Utilities
```

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. Install dependencies (React Query, shadcn components)
2. Build app shell, sidebar, header
3. Create dashboard layout
4. Build basic KPI cards with mock data
5. Set up API client and React Query

### Sprint 2: Load Management Core (Week 3-4)
1. Load list page with data table
2. Load detail page (read-only first)
3. Load form (new/edit)
4. Status change functionality
5. Rate calculator component

### Sprint 3: Load Operations (Week 5-6)
1. Rate confirmation generation
2. Carrier assignment flow
3. Tracking initiation
4. Document uploads
5. Load duplication

### Sprint 4: Carriers & Trucks (Week 7-8)
1. Carrier list and detail pages
2. DAT truck search interface
3. Carrier assignment from search
4. Carrier compliance display

### Sprint 5: Tracking & Maps (Week 9-10)
1. Map component integration
2. Single load tracking view
3. Fleet tracking dashboard
4. Tracking timeline component

### Sprint 6: Financial (Week 11-12)
1. Invoice list and detail
2. Invoice generation flow
3. Carrier payment list
4. Basic reports dashboard

### Sprint 7: Polish & Optimization (Week 13-14)
1. Customer pages
2. Advanced reports
3. Mobile responsiveness
4. Performance optimization
5. Error handling & loading states

---

## Authentication Flow

Use Payload's existing auth system:

```typescript
// Check auth on dashboard layout
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function DashboardLayout({ children }) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect('/admin/login')
  }

  return <AppShell user={user}>{children}</AppShell>
}
```

---

## API Integration Pattern

Use React Query for all data fetching:

```typescript
// hooks/use-loads.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useLoads(filters?: LoadFilters) {
  return useQuery({
    queryKey: ['loads', filters],
    queryFn: () => fetchLoads(filters),
  })
}

export function useLoad(id: string) {
  return useQuery({
    queryKey: ['loads', id],
    queryFn: () => fetchLoad(id),
  })
}

export function useUpdateLoadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateLoadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] })
    },
  })
}
```

---

## Next Steps

1. **Approve this plan** or request changes
2. **Start Sprint 1** - Foundation & Layout
3. **Review after each sprint** for adjustments

---

**Last Updated**: November 2025
