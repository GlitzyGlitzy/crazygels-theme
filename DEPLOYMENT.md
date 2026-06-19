# Crazy Gels — Deployment Guide & Protection Checklist

This document is the source of truth for safely deploying this application. Read it before touching production.

---

## Architecture Overview

| Layer | Service | Notes |
|---|---|---|
| Frontend / API | **Next.js 16** on **Vercel** | pnpm, React 19, Tailwind v4 |
| Storefront data | **Shopify** (headless) | crazygels.myshopify.com — Storefront API + Admin API |
| Database | **Neon PostgreSQL** | Product catalog, stocking decisions, enrichment data |
| AI consultation | **OpenAI GPT-4o-mini** | via Vercel AI SDK — `/api/consult/chat` |
| Email marketing | **Klaviyo** | `/api/klaviyo/subscribe`, newsletter forms |
| Analytics | **Google Tag Manager** (GTM-W7NQG2QL) + GA | Loaded via `analytics-scripts.tsx` |
| Scraper pipeline | **AWS Lambda** (Python 3.11) + S3 | Terraform-managed in `infrastructure/` |
| Middleware | `proxy.ts` (replaces middleware.ts) | Bot blocking, locale redirect stripping |

---

## Environment Variables

All required vars live in Vercel → Project → Settings → Environment Variables.
To pull them locally: `npx vercel env pull .env.local`

### Required (app will not boot without these)

| Variable | Where to get it |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `crazygels.myshopify.com` (hardcoded OK) |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Same as above |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Shopify Admin → Apps → Headless → Storefront API |
| `SHOPIFY_ADMIN_TOKEN` | Shopify Admin → Apps → Custom App → Admin API |
| `DATABASE_URL` | Neon dashboard or Vercel → Integrations → Neon |
| `ADMIN_TOKEN` | Your chosen secret — used to gate all `/admin` and `/api/admin/*` routes |

### Optional (features degrade gracefully without these)

| Variable | Effect if missing |
|---|---|
| `KLAVIYO_PRIVATE_API_KEY` / `KLAVIYO_LIST_ID` / `NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY` | Newsletter subscribe silently fails |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA event tracking disabled |
| `SHOPIFY_REVALIDATION_SECRET` | Shopify webhook cache purges work but without HMAC signature verification |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification tag missing |
| `SHOPIFY_CLIENT_ID` | OAuth install flow at `/api/shopify-auth` fails |

### AWS Lambda (separate from Vercel)

Lambda functions read credentials from **AWS Secrets Manager** via `DB_SECRET_ARN` env var set in Terraform. Do not store DB credentials in Lambda env directly.

---

## Pre-Deployment Checklist

### Every Deploy

- [ ] `pnpm install` — confirm no peer-dep warnings on critical packages
- [ ] `pnpm build` locally — `next build` must complete without errors
  - TypeScript errors are **suppressed** (`ignoreBuildErrors: true` in next.config.mjs) — do not rely on build failures to catch type errors; run `tsc --noEmit` manually
- [ ] Confirm `proxy.ts` (not `middleware.ts`) is the active middleware — the matcher in `config.export` must exclude `api/`, `_next/static`, `_next/image`, and static assets
- [ ] Verify `ADMIN_TOKEN` is set and is a strong secret — all `/admin` pages and `/api/admin/*` routes are guarded solely by this token

### Database Changes

All schema migrations live in `scripts/00N-*.sql`. Run them **in order** against the Neon database before deploying code that depends on them.

**Current migration order:**
1. `001-create-product-catalog.sql` — `product_catalog`, `anonymised_products`
2. `002-create-enrichment-tables.sql` — `product_enrichment`, `market_benchmarks`
3. `003-create-source-intelligence.sql` — source intelligence tables
4. `004-create-stocking-decisions.sql` — `stocking_decisions`
5. `005-add-unique-product-hash-stocking.sql` — unique constraint on stocking
6. `006-add-retail-price-to-catalog.sql` — retail price column
7. `007-add-retail-price-column.sql` — follow-up price column patch

Alternatively, `POST /api/db-setup` (admin-only, but currently has **no auth guard** — see Known Issues) auto-runs idempotent schema creation and column additions. Only use this on a fresh DB, not for production migrations.

### Shopify Webhook (cache revalidation)

After deploying, confirm the Shopify webhook is still pointing at `https://crazygels.com/api/revalidate`.

If `SHOPIFY_REVALIDATION_SECRET` is set, the endpoint verifies the HMAC signature. Without it, any POST to `/api/revalidate?tag=products` will purge the cache — make sure this is acceptable for your threat model.

Manual cache purge (safe to run any time):
```bash
curl -X POST https://crazygels.com/api/revalidate?tag=all
```

---

## Known Issues & Risks

### 1. `/api/db-setup` has no authentication
`POST /api/db-setup` runs DDL against the production database with no auth check. Any unauthenticated caller can trigger schema creation. This is intentional for bootstrapping but should be patched before launch if the domain is public.

**Fix:** Add the same `verifyAdmin()` guard used everywhere else.

### 2. TypeScript errors are silenced in production builds
`next.config.mjs` sets `typescript: { ignoreBuildErrors: true }`. Type errors will not block Vercel deployments. Run `npx tsc --noEmit` in CI or before merging.

### 3. Bot blocking uses a blocklist, not a allowlist
`proxy.ts` blocks known bad user-agents. Legitimate headless monitoring tools (Datadog, Pingdom synthetic checks) may be blocked if their UA strings match any keyword in `BLOCKED_UA_KEYWORDS`. Test monitoring probes after any proxy.ts change.

### 4. AI consult route has no rate limiting
`POST /api/consult/chat` calls OpenAI on every request with no auth, rate limit, or abuse protection. A single user can rack up significant OpenAI costs.

### 5. `/api/db-diagnose` and `/api/connection-test` are unauthenticated
These diagnostic routes expose DB connectivity status and potentially error details to anonymous users.

---

## Redirect & URL Rules

Defined in two places — both must stay in sync:

**`next.config.mjs` (permanent server-side redirects):**
- `/collections/:collection/products/:handle` → `/products/:handle` (301)
- `/collections/all` → `/collections` (301)
- `/blogs/:blogHandle` → `/blog` (301)
- `/blogs/:blogHandle/:articleHandle` → `/blog/:blogHandle/:articleHandle` (301)
- `/pages/frontpage` → `/` (301)
- `/account`, `/account/*` → `/` (302)
- `/policies/:slug` → `/` (301)
- `/password` → `/` (301)

**`proxy.ts` (middleware-level):**
- Strips ALL Shopify locale prefixes (`/en/`, `/de/`, `/fr/`, etc. — 80+ locales) with 301 redirect
- Flattens `/collections/:col/products/:handle` → `/products/:handle` (301, catches cases before Next.js routing)
- Blocks known bot user-agents, vulnerability scanner paths, and non-browser file extensions

**Rule:** Do not add the same redirect in both files. Middleware runs first, then Next.js config. Duplicates create redirect chain.

---

## Admin Panel

`/admin` routes are internal-only. No user registration. Access is token-only.

| Route | Purpose |
|---|---|
| `/admin` | Dashboard |
| `/admin/stocking` | Approve products for sale (sets `stocking_decisions.decision = 'stock'`) |
| `/admin/enrichment` | Run enrichment pipeline on product catalog |
| `/admin/intelligence` | View competitor price intelligence |
| `/admin/bulk-list` | Bulk list approved products to Shopify |
| `/admin/export` | Generate CSV exports |
| `/admin/import-reviews` | Import Amazon/JudgeMe reviews |
| `/admin/scraper-test` | Test scraper connectivity |
| `/admin/validation` | Validate product data integrity |

All `/api/admin/*` routes check for `ADMIN_TOKEN` via `x-admin-token` or `Authorization: Bearer` header. The admin UI sends this token from client-side storage — confirm it is not exposed in `NEXT_PUBLIC_*` env vars.

---

## AWS Lambda Pipeline

Managed by Terraform in `infrastructure/lambda.tf`. Do not edit Lambda configs manually in the AWS console — they will be overwritten on next `terraform apply`.

**Scheduled jobs (UTC):**
- `08:00` — `data_processor`: aggregates price history, detects anomalies
- `09:00` — `catalog_promoter`: promotes `anonymised_products` → `product_catalog`
- `Monday 10:00` — `export_generator`: weekly CSV/JSON competitor report

**To deploy Lambda code changes:**
```bash
cd deployment
./package_lambdas.sh        # zips handler.py into deployment/lambda/*.zip
cd ../infrastructure
terraform apply             # pushes new zip hashes to AWS
```

Credentials flow: Lambda → AWS Secrets Manager (`DB_SECRET_ARN`) → Neon PostgreSQL. Do not put DB credentials in Lambda environment variables.

---

## Scraper Commands

```bash
pnpm scrape              # all sources
pnpm scrape:obf          # Open Beauty Facts only
pnpm scrape:sephora      # Sephora only
pnpm scrape:ulta         # Ulta only
pnpm scrape:amazon       # Amazon only
pnpm scrape:dry          # dry-run (no DB writes)
```

Scrapers write to `anonymised_products`. The Lambda `catalog_promoter` (or admin UI) promotes entries to `product_catalog`. Only products with `stocking_decisions.decision = 'stock'` appear in the AI consultant and product listings.

---

## Rollback Procedure

1. In Vercel dashboard → Deployments → find last known good deployment → **Promote to Production**
2. If a DB migration is involved, restore from Neon's point-in-time recovery before promoting
3. Purge cache after rollback: `curl -X POST https://crazygels.com/api/revalidate?tag=all`

---

## First-Time Setup (new environment)

1. Copy env vars: `npx vercel env pull .env.local`
2. Install deps: `pnpm install`
3. Run DB migrations in order (see Database Changes above), or hit `POST /api/db-setup` if starting fresh
4. Verify Shopify webhook is configured in Shopify Admin → Settings → Notifications → Webhooks
5. `pnpm build && pnpm start` to smoke-test locally
6. Deploy: `git push` to `main` triggers Vercel auto-deploy

---

## Files Not to Modify Without Care

| File | Why |
|---|---|
| `proxy.ts` | Bot blocking + locale redirects — wrong regex breaks SEO or blocks legit traffic |
| `next.config.mjs` | Permanent 301 redirects cached by Google — mistakes linger in search index |
| `lib/shopify/index.ts` | Core Shopify API client — all product/collection data flows through here |
| `lib/db.ts` | DB connection pool — `max: 5` is intentional for Neon free tier limits |
| `scripts/00N-*.sql` | Never edit applied migrations — add new numbered files instead |
| `app/api/revalidate/route.ts` | Cache purge logic — breaking this means stale product data after Shopify updates |
