# EcoRewards — Community Recycling Reward System

**Transforming Waste into Rewards through Smart Recycling.**

A full-stack web application for community recycling programs. Residents earn points for recycling, staff record collections via QR scan, and admins manage the platform.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes, NextAuth v5
- **Database:** PostgreSQL + Prisma 7
- **AI:** Google Gemini (optional — chat assistant & waste classification)

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or cloud)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and edit values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret — run `openssl rand -base64 32` |

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
3. **Build Command:** `npm install && npm run build:render`
4. **Start Command:** `npm run start`
5. **Pre-Deploy Command (optional):** `npx prisma db seed`

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

## License

Private — Community Recycling Reward System
