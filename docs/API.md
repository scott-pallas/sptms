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
  - [Media](#media-api)
  - [Users](#users-api)
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
