# Settl - Group Expense Splitting

SaaS group trip expense splitting app built as a Turborepo monorepo with an Express API, Next.js web app, and Expo mobile client.

## Monorepo Structure

- `apps/api/` - Express.js REST API + Socket.io realtime
- `apps/web/` - Next.js 14 web application (premium dark theme)
- `apps/mobile/` - Expo SDK 51 mobile client
- `packages/database/` - Prisma client + PostgreSQL schema
- `packages/types/` - Shared TypeScript interfaces
- `packages/utils/` - Split resolver, balance calculator, settlement engine

## Tech Stack

- **Framework**: Turborepo, pnpm workspaces
- **Frontend**: Next.js 14 (App Router), TailwindCSS, TanStack Query, Zustand
- **Mobile**: Expo, React Navigation, SecureStore
- **Backend**: Express, TypeScript, JWT auth, ioredis, BullMQ-ready
- **Database**: PostgreSQL, Prisma
- **Realtime**: Socket.io
- **Payments**: Cashfree (with dev simulate-upgrade)

## Quick Start

### 1. Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for Postgres + Redis)

### 2. Install & infrastructure

```bash
pnpm install
docker compose up -d
cp .env.example .env
```

### 3. Database

```bash
pnpm --filter @settl/database generate
pnpm --filter @settl/database migrate:deploy
pnpm --filter @settl/database seed
```

### 4. Run all apps

```bash
pnpm dev
```

- API: http://localhost:4000/health
- Web: http://localhost:3000
- Mobile: `pnpm --filter mobile start`

### Demo credentials (seed)

| Email | Password |
|-------|----------|
| alice@settl.com | Password123! |
| bob@settl.com | Password123! |

## Mobile

```bash
pnpm --filter mobile start          # Expo dev server
pnpm --filter mobile build:android  # EAS preview APK
```

See [apps/mobile/README.md](apps/mobile/README.md) for API URL setup and Android build steps.

## API Overview (`/api/v1`)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `GET /auth/me` |
| Users | `PATCH /users/me`, `GET /users/subscription`, `GET /users/plans` |
| Trips | CRUD, join, leave, balances, pre-contributions |
| Expenses | CRUD with split resolution (EQUAL, PERCENTAGE, EXACT, EXCLUDE) |
| Settlements | List, create, update, suggested settlements |
| Notifications | List, mark read |
| Premium | Cashfree checkout, CSV export, receipt OCR, FCM token |

## Environment Variables

See `.env.example` for JWT, Redis, Cashfree, R2, Firebase, Google Vision, and Resend configuration.

## Subscription Tiers

| Feature | FREE | PRO | PREMIUM |
|---------|------|-----|---------|
| Trips | 2 | 10 | Unlimited |
| Members/trip | 5 | 15 | Unlimited |
| Custom splits | — | ✓ | ✓ |
| Receipt OCR | — | ✓ | ✓ |
| CSV export | — | ✓ | ✓ |
| AI settle | — | — | ✓ |

Use **Pricing** page or `POST /premium/simulate-upgrade` in development to test upgrades.
