# EcoRewards — Community Recycling Reward System

**Transforming Waste into Rewards through Smart Recycling.**

A full-stack web application for community recycling programs. Residents earn points for recycling, staff record collections via QR scan, and admins manage the platform.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes, NextAuth v5
- **Database:** MySQL + Prisma 7
- **AI:** Google Gemini (optional — chat assistant & waste classification)

## Prerequisites

- Node.js 20+
- MySQL 8+ or MariaDB 10.6+ (local or cloud)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file to a local-only environment file and replace the placeholders:

```powershell
Copy-Item .env.example .env.local
```

Next.js loads `.env.local` for local development. Keep secrets in your local file or
your deployment provider's environment settings; never commit them to the repository.

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `AUTH_SECRET` | Random secret — run `openssl rand -base64 32` |

`DIRECT_URL` is an optional second MySQL connection string for database commands.

Before registering an account, make sure MySQL is running and the database
in `DATABASE_URL` exists. Check the connection with:

```powershell
npm run db:check
npm run db:push
```

If this reports `P1001: Can't reach database server`, update `.env.local` with a
reachable MySQL URL or use the `DATABASE_URL` supplied by your hosting
provider. The application cannot create accounts until the database is reachable.

For a local MySQL installation, use a URL like:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/community_recycling_rewards"
```

Create the database if needed, then run `npm run db:push` and `npm run db:seed`.
Alternatively, create a hosted MySQL database and paste its connection URL
into `.env.local`. Do not use the placeholder `user:password` URL.

Optional (features work with fallbacks without these):

| Variable | Feature |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google / Gmail sign-in |
| `GEMINI_API_KEY` | AI assistant & image classification |
| `SMTP_*` | Email (password reset, verification) |
| `CLOUDINARY_*` | Image uploads |

### 3. Set up the database

```bash
npm run db:push
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

After seeding, log in with:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!` |
| Collection Staff | `staff@example.com` | `Staff123!` |
| Resident | `resident@example.com` | `Resident123!` |

## Portals

| Portal | URL | Who |
|---|---|---|
| Landing | `/` | Public |
| Resident | `/resident` | Residents |
| Staff | `/staff` | Collection staff |
| Admin | `/admin` | Administrators |

## Key Features

**Residents**
- QR card for identification at collection centers
- Reward wallet & transaction history
- Redeem points for vouchers and gifts
- Request home pickup
- Leaderboard, badges, environmental impact
- AI recycling assistant

**Staff**
- Scan resident QR codes
- Record recycling by waste category & weight
- Manage pickup requests and routes
- Performance reports

**Admin**
- User, barangay, and center management
- Waste category & reward catalog
- Redemption and pickup oversight
- Platform analytics & announcements

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, password reset
│   ├── admin/           # Admin portal
│   ├── staff/           # Staff portal
│   ├── resident/        # Resident portal
│   └── api/             # REST API routes
├── components/          # UI & feature components
├── lib/                 # Utilities, services, auth helpers
└── generated/prisma/    # Prisma client (auto-generated)
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Demo data seeder
```

## Production Build

```bash
npm run build
npm run start
```

Ensure `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` are set in your deployment environment.
For the Railway deployment, use `NEXTAUTH_URL=https://community-recycling-rewards-environment.up.railway.app`.

`npm run start` automatically runs `npm run db:setup` first (creates tables + demo users).

## Deploy to Railway (MySQL)

1. Create a MySQL service in the same Railway project as the app, using a Railway
   MySQL plugin or a hosted MySQL provider.
2. Open the app service → **Variables** → **Add Reference** and select the
   MySQL service's `DATABASE_URL`.
3. Remove any old database URL values from previous hosting providers.
5. Set `NEXTAUTH_URL=https://community-recycling-rewards-environment.up.railway.app`.
6. Add `AUTH_SECRET` and set `AUTH_TRUST_HOST=true`.
7. Deploy the app with build command `npm run build` and start command
   `npm run start`.

The start command applies the Prisma schema and seeds the database before
starting Next.js. Railway must therefore provide a reachable MySQL
`DATABASE_URL` before the service starts.

## License

Private — Community Recycling Reward System
