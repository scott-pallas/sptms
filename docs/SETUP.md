# SPTMS Setup Guide

Complete installation and configuration instructions for the SPTMS Transportation Management System.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Creating Your First Admin User](#creating-your-first-admin-user)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Required Software

- **Node.js**: Version 18.20.2+ or 20.9.0+
- **pnpm**: Version 9+ or 10+
- **Git**: Latest version
- **MongoDB Atlas Account** (or local MongoDB 6.0+)

### Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/scott-pallas/sptms.git
cd sptms
```

### 2. Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

### 3. Install Dependencies

```bash
pnpm install
```

This will install all required packages including:
- Next.js and React
- Payload CMS
- TypeScript
- Tailwind CSS
- Testing frameworks
- And more...

## MongoDB Atlas Setup

### Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project (if you don't have one)

### Create a Cluster

1. Click **"Build a Database"**
2. Choose **Free Shared Cluster** (M0)
3. Select your preferred cloud provider and region
4. Click **"Create"**

### Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Create a user with credentials:
   - Username: (your choice, e.g., `sptms_user`)
   - Password: (generate a strong password)
   - Database User Privileges: **"Read and write to any database"**
4. Click **"Add User"**
5. **Save the username and password** - you'll need them for the connection string

### Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. For development:
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Or add your specific IP address
4. Click **"Confirm"**

### Get Your Connection String

1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual credentials
6. Add the database name after `.net/`: `/sptms`

Final connection string example:
```
mongodb+srv://sptms_user:YourPassword123@cluster0.xxxxx.mongodb.net/sptms?retryWrites=true&w=majority
```

## Environment Configuration

### 1. Create .env File

```bash
cp .env.example .env
```

### 2. Edit .env File

Open `.env` and configure the following:

```env
# MongoDB Atlas Connection
DATABASE_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sptms?retryWrites=true&w=majority

# Payload CMS Secret (generate a random string)
PAYLOAD_SECRET=your-secure-random-secret-here

# Email Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Vercel Blob Storage (Optional - for production)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### Generate a Secure PAYLOAD_SECRET

Option 1 - Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Option 2 - Using OpenSSL:
```bash
openssl rand -hex 32
```

### Get a Resend API Key

1. Go to [Resend](https://resend.com/)
2. Sign up for a free account
3. Create an API key
4. Add it to your `.env` file

For development, you can use Resend's test email:
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Running the Application

### Development Mode

```bash
pnpm dev
```

The application will start on http://localhost:3000

- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3000/admin
- API: http://localhost:3000/api

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Creating Your First Admin User

### First-Time Setup

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to http://localhost:3000/admin

3. You'll see the **"Create First User"** screen

4. Fill in the form:
   - **Email**: Your admin email address
   - **Password**: Create a strong password (min 8 characters)
   - **Confirm Password**: Re-enter password
   - **Name**: (Optional) Your name

5. Click **"Create"**

6. You'll be automatically logged in to the admin panel

### Subsequent Logins

After creating your first user, the admin panel will show a login screen:
- Enter your email and password
- Click **"Login"**

## Verifying the Setup

### Check Database Connection

1. After starting the server, check the console for MongoDB connection messages
2. You should see: `✓ Ready in XXXXms`
3. No MongoDB connection errors should appear

### Check Admin Panel

1. Visit http://localhost:3000/admin
2. You should see the Payload CMS admin interface
3. Navigate through the collections:
   - Users
   - Loads
   - Customers
   - Customer Locations
   - Carriers
   - Media

### Check MongoDB Atlas

1. Go to your MongoDB Atlas dashboard
2. Click **"Browse Collections"** on your cluster
3. You should see the `sptms` database with collections:
   - users
   - customers
   - customer-locations
   - carriers
   - loads
   - media
   - payload-preferences
   - payload-migrations

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or specify a different port
PORT=3001 pnpm dev
```

### MongoDB Connection Errors

**Error: "Authentication failed"**
- Verify your username and password in the connection string
- Make sure the database user has proper permissions

**Error: "Could not connect to MongoDB"**
- Check your network access settings in MongoDB Atlas
- Make sure your IP is whitelisted (or allow from anywhere)
- Verify your internet connection

**Error: "getaddrinfo ENOTFOUND"**
- Check the connection string for typos
- Verify the cluster URL is correct

### Payload Admin 404 Errors

If you get 404 errors on /admin:

1. Make sure all admin files exist:
   ```bash
   ls src/app/\(payload\)/admin/\[\[...segments\]\]/
   ls src/app/\(payload\)/api/\[...slug\]/
   ```

2. Regenerate the import map:
   ```bash
   pnpm generate:importmap
   ```

3. Restart the dev server:
   ```bash
   pnpm dev
   ```

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check that `.env` file exists
2. Verify all required variables are set
3. Restart the dev server after changing `.env`

### TypeScript Errors

If you encounter TypeScript errors:

1. Generate Payload types:
   ```bash
   pnpm generate:types
   ```

2. Restart your TypeScript server in VS Code:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type "TypeScript: Restart TS Server"

## Next Steps

After successful setup:

1. ✅ Create your first customer
2. ✅ Add customer locations
3. ✅ Set up carriers
4. ✅ Create your first load
5. 📖 Read the [Development Guide](DEVELOPMENT.md)
6. 📖 Review the [Database Schema](DATABASE.md)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Payload CMS Documentation](https://payloadcms.com/docs)
2. Review the [Next.js Documentation](https://nextjs.org/docs)
3. Contact the development team

---

**Last Updated**: November 2024
