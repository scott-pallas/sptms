# 3PL Logistics TMS - Feature Plan

## Overview

Custom Transportation Management System (TMS) to replace Aljex and integrate with existing tools: ePay, QuickBooks, DAT, and MacroPoint. Designed for a freight brokerage currently handling ~100 loads/month with plans to scale.

## Current System Landscape

| System | Purpose | Integration Priority |
|--------|---------|---------------------|
| Aljex | TMS (being replaced) | N/A |
| MacroPoint | Real-time freight tracking | High |
| ePay | Carrier payments/factoring | High |
| QuickBooks | Accounting | High |
| DAT | Load board / market rates | Medium |

---

## Phase 1: Core Load Management ✅ COMPLETE

**Goal:** Replace basic Aljex functionality for day-to-day load operations.
**Status:** Implemented November 2024

### 1.1 Load Entry & Management

- Create new loads with shipper/consignee details
- Pickup and delivery dates/times with appointment scheduling
- Equipment type selection (dry van, reefer, flatbed, etc.)
- Commodity description and weight
- Reference numbers (PO, BOL, PRO)
- Special instructions and accessorials
- Load duplication for recurring lanes

### 1.2 Customer Management

- Customer database with contact information
- Multiple locations per customer
- Default billing terms and payment history
- Customer-specific rate agreements
- Credit limit tracking

### 1.3 Carrier Management

- Carrier database with MC/DOT numbers
- Contact information and preferred lanes
- Equipment types available
- Insurance and compliance document storage
- W-9 and payment information
- Carrier packet workflow (onboarding)

### 1.4 Dispatch & Assignment

- Assign carriers to loads
- Rate confirmation generation (PDF)
- Email rate cons directly to carriers
- Driver name and contact capture
- Truck and trailer numbers

### 1.5 Status Tracking

- Load status workflow: Booked → Dispatched → In Transit → Delivered → Invoiced → Paid
- Manual status updates
- Timestamp logging for all status changes
- Exception flagging (late, TONU, claim, etc.)

### 1.6 Document Management

- Upload and attach documents to loads (BOL, POD, rate con, lumper receipts)
- Document type categorization
- Required document checklist per load
- Bulk document download

---

## Phase 2: Tracking Integration (MacroPoint) ✅ COMPLETE

**Goal:** Real-time visibility without manual check calls.
**Status:** Implemented November 2024

### 2.1 MacroPoint Integration

- API connection to MacroPoint
- Automatic tracking initiation on dispatch
- Real-time location updates displayed on load detail
- Map view of load location
- ETA calculations and updates

### 2.2 Automated Status Updates

- Auto-update load status based on geofence triggers
- Pickup confirmation when driver arrives at origin
- Delivery confirmation when driver arrives at destination
- Alert generation for delays or off-route

### 2.3 Customer Visibility

- Customer portal with tracking access (future consideration)
- Automated tracking email updates to customers
- Shareable tracking links

---

## Phase 3: Financial Management ✅ COMPLETE

**Goal:** Connect billing, payments, and accounting into a unified flow.
**Status:** Implemented November 2024

### 3.1 Customer Invoicing

- Generate invoices from completed loads
- Customizable invoice templates
- Batch invoicing for multiple loads
- Invoice PDF generation and email delivery
- Aging report for receivables

### 3.2 QuickBooks Integration

- Sync customers to QuickBooks
- Push invoices to QuickBooks automatically
- Pull payment status back to TMS
- Revenue recognition and reporting

### 3.3 Carrier Pay & ePay Integration

- Carrier pay sheet generation
- Integration with ePay for carrier payments
- Quick pay vs standard pay tracking
- Carrier aging and payment history
- Sync payment status from ePay

### 3.4 Profitability Tracking

- Per-load margin calculation (customer rate - carrier cost - accessorials)
- Lane profitability analysis
- Customer profitability reporting
- Carrier cost analysis

---

## Phase 4: Load Board Integration (DAT) ✅ COMPLETE

**Goal:** Streamline finding capacity and posting available freight.
**Status:** Implemented November 2025

### 4.1 DAT Integration

- Post available loads to DAT
- Search DAT for available trucks
- Pull market rate data for lane pricing
- Manage active postings (update/remove)

### 4.2 Rate Intelligence

- Historical lane rate tracking (90-day default)
- Market rate comparison for quoting
- Rate trending and analytics
- Suggested rate calculation with target margins

---

## Phase 5: Compliance & Carrier Vetting

**Goal:** Reduce risk and ensure carrier quality.

### 5.1 Carrier Compliance

- Automatic FMCSA data pull (safety rating, authority status, insurance)
- Insurance expiration tracking and alerts
- Authority monitoring for changes
- Carrier scorecard (on-time %, claims, etc.)

### 5.2 Carrier Onboarding Workflow

- Digital carrier packet
- Required document checklist
- Approval workflow before dispatching
- Automatic compliance re-verification

---

## Phase 6: Reporting & Analytics

**Goal:** Actionable insights for decision making.

### 6.1 Operational Reports

- Load volume by time period
- Loads by status
- On-time pickup/delivery rates
- Average time to invoice and payment

### 6.2 Financial Reports

- Revenue by customer, lane, carrier
- Margin analysis
- Aging summaries (AR and AP)
- Cash flow projections

### 6.3 Dashboard

- Daily/weekly load summary
- Loads needing attention (missing docs, late, unpaid)
- Revenue and margin KPIs
- Tracking map with active loads

---

## Phase 7: Growth & Automation Features

**Goal:** Scale operations without adding headcount proportionally.

### 7.1 Automated Workflows

- Auto-send tracking links on dispatch
- Auto-request POD from carrier after delivery
- Auto-generate invoice on POD receipt
- Payment reminder automation

### 7.2 Customer Portal

- Customer login to view their loads
- Self-service tracking
- Invoice and document access
- Load request submission

### 7.3 Carrier Portal

- Carrier login to view available loads
- Accept/decline load offers
- Upload documents directly
- View payment status

### 7.4 Quoting & Rate Management

- Quick quote tool with rate lookups
- Quote to load conversion
- Rate agreement management
- Contract rate vs spot rate tracking

### 7.5 Mobile Access

- Responsive design for mobile use
- Key functions available on phone (status updates, tracking, approvals)

---

## Technical Considerations

### Recommended Stack

- **Frontend:** Next.js with React
- **Backend:** Next.js API routes or separate Node.js service
- **Database:** MongoDB (flexible schema for varying load requirements) or PostgreSQL (stronger for financial data integrity)
- **Auth:** Payload CMS admin or NextAuth.js
- **Hosting:** Vercel (frontend) + Railway or Render (backend/DB if needed)
- **File Storage:** Vercel Blob or AWS S3 for documents
- **PDF Generation:** React-PDF or Puppeteer
- **Email:** Resend (already familiar from tournament project)

### Integration APIs to Research

- MacroPoint API documentation
- ePay API availability
- QuickBooks Online API
- DAT API (or alternatives like Truckstop)
- FMCSA SAFER Web Services

### Data Model Core Entities

- Loads
- Customers
- Customer Locations
- Carriers
- Carrier Contacts
- Drivers
- Documents
- Invoices
- Carrier Pay Records
- Users
- Tracking Events

---

## Implementation Timeline (Estimated)

| Phase | Description | Duration |
|-------|-------------|----------|
| Phase 1 | Core Load Management | 6-8 weeks |
| Phase 2 | MacroPoint Integration | 2-3 weeks |
| Phase 3 | Financial Management | 4-6 weeks |
| Phase 4 | DAT Integration | 2-3 weeks |
| Phase 5 | Compliance & Vetting | 2-3 weeks |
| Phase 6 | Reporting & Analytics | 3-4 weeks |
| Phase 7 | Growth Features | Ongoing |

**Total MVP (Phases 1-3):** ✅ COMPLETE (November 2024)

---

## Open Questions

1. What specific Aljex features do they use daily vs occasionally?
2. Do they have any EDI requirements with customers or carriers?
3. What does their current rate confirmation template look like?
4. How do they handle accessorials (detention, layover, TONU)?
5. Do they need multi-user with role-based permissions?
6. What's the timeline pressure—when does Aljex renewal come up?
7. Are there specific reports they pull from Aljex regularly?
