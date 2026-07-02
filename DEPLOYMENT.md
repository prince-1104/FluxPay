# Settl — Production deployment

This monorepo deploys in two parts:

| App | Platform | Why |
|-----|----------|-----|
| **Web** (`apps/web`) | [Vercel](https://vercel.com) | Next.js 14 App Router |
| **API** (`apps/api`) | Railway / Render / Fly.io | Express + Socket.io (long-running server) |

The database (Neon PostgreSQL) and Redis are external managed services.

---

## 1. Database (Neon)

1. Create a Neon project and copy `DATABASE_URL`.
2. Run migrations from your machine or CI:

```bash
pnpm install
pnpm --filter @settl/database generate
pnpm --filter @settl/database migrate:deploy
pnpm --filter @settl/database seed   # optional demo data
```

---

## 2. API deployment (Railway / Render)

The API **cannot** run on Vercel serverless (Express + WebSockets). Deploy it to a Node host.

### Build & start

```bash
pnpm install
pnpm turbo run build --filter=api
node apps/api/dist/server.js
```

**Root directory:** repository root  
**Node version:** 22.x  
**Start command:** `node apps/api/dist/server.js`  
**Build command:** `pnpm install && pnpm --filter @settl/database generate && pnpm turbo run build --filter=api`

### Required API environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (optional but recommended) |
| `NODE_ENV` | `production` |
| `PORT` | `4000` (or host default) |
| `CLIENT_URL` | Production web URL, e.g. `https://settl.vercel.app` |
| `ALLOWED_ORIGINS` | Comma-separated extra origins (custom domain) |
| `JWT_ACCESS_SECRET` | Strong random secret |
| `JWT_REFRESH_SECRET` | Strong random secret |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `30d` |
| `RESEND_API_KEY` | Email (optional) |
| `EMAIL_FROM` | e.g. `Settl <noreply@yourdomain.com>` |
| `R2_*` | Cloudflare R2 for uploads (optional) |
| `CASHFREE_*` | Payments (optional) |
| `GOOGLE_VISION_API_KEY` | Receipt OCR (optional) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Push notifications (optional) |

After deploy, verify: `https://YOUR_API_HOST/health`

A `render.yaml` blueprint is included for one-click API deploy on Render.

---

## 3. Web deployment (Vercel)

### Connect repository

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `apps/web`.
3. Framework preset: **Next.js** (auto-detected).
4. `apps/web/vercel.json` configures monorepo install/build via Turborepo.

### Vercel project settings

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Node.js Version | 22.x |
| Install Command | *(from vercel.json)* `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | *(from vercel.json)* `cd ../.. && pnpm turbo run build --filter=web` |

### Required Vercel environment variables

Set these in **Project → Settings → Environment Variables** (Production + Preview):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR_API_HOST/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_MOBILE_APK_URL` | Expo APK download URL (optional) |

> **Important:** `NEXT_PUBLIC_*` vars are baked in at build time. Redeploy after changing them.

### Custom domain

1. Add domain in Vercel → Domains.
2. Update API `CLIENT_URL` and `ALLOWED_ORIGINS` to match.
3. Redeploy API so CORS allows the new origin.

---

## 4. Clerk

1. Create a Clerk application.
2. Add your Vercel URL(s) under **Allowed origins**.
3. Copy keys into Vercel env vars.

---

## 5. Post-deploy checklist

- [ ] `GET /health` on API returns `200`
- [ ] Web loads at Vercel URL
- [ ] Register / login works (JWT against API)
- [ ] Create trip, add expense, custom split on Pro trial trip
- [ ] Pricing page shows updated plans from DB
- [ ] Favicon and OG metadata render correctly

---

## 6. Local production build test

```bash
pnpm install
pnpm build:web
```

---

## 7. Security notes

- Never commit `.env` — use platform secret managers.
- Rotate JWT secrets before production launch.
- Use production Cashfree credentials when going live.
- Restrict CORS with `CLIENT_URL` + `ALLOWED_ORIGINS` for custom domains.
