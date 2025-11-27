# SPTMS Deployment Guide

Production deployment instructions for the SPTMS Transportation Management System.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [MongoDB Atlas Production](#mongodb-atlas-production)
- [Environment Variables](#environment-variables)
- [Vercel Blob Storage](#vercel-blob-storage)
- [Custom Domain](#custom-domain)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

SPTMS is designed to be deployed on **Vercel** with **MongoDB Atlas** as the database and **Vercel Blob** for file storage.

### Deployment Architecture

```
┌─────────────────┐
│   Vercel Edge   │
│   (Frontend)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Next.js App    │
│  (App Router)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐  ┌────────────┐
│ API  │  │ Admin │  │ MongoDB    │
│Routes│  │ Panel │  │ Atlas      │
└──────┘  └───────┘  └────────────┘
                     │
                 ┌───▼────┐
                 │ Vercel │
                 │ Blob   │
                 └────────┘
```

## Prerequisites

### Accounts Required

1. **GitHub Account**: For code repository
2. **Vercel Account**: For hosting (sign up at https://vercel.com)
3. **MongoDB Atlas Account**: For database (already have)
4. **Resend Account**: For email (optional)

### Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster running
- [ ] Production database created
- [ ] All environment variables ready
- [ ] Tested locally with production build

## Vercel Deployment

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign in or create account
   - Click **"Add New Project"**

2. **Import Repository**:
   - Click **"Import Git Repository"**
   - Select **GitHub**
   - Authorize Vercel to access your repositories
   - Select **`sptms`** repository

3. **Configure Project**:
   - **Project Name**: `sptms` (or your choice)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install` (default)

4. **Add Environment Variables** (see [Environment Variables](#environment-variables))

5. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete (3-5 minutes)
   - Your site will be live at `https://sptms.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   # From project root
   vercel
   ```

4. **Follow prompts**:
   - Set up and deploy? **Y**
   - Which scope? (Select your account)
   - Link to existing project? **N**
   - What's your project's name? **sptms**
   - In which directory is your code? **./
   **
   - Want to modify settings? **N**

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## MongoDB Atlas Production

### Create Production Database

1. **Use Existing Cluster** or create new one:
   - Recommended: Use same cluster, different database name
   - Database name: `sptms-production`

2. **Database User**:
   - Use existing user or create new production user
   - Ensure strong password
   - Grant read/write permissions

3. **Network Access**:
   - **Allow from anywhere** (0.0.0.0/0) for Vercel
   - Or whitelist Vercel IP addresses (not recommended - IPs change)

4. **Connection String**:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/sptms-production?retryWrites=true&w=majority
   ```

### Database Indexes (Optional but Recommended)

For better performance, create indexes:

```javascript
// In MongoDB Compass or Atlas UI
use sptms-production

// Loads collection
db.loads.createIndex({ loadNumber: 1 }, { unique: true })
db.loads.createIndex({ status: 1 })
db.loads.createIndex({ customer: 1 })
db.loads.createIndex({ carrier: 1 })
db.loads.createIndex({ pickupDate: 1 })
db.loads.createIndex({ status: 1, pickupDate: 1 })

// Customers collection
db.customers.createIndex({ companyName: 1 })
db.customers.createIndex({ email: 1 })

// Carriers collection
db.carriers.createIndex({ mcNumber: 1 }, { unique: true })
db.carriers.createIndex({ dotNumber: 1 })
db.carriers.createIndex({ status: 1 })
```

## Environment Variables

### Required Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database
DATABASE_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/sptms-production?retryWrites=true&w=majority

# Payload CMS
PAYLOAD_SECRET=your-super-secure-random-secret-for-production

# Email (Resend)
RESEND_API_KEY=re_your_production_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_your_token_here

# Next.js (optional)
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

### Generate Production PAYLOAD_SECRET

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Setting Environment Variables in Vercel

1. Go to **Project Settings**
2. Click **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URI`)
   - **Value**: Variable value
   - **Environments**: Select **Production**, **Preview**, and **Development**
4. Click **Save**

## Vercel Blob Storage

### Enable Blob Storage

1. **In Vercel Dashboard**:
   - Go to your project
   - Click **Storage** tab
   - Click **Create Database**
   - Select **Blob**
   - Click **Create**

2. **Get Token**:
   - Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your env vars
   - Copy the token if needed

3. **Update payload.config.ts**:
   ```typescript
   // Uncomment the Vercel Blob Storage plugin
   plugins: [
     vercelBlobStorage({
       enabled: true,
       collections: {
         media: true,
       },
       token: process.env.BLOB_READ_WRITE_TOKEN || '',
     }),
   ],
   ```

4. **Redeploy**:
   ```bash
   git add .
   git commit -m "Enable Vercel Blob Storage"
   git push
   ```

## Custom Domain

### Add Custom Domain

1. **In Vercel Dashboard**:
   - Go to **Project Settings**
   - Click **Domains**
   - Enter your domain (e.g., `tms.yourdomain.com`)
   - Click **Add**

2. **Configure DNS**:
   - Add CNAME record in your DNS provider:
     - **Type**: CNAME
     - **Name**: `tms` (subdomain) or `@` (apex domain)
     - **Value**: `cname.vercel-dns.com`

3. **Wait for DNS Propagation** (up to 48 hours, usually ~1 hour)

4. **SSL Certificate**:
   - Vercel automatically provisions SSL certificate
   - Your site will be accessible via HTTPS

### Update Environment Variables

After adding custom domain:

```env
NEXT_PUBLIC_SERVER_URL=https://tms.yourdomain.com
```

## Post-Deployment

### First-Time Setup

1. **Access Admin Panel**:
   - Go to `https://yourdomain.com/admin`
   - Create first admin user

2. **Test Core Functionality**:
   - Create a customer
   - Add a customer location
   - Create a carrier
   - Create a test load
   - Upload a document

3. **Verify Integrations**:
   - Test MongoDB connection (data persists)
   - Test file uploads (Vercel Blob)
   - Test email (if configured)

### Database Migrations

If you make schema changes:

1. **Update collection files locally**
2. **Generate types**:
   ```bash
   pnpm generate:types
   ```
3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Update schema"
   git push
   ```
4. **Vercel auto-deploys** new version

Payload CMS automatically handles schema migrations.

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard:
- Go to **Analytics** tab
- Click **Enable Analytics**
- View traffic, performance, and errors

### Application Monitoring

Monitor via:
1. **Vercel Logs**:
   - Dashboard → Deployments → Click deployment → Logs
   - View real-time application logs

2. **MongoDB Atlas Monitoring**:
   - Atlas Dashboard → Monitoring
   - View database performance, connections, queries

3. **Error Tracking**:
   - Consider integrating Sentry or similar
   - Add to `next.config.mjs`:
     ```javascript
     sentry: {
       // ... configuration
     }
     ```

### Health Checks

Create a health check endpoint:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import payload from 'payload'

export async function GET() {
  try {
    // Test database connection
    await payload.find({ collection: 'users', limit: 1 })

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
```

Access at: `https://yourdomain.com/api/health`

## Troubleshooting

### Build Failures

**Error: "Module not found"**
- Ensure all dependencies are in `package.json`
- Run `pnpm install` locally
- Check import paths

**Error: "TypeScript errors"**
- Run `pnpm generate:types`
- Fix TypeScript errors locally
- Commit and push

### Database Connection Issues

**Error: "MongoServerError: Authentication failed"**
- Verify `DATABASE_URI` in Vercel env vars
- Check MongoDB Atlas user credentials
- Ensure network access is open (0.0.0.0/0)

**Error: "Connection timeout"**
- Check MongoDB Atlas is running
- Verify connection string format
- Check Vercel function timeout (10s default, 60s max)

### File Upload Issues

**Error: "Failed to upload file"**
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob Storage is enabled
- Ensure file size is within limits (4.5MB for free tier)

### Performance Issues

**Slow page loads**:
- Enable Edge Runtime for API routes
- Add database indexes
- Implement caching
- Optimize images with Next.js Image component

**High database usage**:
- Add indexes to frequently queried fields
- Implement pagination
- Cache frequently accessed data

### Deployment Rollback

If deployment has issues:

1. **In Vercel Dashboard**:
   - Go to **Deployments**
   - Find previous working deployment
   - Click **⋯ (three dots)**
   - Click **Promote to Production**

2. **Fix issues locally**:
   - Debug the problem
   - Test thoroughly
   - Redeploy when ready

## Security Checklist

Before going live:

- [ ] Change `PAYLOAD_SECRET` to strong random value
- [ ] Use strong MongoDB passwords
- [ ] Enable MongoDB IP whitelisting (if possible)
- [ ] Configure CORS properly
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Review user permissions
- [ ] Enable rate limiting (recommended)
- [ ] Set up backup strategy
- [ ] Configure error logging
- [ ] Test authentication thoroughly

## Backup Strategy

### MongoDB Atlas Backups

1. **Cloud Backups** (Recommended):
   - Atlas provides automatic backups
   - Enable in Atlas Dashboard → Backup tab
   - Free tier: Basic backup available
   - Paid tiers: Point-in-time recovery

2. **Manual Exports**:
   ```bash
   mongodump --uri="mongodb+srv://..." --out=./backup
   ```

### Vercel Blob Backups

- Vercel Blob data is automatically replicated
- For critical files, implement backup script
- Store backups in separate cloud storage

## Scaling

### Vertical Scaling

As your load volume grows:

1. **MongoDB Atlas**:
   - Upgrade to M10+ for better performance
   - Enable auto-scaling

2. **Vercel**:
   - Pro plan: Faster builds, more bandwidth
   - Enterprise: Dedicated support, SLA

### Horizontal Scaling

SPTMS is designed to scale:
- Stateless API routes
- MongoDB handles concurrent connections
- Vercel Edge Network distributes globally

---

**Last Updated**: November 2024

For support:
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
