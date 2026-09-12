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

`npm run start` automatically runs `npm run db:setup` first (creates tables + demo users).

## Fix database after replacing a hosted MySQL database

If you deleted your old Render database and created a new one:

1. Set `DATABASE_URL` to the new MySQL connection URL in your hosting dashboard.
2. **Redeploy** the web service (Manual Deploy → Deploy latest commit)
3. Open `https://YOUR-SERVICE.onrender.com/api/health`
   - Should return `"status": "ok"` and `"users": 3` (or more)
4. Log in at `/login` with:
   - Admin: `admin@example.com` / `Admin123!`

Local repair:

```bash
# Set DATABASE_URL in .env.local first, then:
npm run db:setup
npm run db:check
```

## Deploy to Render (PostgreSQL)

### 1. Push code to GitHub

Render deploys from Git. Initialize and push this project to a GitHub repository.

### 2. Create Render PostgreSQL

1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Name: `ecorewards-db`
3. Database: `ecorewards`
4. User: `ecorewards`
5. Create database and copy the **Internal Database URL**

### 3. Create Render Web Service

1. **New** → **Web Service** → connect your GitHub repo
2. **Runtime:** Node
3. **Root Directory:** leave blank (repository root), or set it to `.`. Do not set it to `src`.
4. **Build Command:** `npm install && npm run build:render`
5. **Start Command:** `npm run start`
5. **Pre-Deploy Command:** `npm run db:setup`

Or use the included `render.yaml` blueprint: **New** → **Blueprint** → select repo.

### 4. Environment variables (Render Dashboard)

Set these on the **Web Service** → **Environment**:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | **Internal Database URL** from your Render Postgres | Yes |
| `AUTH_SECRET` | Random string — Render can auto-generate | Yes |
| `NEXTAUTH_URL` | `https://YOUR-SERVICE-NAME.onrender.com` | Yes |
| `AUTH_TRUST_HOST` | `true` | Yes |
| `NODE_ENV` | `production` | Auto |

**Link database (recommended):** In the web service, go to **Environment** → **Add from Render Postgres** → select `ecorewards-db`. This auto-fills `DATABASE_URL`.

Optional:

| Variable | Feature |
|---|---|
| `GEMINI_API_KEY` | AI assistant & waste classifier |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google / Gmail sign-in |
| `SMTP_*` | Email verification & password reset |
| `CLOUDINARY_*` | Image uploads |

### 5. Deploy

After the first successful deploy, open your Render URL and log in with seeded demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!` |
| Staff | `staff@example.com` | `Staff123!` |
| Resident | `resident@example.com` | `Resident123!` |

**Google OAuth on Render:** Add authorized redirect URI:

`https://YOUR-SERVICE-NAME.onrender.com/api/auth/callback/google`

**Gemini models (optional overrides):**

| Variable | Default | Use |
|---|---|---|
| `GEMINI_CHAT_MODEL` | `gemini-2.5-flash-lite` | AI recycling assistant |
| `GEMINI_VISION_MODEL` | `gemini-2.5-flash` | Waste image classification |

Get a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey).

**Google / Gmail sign-in setup:**

1. Firebase Console → Authentication → enable **Google** (same Google Cloud project)
2. Google Cloud Console → **APIs & Services** → **Credentials** → **OAuth client ID** (Web)
3. Authorized redirect URI: `https://YOUR-SERVICE.onrender.com/api/auth/callback/google`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render Environment

## Deploy to Railway (MySQL)

1. Create a MySQL service in the same Railway project as the app, using a Railway
   MySQL plugin or a hosted MySQL provider.
2. Open the app service → **Variables** → **Add Reference** and select the
   MySQL service's `DATABASE_URL`.
3. Remove any old `DATABASE_URL` or `DIRECT_URL` values copied from Render. A
   host beginning with `dpg-` or ending in `render.com` is a Render database
   and is not reachable through Railway's private network.
4. Add `AUTH_SECRET` and set `AUTH_TRUST_HOST=true`.
5. Deploy the app with build command `npm run build` and start command
   `npm run start`.

The start command applies the Prisma schema and seeds the database before
   starting Next.js. Railway must therefore provide a reachable MySQL
   `DATABASE_URL` before the service starts. Do not paste the Render PostgreSQL
   connection string into Railway.

## License

Private — Community Recycling Reward System
