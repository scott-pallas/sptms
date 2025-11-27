# SPTMS API Documentation

Complete REST API reference for the SPTMS Transportation Management System.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Common Patterns](#common-patterns)
- [Collections API](#collections-api)
  - [Customers](#customers-api)
  - [Customer Locations](#customer-locations-api)
  - [Carriers](#carriers-api)
  - [Loads](#loads-api)
  - [Invoices](#invoices-api)
  - [Carrier Payments](#carrier-payments-api)
  - [Tracking Events](#tracking-events-api)
  - [Media](#media-api)
  - [Users](#users-api)
- [Custom Endpoints](#custom-endpoints)
  - [Load Operations](#load-operations)
  - [MacroPoint Tracking](#macropoint-tracking)
  - [Invoice Generation](#invoice-generation)
  - [Carrier Payment Generation](#carrier-payment-generation)
  - [Profitability Reports](#profitability-reports)
  - [DAT Load Board](#dat-load-board)
- [GraphQL API](#graphql-api)
- [Error Handling](#error-handling)

## Overview

SPTMS provides a RESTful API powered by Payload CMS. All endpoints follow standard REST conventions and return JSON responses.

### API Features

- ✅ CRUD operations on all collections
- ✅ Advanced filtering and searching
- ✅ Pagination
- ✅ Field selection
- ✅ Relationship population
- ✅ File uploads
- ✅ Authentication via JWT
- ✅ GraphQL endpoint (alternative to REST)

## Authentication

### Login

**Endpoint**: `POST /api/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response**:
```json
{
  "message": "Auth Passed",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "exp": 1234567890
}
```

### Using the Token

Include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://localhost:3000/api/loads
```

### Logout

**Endpoint**: `POST /api/users/logout`

**Headers**:
```
Authorization: Bearer YOUR_TOKEN
```

## Base URL

**Development**: `http://localhost:3000/api`
**Production**: `https://yourdomain.com/api`

## Common Patterns

### Standard Endpoints

All collections follow the same pattern:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{collection}` | List all documents |
| GET | `/api/{collection}/:id` | Get single document |
| POST | `/api/{collection}` | Create new document |
| PATCH | `/api/{collection}/:id` | Update document |
| DELETE | `/api/{collection}/:id` | Delete document |

### Query Parameters

#### Pagination

```bash
GET /api/loads?page=2&limit=20
```

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 10, max: 100)

#### Filtering

```bash
GET /api/loads?where[status][equals]=dispatched
GET /api/customers?where[companyName][contains]=Acme
```

**Available Operators**:
- `equals`
- `not_equals`
- `like` (case-insensitive)
- `contains`
- `in` (array of values)
- `not_in`
- `greater_than`
- `greater_than_equal`
- `less_than`
- `less_than_equal`
- `exists`

#### Sorting

```bash
GET /api/loads?sort=-pickupDate
GET /api/customers?sort=companyName
```

- Prefix with `-` for descending order
- No prefix for ascending order

#### Field Selection

```bash
GET /api/loads?select=loadNumber,status,customer
```

Returns only specified fields.

#### Depth (Relationship Population)

```bash
GET /api/loads?depth=1
```

- `depth=0`: No population (IDs only)
- `depth=1`: Populate one level
- `depth=2`: Populate two levels

**Example**:
```bash
GET /api/loads/123?depth=2
```

Returns load with:
- Customer data populated
- Carrier data populated
- Customer locations populated
- Documents populated

## Collections API

### Customers API

#### List All Customers

```bash
GET /api/customers
```

**Example Response**:
```json
{
  "docs": [
    {
      "id": "customer-1",
      "companyName": "Acme Corporation",
      "status": "active",
      "email": "billing@acme.com",
      "paymentTerms": "net-30",
      "creditLimit": 50000,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "totalDocs": 45,
  "limit": 10,
  "totalPages": 5,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true
}
```

#### Get Customer by ID

```bash
GET /api/customers/:id?depth=1
```

**Response**: Returns customer with populated locations.

#### Create Customer

```bash
POST /api/customers
```

**Request Body**:
```json
{
  "companyName": "New Customer Inc",
  "status": "active",
  "email": "contact@newcustomer.com",
  "phone": "555-0100",
  "paymentTerms": "net-30",
  "creditLimit": 25000,
  "requiresPOD": true
}
```

#### Update Customer

```bash
PATCH /api/customers/:id
```

**Request Body** (partial update):
```json
{
  "status": "on-hold",
  "notes": "Credit limit reached"
}
```

#### Delete Customer

```bash
DELETE /api/customers/:id
```

---

### Customer Locations API

#### List Locations for a Customer

```bash
GET /api/customer-locations?where[customer][equals]=CUSTOMER_ID
```

#### Create Location

```bash
POST /api/customer-locations
```

**Request Body**:
```json
{
  "customer": "customer-id",
  "locationName": "Main Warehouse",
  "locationType": "both",
  "addressLine1": "123 Industrial Blvd",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "contactName": "John Doe",
  "contactPhone": "555-0200",
  "appointmentRequired": true
}
```

---

### Carriers API

#### List All Carriers

```bash
GET /api/carriers?where[status][equals]=active
```

#### Search Carriers by Equipment

```bash
GET /api/carriers?where[equipmentTypes][in]=dry-van,reefer
```

#### Get Carrier by MC Number

```bash
GET /api/carriers?where[mcNumber][equals]=123456
```

#### Create Carrier

```bash
POST /api/carriers
```

**Request Body**:
```json
{
  "companyName": "Fast Freight LLC",
  "status": "pending",
  "mcNumber": "MC123456",
  "dotNumber": "DOT789012",
  "email": "dispatch@fastfreight.com",
  "phone": "555-0300",
  "equipmentTypes": ["dry-van", "reefer"],
  "paymentMethod": "standard"
}
```

---

### Loads API

#### List All Loads

```bash
GET /api/loads?sort=-createdAt&limit=20
```

#### Get Loads by Status

```bash
GET /api/loads?where[status][equals]=in-transit&depth=2
```

Returns loads in transit with customer, carrier, and location data populated.

#### Get Loads by Date Range

```bash
GET /api/loads?where[pickupDate][greater_than_equal]=2024-01-01&where[pickupDate][less_than]=2024-02-01
```

#### Get Single Load with All Details

```bash
GET /api/loads/:id?depth=2
```

**Response Example**:
```json
{
  "id": "load-123",
  "loadNumber": "TMS-2024-00123",
  "status": "in-transit",
  "customer": {
    "id": "customer-1",
    "companyName": "Acme Corporation",
    "email": "billing@acme.com"
  },
  "customerRate": 2500,
  "pickupDate": "2024-01-20T08:00:00.000Z",
  "pickupLocation": {
    "id": "location-1",
    "locationName": "Main Warehouse",
    "city": "Los Angeles",
    "state": "CA"
  },
  "deliveryDate": "2024-01-22T14:00:00.000Z",
  "deliveryLocation": {
    "id": "location-2",
    "locationName": "Distribution Center",
    "city": "Phoenix",
    "state": "AZ"
  },
  "equipmentType": "dry-van",
  "weight": 42000,
  "carrier": {
    "id": "carrier-1",
    "companyName": "Fast Freight LLC",
    "mcNumber": "MC123456"
  },
  "carrierRate": 2000,
  "margin": 500,
  "driverName": "Mike Johnson",
  "driverPhone": "555-0400",
  "documents": [
    {
      "id": "doc-1",
      "filename": "BOL-TMS-2024-00123.pdf",
      "documentType": "bol",
      "url": "/media/bol-123.pdf"
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-20T15:30:00.000Z"
}
```

#### Create Load

```bash
POST /api/loads
```

**Request Body**:
```json
{
  "loadNumber": "TMS-2024-00150",
  "status": "booked",
  "customer": "customer-id",
  "customerRate": 3000,
  "pickupLocation": "location-id",
  "pickupDate": "2024-02-01T08:00:00.000Z",
  "deliveryLocation": "location-id-2",
  "deliveryDate": "2024-02-03T14:00:00.000Z",
  "equipmentType": "reefer",
  "weight": 40000,
  "commodity": "Produce",
  "specialRequirements": ["temp-controlled"],
  "temperature": "34-38°F"
}
```

#### Update Load Status

```bash
PATCH /api/loads/:id
```

**Request Body**:
```json
{
  "status": "dispatched",
  "carrier": "carrier-id",
  "carrierRate": 2400,
  "driverName": "Sarah Williams",
  "driverPhone": "555-0500",
  "truckNumber": "T-1234",
  "trailerNumber": "TR-5678"
}
```

#### Add Accessorial

```bash
PATCH /api/loads/:id
```

**Request Body**:
```json
{
  "accessorials": [
    {
      "type": "detention",
      "description": "2 hours detention at pickup",
      "amount": 150,
      "billTo": "customer"
    }
  ]
}
```

---

### Media API

#### Upload Document

```bash
POST /api/media
```

**Request** (multipart/form-data):
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "documentType=bol" \
  -F "alt=BOL for Load TMS-2024-00123" \
  http://localhost:3000/api/media
```

**Response**:
```json
{
  "doc": {
    "id": "media-123",
    "filename": "document.pdf",
    "mimeType": "application/pdf",
    "filesize": 245678,
    "url": "/media/document-abc123.pdf",
    "documentType": "bol",
    "alt": "BOL for Load TMS-2024-00123",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

#### List Documents by Type

```bash
GET /api/media?where[documentType][equals]=pod
```

#### Download Document

```bash
GET /api/media/:id
```

Returns the file for download.

---

### Invoices API

#### List Invoices

```bash
GET /api/invoices?where[status][equals]=draft
```

#### Get Invoice by Number

```bash
GET /api/invoices?where[invoiceNumber][equals]=INV-202411-0001
```

#### Create Invoice

```bash
POST /api/invoices
```

**Request Body**:
```json
{
  "customer": "customer-id",
  "invoiceDate": "2024-11-27",
  "paymentTerms": "net-30",
  "lineItems": [
    {
      "description": "Freight: Dallas, TX to Houston, TX",
      "quantity": 1,
      "rate": 2500
    }
  ]
}
```

**Note**: Invoice number is auto-generated (format: `INV-YYYYMM-XXXX`).

---

### Carrier Payments API

#### List Carrier Pay Sheets

```bash
GET /api/carrier-payments?where[status][equals]=pending
```

#### Get Pay Sheet by Number

```bash
GET /api/carrier-payments?where[paySheetNumber][equals]=PAY-202411-0001
```

#### Create Carrier Pay Sheet

```bash
POST /api/carrier-payments
```

**Request Body**:
```json
{
  "carrier": "carrier-id",
  "loads": ["load-id-1"],
  "paymentType": "standard",
  "lineItems": [
    {
      "description": "Line Haul: Dallas to Houston",
      "amount": 2000,
      "type": "linehaul"
    }
  ]
}
```

**Note**: Pay sheet number is auto-generated (format: `PAY-YYYYMM-XXXX`).

---

### Tracking Events API

#### List Tracking Events for a Load

```bash
GET /api/tracking-events?where[load][equals]=LOAD_ID&sort=-timestamp
```

#### Get Latest Location

```bash
GET /api/tracking-events?where[load][equals]=LOAD_ID&sort=-timestamp&limit=1
```

---

### Users API

#### List Users

```bash
GET /api/users
```

**Note**: Requires admin permissions.

#### Create User

```bash
POST /api/users
```

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "New User"
}
```

---

## Custom Endpoints

These endpoints provide specialized functionality beyond standard CRUD operations.

### Load Operations

#### Download Rate Confirmation PDF

```bash
GET /api/loads/:id/rate-confirmation
```

Downloads the rate confirmation as a PDF file.

#### Email Rate Confirmation

```bash
POST /api/loads/:id/rate-confirmation/send
```

**Request Body**:
```json
{
  "email": "carrier@example.com"
}
```

Sends rate confirmation email to carrier with PDF attachment.

#### Duplicate Load

```bash
POST /api/loads/:id/duplicate
```

Creates a copy of the load with status reset to "booked" and new load number.

**Response**:
```json
{
  "success": true,
  "newLoad": {
    "id": "new-load-id",
    "loadNumber": "SPTMS-202411-0005"
  }
}
```

---

### MacroPoint Tracking

#### Initiate Tracking

```bash
POST /api/loads/:id/tracking
```

**Request Body** (optional):
```json
{
  "driverPhone": "555-123-4567",
  "driverName": "John Driver"
}
```

Initiates MacroPoint tracking for the load. Uses driver info from load if not provided.

**Response**:
```json
{
  "success": true,
  "trackingId": "MP-123456"
}
```

#### Get Tracking Status

```bash
GET /api/loads/:id/tracking
```

**Response**:
```json
{
  "success": true,
  "tracking": {
    "trackingId": "MP-123456",
    "trackingActive": true,
    "lastLocation": "Dallas, TX",
    "lastUpdate": "2024-11-27T10:30:00Z"
  }
}
```

#### Cancel Tracking

```bash
DELETE /api/loads/:id/tracking
```

Cancels active MacroPoint tracking for the load.

#### MacroPoint Webhook

```bash
POST /api/webhooks/macropoint
```

Receives location updates from MacroPoint. Auto-updates load status based on geofence events:
- Arrived at pickup → Status: `in-transit`
- Arrived at delivery → Status: `delivered`

---

### Invoice Generation

#### Generate Invoice from Loads

```bash
POST /api/invoices/generate
```

**Request Body**:
```json
{
  "loadIds": ["load-id-1", "load-id-2"],
  "combineLoads": true
}
```

Creates invoice(s) from delivered loads. Updates load status to "invoiced".

**Response**:
```json
{
  "success": true,
  "message": "Created 1 invoice(s)",
  "invoices": [
    {
      "id": "invoice-id",
      "invoiceNumber": "INV-202411-0001",
      "total": 5000,
      "customer": "Acme Corp"
    }
  ]
}
```

#### Download Invoice PDF

```bash
GET /api/invoices/:id/pdf
```

Downloads the invoice as a PDF file.

---

### Carrier Payment Generation

#### Generate Pay Sheet from Loads

```bash
POST /api/carrier-payments/generate
```

**Request Body**:
```json
{
  "loadIds": ["load-id-1", "load-id-2"],
  "combineLoads": true,
  "paymentType": "standard"
}
```

Creates carrier pay sheet(s) from delivered loads.

**Response**:
```json
{
  "success": true,
  "message": "Created 1 pay sheet(s)",
  "paySheets": [
    {
      "id": "paysheet-id",
      "paySheetNumber": "PAY-202411-0001",
      "total": 4000,
      "carrier": "Fast Freight LLC",
      "paymentType": "standard"
    }
  ]
}
```

---

### Profitability Reports

#### Get Profitability Summary

```bash
GET /api/reports/profitability?type=summary&startDate=2024-11-01&endDate=2024-11-30
```

**Query Parameters**:
- `type`: `summary` | `loads` | `customers` | `carriers` | `lanes`
- `startDate`: ISO date (default: 30 days ago)
- `endDate`: ISO date (default: today)
- `customerId`: Filter by customer (optional)
- `carrierId`: Filter by carrier (optional)

**Response (summary)**:
```json
{
  "success": true,
  "reportType": "summary",
  "report": {
    "period": {
      "startDate": "2024-11-01",
      "endDate": "2024-11-30"
    },
    "totalLoads": 45,
    "totalRevenue": 112500,
    "totalCost": 90000,
    "grossProfit": 22500,
    "averageMarginPercent": 20,
    "topCustomers": [...],
    "topLanes": [...],
    "loadsByStatus": {
      "booked": 5,
      "dispatched": 3,
      "in-transit": 2,
      "delivered": 15,
      "invoiced": 12,
      "paid": 8
    }
  }
}
```

#### Customer Profitability Report

```bash
GET /api/reports/profitability?type=customers
```

**Response**:
```json
{
  "success": true,
  "reportType": "customers",
  "report": {
    "customers": [
      {
        "customerId": "customer-id",
        "customerName": "Acme Corp",
        "totalLoads": 25,
        "totalRevenue": 62500,
        "totalCost": 50000,
        "totalProfit": 12500,
        "averageMarginPercent": 20,
        "averageRevenuePerLoad": 2500,
        "averageProfitPerLoad": 500
      }
    ],
    "period": {...},
    "totalLoads": 45
  }
}
```

#### Lane Profitability Report

```bash
GET /api/reports/profitability?type=lanes
```

**Response**:
```json
{
  "success": true,
  "reportType": "lanes",
  "report": {
    "lanes": [
      {
        "originCity": "Dallas",
        "originState": "TX",
        "destinationCity": "Houston",
        "destinationState": "TX",
        "totalLoads": 12,
        "averageCustomerRate": 2500,
        "averageCarrierRate": 2000,
        "averageMargin": 500,
        "averageMarginPercent": 20,
        "averageMiles": 240
      }
    ],
    "period": {...},
    "totalLoads": 45
  }
}
```

---

### DAT Load Board

Integration with DAT for load posting, truck search, and market rates.

#### Post Load to DAT

```bash
POST /api/dat/postings
```

**Request Body**:
```json
{
  "loadId": "load-id",
  "contactInfo": {
    "name": "John Broker",
    "phone": "555-123-4567",
    "email": "john@broker.com"
  }
}
```

Posts the load to DAT load board. Updates the load record with `datPostingId`.

**Response**:
```json
{
  "success": true,
  "postingId": "DAT-12345",
  "matchingTrucks": 15,
  "message": "Load SPTMS-202511-0001 posted to DAT successfully"
}
```

#### Get My DAT Postings

```bash
GET /api/dat/postings
```

Returns all active load postings on DAT.

**Response**:
```json
{
  "success": true,
  "postings": [
    {
      "postingId": "DAT-12345",
      "referenceNumber": "SPTMS-202511-0001",
      "origin": { "city": "Dallas", "state": "TX" },
      "destination": { "city": "Houston", "state": "TX" },
      "pickupDate": "2025-11-28",
      "equipmentType": "dry-van",
      "rate": 2500
    }
  ],
  "count": 1
}
```

#### Update DAT Posting

```bash
PUT /api/dat/postings/:postingId
```

**Request Body**:
```json
{
  "rate": 2600,
  "comments": "Updated rate"
}
```

#### Remove DAT Posting

```bash
DELETE /api/dat/postings/:postingId?loadId=load-id
```

Removes the posting from DAT. If `loadId` is provided, clears `datPostingId` from the load.

---

#### Search Available Trucks

```bash
GET /api/dat/trucks?originCity=Dallas&originState=TX&destCity=Houston&destState=TX
```

**Query Parameters**:
- `originCity` (required): Origin city
- `originState` (required): Origin state code
- `destCity`: Destination city
- `destState`: Destination state code
- `equipmentTypes`: Comma-separated equipment types (e.g., `dry-van,reefer`)
- `availableDate`: Available date (YYYY-MM-DD)
- `originRadius`: Max miles from origin (default: 100)
- `destRadius`: Max miles from destination (default: 100)
- `limit`: Max results (default: 50)

**Response**:
```json
{
  "success": true,
  "trucks": [
    {
      "postingId": "TRK-67890",
      "carrier": {
        "name": "Fast Freight LLC",
        "mcNumber": "MC123456",
        "phone": "555-987-6543",
        "rating": 4.5,
        "authorityAge": 36
      },
      "equipment": {
        "type": "V",
        "length": 53
      },
      "location": {
        "city": "Fort Worth",
        "state": "TX"
      },
      "destination": {
        "city": "Houston",
        "state": "TX"
      },
      "availableDate": "2025-11-28"
    }
  ],
  "totalCount": 15
}
```

#### Advanced Truck Search (POST)

```bash
POST /api/dat/trucks
```

**Request Body**:
```json
{
  "origin": { "city": "Dallas", "state": "TX", "radius": 100 },
  "destination": { "city": "Houston", "state": "TX", "radius": 100 },
  "equipmentTypes": ["dry-van", "reefer"],
  "availableDate": "2025-11-28",
  "deadheadOrigin": 150,
  "deadheadDestination": 150,
  "limit": 25
}
```

---

#### Get Market Rates

```bash
GET /api/dat/rates?originCity=Dallas&originState=TX&destCity=Houston&destState=TX&equipmentType=dry-van
```

**Query Parameters**:
- `originCity` (required): Origin city
- `originState` (required): Origin state code
- `destCity` (required): Destination city
- `destState` (required): Destination state code
- `equipmentType` (required): Equipment type
- `date`: Specific date for rates
- `targetMargin`: Target margin as decimal (e.g., 0.15 for 15%) - calculates suggested rates

**Response**:
```json
{
  "success": true,
  "rates": {
    "spotRate": {
      "low": 2100,
      "average": 2400,
      "high": 2800,
      "perMile": 4.50,
      "totalMiles": 533,
      "sampleSize": 42
    },
    "contractRate": {
      "low": 2000,
      "average": 2300,
      "high": 2600,
      "perMile": 4.32
    },
    "fuelSurcharge": 0.45,
    "trend": {
      "direction": "up",
      "percentChange": 5.2,
      "period": "7d"
    }
  },
  "suggestedRates": {
    "suggestedCustomerRate": 2824,
    "suggestedCarrierRate": 2400,
    "marketRate": 2400,
    "margin": 0.15,
    "mileage": 533
  }
}
```

#### Get Rate History

```bash
GET /api/dat/rates/history?originCity=Dallas&originState=TX&destCity=Houston&destState=TX&equipmentType=dry-van&days=90
```

**Query Parameters**:
- `originCity` (required): Origin city
- `originState` (required): Origin state code
- `destCity` (required): Destination city
- `destState` (required): Destination state code
- `equipmentType` (required): Equipment type
- `days`: Number of days of history (default: 90)

**Response**:
```json
{
  "success": true,
  "lane": {
    "origin": { "city": "Dallas", "state": "TX" },
    "destination": { "city": "Houston", "state": "TX" }
  },
  "equipmentType": "dry-van",
  "history": [
    {
      "date": "2025-09-01",
      "spotRate": 2200,
      "contractRate": 2100,
      "volume": 125,
      "fuelPrice": 3.45
    },
    {
      "date": "2025-10-01",
      "spotRate": 2350,
      "contractRate": 2200,
      "volume": 142,
      "fuelPrice": 3.52
    }
  ],
  "analytics": {
    "averageSpotRate": 2275,
    "minSpotRate": 2200,
    "maxSpotRate": 2350,
    "totalVolume": 267,
    "latestRate": 2350,
    "oldestRate": 2200,
    "percentChange": 6.8
  }
}
```

---

## GraphQL API

SPTMS also provides a GraphQL endpoint as an alternative to REST.

**Endpoint**: `POST /api/graphql`

### Example Query

```graphql
query GetLoads {
  Loads(where: { status: { equals: in-transit } }, limit: 10) {
    docs {
      id
      loadNumber
      status
      customer {
        companyName
        email
      }
      carrier {
        companyName
        mcNumber
      }
      pickupDate
      deliveryDate
    }
    totalDocs
  }
}
```

### Example Mutation

```graphql
mutation UpdateLoadStatus {
  updateLoad(
    id: "load-123"
    data: {
      status: delivered
      hasPOD: true
    }
  ) {
    id
    status
    hasPOD
  }
}
```

### GraphQL Playground

Available at: `http://localhost:3000/api/graphql-playground` (development only)

---

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Error message description",
      "name": "ValidationError",
      "data": {
        "field": "Additional error details"
      }
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Errors

#### Validation Error

```json
{
  "errors": [
    {
      "message": "The following field is invalid: email",
      "name": "ValidationError"
    }
  ]
}
```

#### Authentication Required

```json
{
  "errors": [
    {
      "message": "You are not allowed to perform this action.",
      "name": "Forbidden"
    }
  ]
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

## CORS

CORS is configured to allow requests from:
- Development: `http://localhost:3000`
- Production: Your production domain

## API Versioning

Current API version: `v1` (implicit)

Future versions will be available at `/api/v2/...`

---

**Last Updated**: November 2024

For more information, see the [Payload CMS REST API Documentation](https://payloadcms.com/docs/rest-api/overview).
