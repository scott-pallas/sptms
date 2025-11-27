# SPTMS - Transportation Management System

A custom 3PL (Third-Party Logistics) Transportation Management System built to replace Aljex, designed for freight brokerages handling ~100 loads/month with plans to scale.

## 🚀 Project Overview

SPTMS is a modern, full-stack TMS solution that integrates with your existing tools:
- **MacroPoint** - Real-time freight tracking
- **ePay** - Carrier payments and factoring
- **QuickBooks** - Accounting and invoicing
- **DAT** - Load boards and market rates

### Current Status: Phase 1 Complete ✅

**Live Features:**
- ✅ Load management with complete lifecycle tracking
- ✅ Customer and customer location management
- ✅ Carrier management with compliance tracking
- ✅ Document management (BOL, POD, rate confirmations)
- ✅ Status workflow (Booked → Dispatched → In Transit → Delivered → Invoiced → Paid)

## 🛠 Tech Stack

- **Frontend**: Next.js 15.4.7 with React 19.1.0
- **Backend**: Next.js API Routes
- **CMS**: Payload CMS 3.64.0
- **Database**: MongoDB Atlas
- **TypeScript**: 5.7.3
- **Styling**: Tailwind CSS 4.1.17 + shadcn/ui
- **Testing**: Vitest + Playwright
- **Email**: React Email + Resend
- **Storage**: Local (Vercel Blob planned)
- **Hosting**: Vercel (planned)

## 📁 Project Structure

```
sptms/
├── src/
│   ├── app/
│   │   ├── (frontend)/          # Public-facing pages
│   │   └── (payload)/           # Admin panel
│   │       ├── admin/           # Admin UI routes
│   │       └── api/             # REST API routes
│   ├── collections/             # Payload CMS collections
│   │   ├── Users.ts            # Authentication
│   │   ├── Customers.ts        # Customer management
│   │   ├── CustomerLocations.ts # Pickup/delivery addresses
│   │   ├── Carriers.ts         # Carrier database
│   │   ├── Loads.ts            # Load management
│   │   └── Media.ts            # Document storage
│   ├── components/              # React components
│   ├── lib/                     # Utility functions
│   └── payload.config.ts        # Payload configuration
├── docs/                        # Documentation
├── tests/                       # Test files
└── public/                      # Static assets
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18.20.2+ or 20.9.0+
- pnpm 9+ or 10+
- MongoDB Atlas account (or local MongoDB)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/scott-pallas/sptms.git
   cd sptms
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB and other credentials
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

### First Time Setup

When you first visit `/admin`, you'll be prompted to create your admin user account.

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation and configuration
- [Database Schema](docs/DATABASE.md) - Collection structures and relationships
- [API Reference](docs/API.md) - REST API endpoints
- [Development Guide](docs/DEVELOPMENT.md) - Development workflow and best practices
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Feature Plan](docs/3pl-tms-feature-plan.md) - Complete roadmap and specifications

## 🎯 Development Roadmap

### Phase 1: Core Load Management ✅ (Complete)
- Load entry and management
- Customer and carrier databases
- Dispatch and assignment
- Status tracking
- Document management

### Phase 2: Tracking Integration (Planned)
- MacroPoint API integration
- Real-time location updates
- Automated status updates
- Customer tracking portal

### Phase 3: Financial Management (Planned)
- Customer invoicing
- QuickBooks integration
- Carrier pay with ePay
- Profitability tracking

### Phase 4: Load Board Integration (Planned)
- DAT integration
- Market rate intelligence

### Phase 5: Compliance & Carrier Vetting (Planned)
- FMCSA data integration
- Insurance tracking
- Carrier scorecards

### Phase 6: Reporting & Analytics (Planned)
- Operational reports
- Financial dashboards
- KPI tracking

### Phase 7: Growth & Automation (Planned)
- Customer portal
- Carrier portal
- Automated workflows
- Mobile access

## 🧪 Testing

```bash
# Run unit tests
pnpm test:int

# Run end-to-end tests
pnpm test:e2e

# Run all tests
pnpm test
```

## 📝 Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm generate:types   # Generate TypeScript types from Payload schema
pnpm generate:importmap # Generate Payload admin import map
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URI` - MongoDB connection string
- `PAYLOAD_SECRET` - Secret key for Payload CMS
- `RESEND_API_KEY` - Resend API key for emails
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (optional)

## 🤝 Contributing

This is a private project. For questions or suggestions, contact the development team.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Payload CMS](https://payloadcms.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Last Updated**: November 2024
**Status**: Active Development
**Version**: 0.1.0
