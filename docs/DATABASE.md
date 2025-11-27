# SPTMS Database Schema

Complete documentation of all Payload CMS collections and their relationships.

## Table of Contents

- [Overview](#overview)
- [Collections](#collections)
  - [Users](#users)
  - [Customers](#customers)
  - [Customer Locations](#customer-locations)
  - [Carriers](#carriers)
  - [Loads](#loads)
  - [Tracking Events](#tracking-events)
  - [Invoices](#invoices)
  - [Carrier Payments](#carrier-payments)
  - [Media](#media)
- [Relationships](#relationships)
- [Indexes](#indexes)

## Overview

SPTMS uses MongoDB via Payload CMS. All collections are managed through Payload's admin interface and REST API.

### Database Structure

```
sptms (database)
├── users                    # System users and authentication
├── customers                # Customer companies
├── customer-locations       # Pickup/delivery addresses
├── carriers                 # Carrier companies
├── loads                    # Load records
├── tracking-events          # MacroPoint location history
├── invoices                 # Customer invoices
├── carrier-payments         # Carrier pay sheets
├── media                    # Document storage
├── payload-preferences      # Payload admin preferences
└── payload-migrations       # Schema version tracking
```

## Collections

### Users

Authentication and system access.

**Collection**: `users`
**Slug**: `users`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | email | Yes | User email address (unique) |
| `password` | password | Yes | Hashed password |
| `name` | text | No | User display name |
| `roles` | array | No | User roles (future use) |
| `createdAt` | date | Auto | Record creation timestamp |
| `updatedAt` | date | Auto | Last update timestamp |

#### Use Cases
- Admin login and authentication
- Access control (future)
- Audit trails

---

### Customers

Customer companies that ship freight.

**Collection**: `customers`
**Slug**: `customers`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `companyName` | text | Yes | Customer company name |
| `status` | select | Yes | active, inactive, on-hold |
| `primaryContact` | text | No | Main contact person |
| `email` | email | No | Primary email |
| `phone` | text | No | Primary phone |
| `alternatePhone` | text | No | Secondary phone |
| `additionalContacts` | array | No | Additional contact persons |
| `billingEmail` | email | No | Invoice recipient email |
| `paymentTerms` | select | No | due-on-receipt, net-15, net-30, net-45, net-60 |
| `creditLimit` | number | No | Maximum outstanding balance ($) |
| `quickbooksCustomerId` | text | No | QuickBooks sync ID (read-only) |
| `notes` | textarea | No | Internal notes |
| `specialInstructions` | textarea | No | Default load instructions |
| `requiresPOD` | checkbox | No | Requires POD for invoice (default: true) |
| `createdAt` | date | Auto | Record creation |
| `updatedAt` | date | Auto | Last update |

#### Relationships
- Has many `customer-locations`
- Has many `loads`

#### Use Cases
- Customer database management
- Billing and payment tracking
- QuickBooks integration
- Credit limit monitoring

---

### Customer Locations

Specific pickup and delivery addresses for customers.

**Collection**: `customer-locations`
**Slug**: `customer-locations`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer` | relationship | Yes | Reference to customers collection |
| `locationName` | text | Yes | Location identifier (e.g., "Main Warehouse") |
| `locationType` | select | Yes | pickup, delivery, both |
| `addressLine1` | text | Yes | Street address |
| `addressLine2` | text | No | Suite/unit number |
| `city` | text | Yes | City |
| `state` | text | Yes | State abbreviation |
| `zipCode` | text | Yes | ZIP code |
| `contactName` | text | No | On-site contact |
| `contactPhone` | text | No | Contact phone number |
| `hours` | textarea | No | Operating hours |
| `appointmentRequired` | checkbox | No | Appointment needed (default: false) |
| `specialInstructions` | textarea | No | Gate codes, parking, etc. |
| `notes` | textarea | No | Internal notes |
| `createdAt` | date | Auto | Record creation |
| `updatedAt` | date | Auto | Last update |

#### Relationships
- Belongs to one `customer`
- Referenced by `loads` (pickup and delivery)

#### Use Cases
- Quick load creation with saved addresses
- Contact information for drivers
- Operating hours and requirements

---

### Carriers

Trucking companies that haul freight.

**Collection**: `carriers`
**Slug**: `carriers`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `companyName` | text | Yes | Carrier company name |
| `status` | select | Yes | active, inactive, pending, do-not-use |
| `mcNumber` | text | Yes | MC authority number |
| `dotNumber` | text | Yes | DOT number |
| `safetyRating` | select | No | satisfactory, conditional, unsatisfactory, not-rated |
| `insuranceExpiration` | date | No | Insurance policy expiration |
| `w9OnFile` | checkbox | No | W-9 received (default: false) |
| `carrierPacketComplete` | checkbox | No | Onboarding complete (default: false) |
| `approvedDate` | date | No | Date approved for use |
| `primaryContact` | text | No | Main contact person |
| `email` | email | No | Primary email |
| `phone` | text | No | Primary phone |
| `dispatchEmail` | email | No | Email for rate confirmations |
| `additionalContacts` | array | No | Additional contacts |
| `equipmentTypes` | select[] | No | dry-van, reefer, flatbed, step-deck, power-only, hotshot, box-truck |
| `preferredLanes` | textarea | No | Preferred shipping lanes |
| `serviceAreas` | textarea | No | Service coverage areas |
| `paymentMethod` | select | No | standard, quick-pay, factoring |
| `factoringCompany` | text | No | Factoring company name |
| `ePayCarrierId` | text | No | ePay sync ID (read-only) |
| `performanceScore` | number | No | Auto-calculated (0-100) |
| `onTimePercentage` | number | No | Auto-calculated (0-100) |
| `notes` | textarea | No | Internal notes |
| `specialInstructions` | textarea | No | Special handling notes |
| `createdAt` | date | Auto | Record creation |
| `updatedAt` | date | Auto | Last update |

#### Relationships
- Has many `loads`

#### Use Cases
- Carrier database management
- Compliance tracking
- Performance monitoring
- Payment processing with ePay
- Equipment matching

---

### Loads

Individual freight shipments.

**Collection**: `loads`
**Slug**: `loads`

This is the core entity of the TMS.

#### Main Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `loadNumber` | text | Yes | Unique load identifier |
| `status` | select | Yes | booked, dispatched, in-transit, delivered, invoiced, paid, cancelled, tonu |
| `customer` | relationship | Yes | Reference to customers collection |
| `customerRate` | number | Yes | Amount charged to customer ($) |
| `customerCurrency` | select | Yes | USD (default) |

#### Reference Numbers

| Field | Type | Description |
|-------|------|-------------|
| `poNumber` | text | Purchase order number |
| `bolNumber` | text | Bill of lading number |
| `proNumber` | text | PRO number |

#### Pickup Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pickupLocation` | relationship | No | Reference to customer-locations |
| `pickupAddress` | group | No | Manual address entry (if not using saved location) |
| `pickupDate` | date | Yes | Pickup date/time |
| `pickupDateEnd` | date | No | Pickup window end |
| `pickupAppointment` | checkbox | No | Appointment required |
| `pickupInstructions` | textarea | No | Special instructions |

#### Delivery Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deliveryLocation` | relationship | No | Reference to customer-locations |
| `deliveryAddress` | group | No | Manual address entry |
| `deliveryDate` | date | Yes | Delivery date/time |
| `deliveryDateEnd` | date | No | Delivery window end |
| `deliveryAppointment` | checkbox | No | Appointment required |
| `deliveryInstructions` | textarea | No | Special instructions |

#### Freight Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `equipmentType` | select | Yes | dry-van, reefer, flatbed, step-deck, power-only, hotshot, box-truck |
| `weight` | number | No | Weight in pounds |
| `length` | number | No | Length in feet |
| `palletCount` | number | No | Number of pallets |
| `commodity` | text | No | Freight description |
| `specialRequirements` | select[] | No | team, hazmat, temp-controlled, liftgate, inside-delivery, tarps |
| `temperature` | text | No | Temperature range (e.g., "38-42°F") |

#### Carrier & Dispatch

| Field | Type | Description |
|-------|------|-------------|
| `carrier` | relationship | Reference to carriers collection |
| `carrierRate` | number | Amount paid to carrier ($) |
| `margin` | number | Profit margin (auto-calculated) |
| `driverName` | text | Driver name |
| `driverPhone` | text | Driver phone |
| `truckNumber` | text | Truck number |
| `trailerNumber` | text | Trailer number |
| `rateConSent` | checkbox | Rate confirmation sent (default: false) |
| `rateConSentDate` | date | When rate con was sent |

#### Accessorials

Array of additional charges:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | select | Yes | detention, layover, tonu, lumper, stop, fuel, other |
| `description` | text | No | Accessorial description |
| `amount` | number | Yes | Charge amount ($) |
| `billTo` | select | Yes | customer, carrier, internal |

#### Documents

| Field | Type | Description |
|-------|------|-------------|
| `documents` | relationship[] | References to media collection |
| `hasBOL` | checkbox | BOL received (default: false) |
| `hasPOD` | checkbox | POD received (default: false) |
| `hasRateCon` | checkbox | Rate con on file (default: false) |

#### MacroPoint Tracking

| Field | Type | Description |
|-------|------|-------------|
| `trackingId` | text | MacroPoint tracking ID (read-only) |
| `trackingActive` | checkbox | Tracking enabled (default: false) |
| `lastLocation` | text | Last known location (read-only) |
| `lastUpdate` | date | Last tracking update (read-only) |

#### Status History

Auto-tracked array of status changes:

| Field | Type | Description |
|-------|------|-------------|
| `status` | text | Status value |
| `timestamp` | date | When changed |
| `note` | text | Optional note |

#### Notes

| Field | Type | Description |
|-------|------|-------------|
| `internalNotes` | textarea | Private notes |
| `dispatchNotes` | textarea | Dispatch instructions |

#### Timestamps

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | date | Record creation (auto) |
| `updatedAt` | date | Last update (auto) |

#### Relationships
- Belongs to one `customer`
- References `customer-locations` for pickup and delivery
- Belongs to one `carrier`
- Has many `media` documents

#### Use Cases
- Complete load lifecycle management
- Status tracking and updates
- Margin calculation
- Document management
- MacroPoint integration
- Invoice generation
- Profitability analysis

---

### Tracking Events

Location history from MacroPoint tracking.

**Collection**: `tracking-events`
**Slug**: `tracking-events`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `load` | relationship | Yes | Reference to loads collection |
| `macropointOrderId` | text | No | MacroPoint order identifier |
| `eventType` | select | Yes | location, arrived-pickup, departed-pickup, arrived-delivery, departed-delivery, in-transit, delay, exception |
| `timestamp` | date | Yes | When event occurred |
| `latitude` | number | No | GPS latitude |
| `longitude` | number | No | GPS longitude |
| `city` | text | No | City name |
| `state` | text | No | State abbreviation |
| `eta` | date | No | Estimated time of arrival |
| `notes` | textarea | No | Event notes |
| `rawPayload` | json | No | Full webhook payload |
| `createdAt` | date | Auto | Record creation |
| `updatedAt` | date | Auto | Last update |

#### Relationships
- Belongs to one `load`

#### Use Cases
- Location history tracking
- Geofence event logging
- ETA tracking
- Audit trail for delivery proof

---

### Invoices

Customer invoices generated from loads.

**Collection**: `invoices`
**Slug**: `invoices`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoiceNumber` | text | Auto | Auto-generated (INV-YYYYMM-XXXX) |
| `status` | select | Yes | draft, sent, viewed, partial, paid, overdue, void |
| `customer` | relationship | Yes | Reference to customers collection |
| `loads` | relationship[] | No | Associated loads |
| `invoiceDate` | date | Yes | Invoice date |
| `dueDate` | date | Auto | Calculated from payment terms |
| `paymentTerms` | select | No | due-on-receipt, net-15, net-30, net-45, net-60 |
| `lineItems` | array | Yes | Invoice line items |
| `subtotal` | number | Auto | Auto-calculated |
| `total` | number | Auto | Auto-calculated |
| `payments` | array | No | Payment records |
| `amountPaid` | number | Auto | Total payments received |
| `balanceDue` | number | Auto | Total - amountPaid |
| `billingAddress` | group | No | Customer billing address |
| `quickbooks.invoiceId` | text | No | QuickBooks invoice ID |
| `quickbooks.syncedAt` | date | No | Last sync timestamp |
| `quickbooks.syncStatus` | select | No | not-synced, synced, error |
| `notes` | textarea | No | Notes (appears on invoice) |
| `sentAt` | date | No | When invoice was sent |
| `sentTo` | text | No | Email recipient |
| `createdAt` | date | Auto | Record creation |
| `updatedAt` | date | Auto | Last update |

#### Line Items Array Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | text | Yes | Line item description |
| `quantity` | number | No | Quantity (default: 1) |
| `rate` | number | Yes | Unit rate |
| `total` | number | Auto | Auto-calculated |
| `load` | relationship | No | Related load |

#### Payments Array Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paymentDate` | date | Yes | Date payment received |
| `amount` | number | Yes | Payment amount |
| `method` | select | No | check, ach, wire, credit-card, other |
| `referenceNumber` | text | No | Check/reference number |
| `notes` | text | No | Payment notes |

#### Relationships
- Belongs to one `customer`
- Has many `loads`

#### Use Cases
- Customer billing
- Accounts receivable tracking
- Payment recording
- QuickBooks integration
- PDF invoice generation

---

### Carrier Payments

Carrier pay sheets for carrier compensation.

**Collection**: `carrier-payments`
**Slug**: `carrier-payments`

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paySheetNumber` | text | Auto | Auto-generated (PAY-YYYYMM-XXXX) |
| `status` | select | Yes | pending, approved, processing, paid, cancelled |
| `carrier` | relationship | Yes | Reference to carriers collection |
| `loads` | relationship[] | No | Associated loads |
| `paymentType` | select | Yes | standard, quick-pay, factoring |
| `quickPayFee` | number | No | Quick pay fee percentage |
| `lineItems` | array | Yes | Pay sheet line items |
| `deductions` | array | No | Deductions (advances, fees) |
| `subtotal` | number | Auto | Auto-calculated |
| `total` | number | Auto | After deductions |
| `factoringCompany` | text | No | Factoring company name |
| `epay.transactionId` | text | No | ePay transaction ID |
| `epay.submittedAt` | date | No | When submitted to ePay |
| `epay.paidAt` | date | No | When payment completed |
| `epay.syncStatus` | select | No | not-synced, pending, paid, error |
| `notes` | textarea | No | Internal notes |
| `approvedBy` | relationship | No | User who approved |
| `approvedAt` | date | No | Approval timestamp |
| `createdAt` | date | Auto | Record creation |
| `updatedAt` | date | Auto | Last update |

#### Line Items Array Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | text | Yes | Line item description |
| `amount` | number | Yes | Amount |
| `load` | relationship | No | Related load |
| `type` | select | Yes | linehaul, detention, layover, lumper, other |

#### Deductions Array Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | text | Yes | Deduction description |
| `amount` | number | Yes | Deduction amount |
| `type` | select | Yes | advance, quick-pay-fee, damage, other |

#### Relationships
- Belongs to one `carrier`
- Has many `loads`
- Belongs to one `user` (approver)

#### Use Cases
- Carrier compensation
- Quick pay processing
- Factoring integration
- ePay integration
- Accounts payable tracking

---

### Media

File uploads and document storage.

**Collection**: `media`
**Slug**: `media`

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `filename` | text | Original filename (auto) |
| `mimeType` | text | File MIME type (auto) |
| `filesize` | number | File size in bytes (auto) |
| `width` | number | Image width (auto, images only) |
| `height` | number | Image height (auto, images only) |
| `url` | text | File URL (auto) |
| `alt` | text | Alt text description |
| `documentType` | select | bol, pod, rate-con, invoice, lumper, detention, insurance, w9, carrier-packet, other |
| `createdAt` | date | Upload date (auto) |
| `updatedAt` | date | Last update (auto) |

#### Supported File Types
- Images: image/*
- PDFs: application/pdf
- Word: application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

#### Storage
- **Development**: Local filesystem (`/media` directory)
- **Production**: Vercel Blob Storage (planned)

#### Relationships
- Referenced by `loads` collection

#### Use Cases
- BOL and POD storage
- Rate confirmation archival
- Invoice documentation
- Carrier compliance documents
- Insurance certificates

---

## Relationships

### Entity Relationship Diagram

```
Users
  └── approves → Carrier Payments

Customers
  ├── has many → Customer Locations
  ├── has many → Loads
  └── has many → Invoices

Customer Locations
  ├── belongs to → Customer
  └── referenced by → Loads (pickup/delivery)

Carriers
  ├── has many → Loads
  └── has many → Carrier Payments

Loads
  ├── belongs to → Customer
  ├── references → Customer Location (pickup)
  ├── references → Customer Location (delivery)
  ├── belongs to → Carrier
  ├── has many → Media (documents)
  ├── has many → Tracking Events
  ├── referenced by → Invoices
  └── referenced by → Carrier Payments

Tracking Events
  └── belongs to → Load

Invoices
  ├── belongs to → Customer
  └── references many → Loads

Carrier Payments
  ├── belongs to → Carrier
  ├── references many → Loads
  └── approved by → User

Media
  └── referenced by → Loads
```

### Key Relationships

1. **Customer → Customer Locations**: One-to-many
   - A customer can have multiple shipping/receiving locations
   - Each location belongs to exactly one customer

2. **Customer → Loads**: One-to-many
   - A customer can have many loads
   - Each load belongs to exactly one customer

3. **Carrier → Loads**: One-to-many
   - A carrier can haul many loads
   - Each load is assigned to one carrier

4. **Load → Customer Locations**: Many-to-one (pickup and delivery)
   - Each load references one pickup location
   - Each load references one delivery location
   - Locations can be used by multiple loads

5. **Load → Media**: Many-to-many
   - A load can have multiple documents
   - Documents are linked to specific loads

## Indexes

### Recommended Indexes

For optimal query performance, the following indexes are recommended:

#### Customers
```javascript
{ companyName: 1 }
{ status: 1 }
{ email: 1 }
```

#### Customer Locations
```javascript
{ customer: 1 }
{ city: 1, state: 1 }
```

#### Carriers
```javascript
{ companyName: 1 }
{ mcNumber: 1 }
{ dotNumber: 1 }
{ status: 1 }
```

#### Loads
```javascript
{ loadNumber: 1 } // unique
{ status: 1 }
{ customer: 1 }
{ carrier: 1 }
{ pickupDate: 1 }
{ deliveryDate: 1 }
{ createdAt: -1 }
```

#### Media
```javascript
{ documentType: 1 }
{ createdAt: -1 }
```

#### Tracking Events
```javascript
{ load: 1 }
{ load: 1, timestamp: -1 }
{ macropointOrderId: 1 }
{ eventType: 1 }
```

#### Invoices
```javascript
{ invoiceNumber: 1 } // unique
{ customer: 1 }
{ status: 1 }
{ dueDate: 1 }
{ createdAt: -1 }
```

#### Carrier Payments
```javascript
{ paySheetNumber: 1 } // unique
{ carrier: 1 }
{ status: 1 }
{ createdAt: -1 }
```

### Compound Indexes

```javascript
// Loads
{ status: 1, pickupDate: 1 }
{ customer: 1, status: 1 }
{ carrier: 1, status: 1 }
{ status: 1, deliveryDate: 1 }

// Invoices
{ customer: 1, status: 1 }
{ status: 1, dueDate: 1 }

// Carrier Payments
{ carrier: 1, status: 1 }
{ status: 1, createdAt: -1 }
```

---

**Last Updated**: November 2024
