# Settl - Group Expense Splitting

SaaS group trip expense splitting app built as a Turborepo monorepo with an Express API, Next.js web app, and Expo mobile client.

## Monorepo Structure

- `apps/api/` - Express.js backend API
- `apps/web/` - Next.js 14 Web application with premium dark theme design
- `apps/mobile/` - Expo SDK 51 mobile client
- `packages/database/` - Prisma client setup
- `packages/types/` - Shared TypeScript interfaces
- `packages/utils/` - Shared calculation engines (split resolver, balance calculations)

## Tech Stack

- **Framework**: Turborepo, pnpm workspaces
- **Frontend**: Next.js 14 (App Router), TailwindCSS, framer-motion, Radix primitives
- **Backend**: Express, TypeScript, ioredis
- **Database**: PostgreSQL, Prisma
- **Realtime / Async**: Socket.io, BullMQ
