# ReadRise — Tech Stack

**Last updated:** 2026-02-21
**Status:** Decided

---

## Guiding Principles

1. **Ship fast, scale later** — choose managed services over self-hosted where possible
2. **Type safety end-to-end** — TypeScript everywhere on the JS side
3. **Own your data** — no vendor lock-in on the database layer
4. **Native iOS, not hybrid** — barcode scan and background timer require Swift/SwiftUI
5. **Minimize ops burden** — a small team shouldn't be managing infra

---

## Stack at a Glance

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Web frontend | Next.js (App Router) | Best ecosystem for SaaS, SSR for landing page SEO |
| Styling | Tailwind CSS + shadcn/ui | Fast to build, consistent, accessible primitives |
| iOS app | Swift + SwiftUI | Native: barcode scan, background timer, home screen widget |
| Language | TypeScript (web/API) | Type safety across web and API |
| API | Next.js Route Handlers | Collocated with web, sufficient for MVP; extract if needed |
| Database | PostgreSQL via Supabase | Battle-tested, you own the DB, easy migration off if needed |
| ORM | Drizzle ORM | Serverless-friendly, TypeScript-first, predictable SQL |
| Auth | Supabase Auth | OAuth + email/password, JWT, works for both web and iOS |
| File storage | Supabase Storage | CSV import uploads, book cover cache, avatars |
| Caching | Upstash Redis | Serverless-native, integrates with Vercel |
| Background jobs | Upstash QStash | Durable job queue for imports and emails |
| Payments | Stripe | Industry standard, Billing for subscriptions |
| Email | Resend + React Email | Best DX for transactional email in TypeScript |
| External books data | Google Books API | Free, comprehensive, ISBN + barcode lookup |
| Error tracking | Sentry | Web and iOS both supported |
| Analytics | PostHog | Product analytics + feature flags, open source |
| Web deployment | Vercel | Native Next.js host, edge functions, previews |
| iOS distribution | App Store + TestFlight | Official, required; TestFlight for closed beta |
| CI/CD | GitHub Actions | Free, widely supported, integrates with Vercel and Xcode |
| Monorepo | Turborepo | For web + shared packages only |
| iOS repo | Separate Xcode project | iOS tooling doesn't integrate with Turborepo |

---

## Layer-by-Layer Detail

### Web Frontend — Next.js (App Router)

- App Router with React Server Components for performance
- TypeScript strict mode
- Tailwind CSS for styling
- shadcn/ui for component primitives (accessible, unstyled base, copy-paste model)
- React Query (TanStack Query) for client-side data fetching and cache

**Why not Remix or SvelteKit?**
Next.js has the widest ecosystem for SaaS-specific integrations (Stripe, Supabase, Sentry, PostHog all have first-party Next.js support). Not worth the switching cost.

---

### iOS App — Swift + SwiftUI

- Swift 6 with strict concurrency
- SwiftUI for all UI
- Swift Concurrency (async/await) for networking
- AVFoundation for barcode scanning
- BackgroundTasks framework for timer persistence
- URLSession for API calls (no third-party HTTP library needed)
- Keychain for secure token storage

**Why not React Native / Expo?**
Two key features require native APIs:
1. Camera-based barcode scanning with real-time overlay
2. Background-aware reading timer (must keep running when app is backgrounded)

SwiftUI gives the best access to both. React Native wrapping these would add complexity without benefit.

**Shared contract with web:**
- REST API with OpenAPI spec
- Shared API types generated from the spec (TypeScript + Swift via `openapi-generator`)

---

### Backend API — Next.js Route Handlers

For MVP, API lives inside the Next.js app as Route Handlers (`/app/api/**`).

**When to extract to a standalone service:**
- If iOS needs websocket connections beyond what Vercel supports
- If background processing requires long-running tasks (> 60s)
- If API traffic significantly outscales web traffic

At that point, migrate to a standalone **Fastify** (Node.js) or **Hono** service deployed to Fly.io.

---

### Database — PostgreSQL via Supabase

- Supabase provides a managed PostgreSQL instance
- Connection pooling via PgBouncer (built into Supabase)
- Row Level Security (RLS) for data isolation per user
- Realtime subscriptions available if needed later (stats updates)
- Can migrate to raw Postgres on any provider (no proprietary extensions used)

**Why not Firebase / MongoDB?**
Relational data fits this domain well (Users → UserBooks → Sessions → Progress). Postgres gives full query flexibility for stats aggregations. Supabase owns the BaaS space in 2026 for Postgres.

---

### ORM — Drizzle ORM

- TypeScript schema definition (co-located with migrations)
- Generates typed query results automatically
- Near-raw SQL performance — no N+1 query risk
- Works well in serverless / edge environments (no binary dependencies)
- Drizzle Kit for migrations

**Why not Prisma?**
Prisma's abstraction layer adds overhead that can mask slow queries. Drizzle keeps SQL visible and predictable, which matters for stats queries (aggregations, window functions). Drizzle also has no binary engine dependency, which is important for Vercel edge.

---

### Auth — Supabase Auth

- Email/password sign up + login
- Google OAuth (social login)
- JWT-based sessions
- iOS SDK available (`supabase-swift`) — shares auth tokens with web
- Built-in email confirmation and password reset flows

**Future:** Apple Sign In (required for iOS apps that offer social login).

---

### Payments — Stripe

- Stripe Billing for subscription management
- Stripe Checkout for payment collection
- Webhook handling for subscription lifecycle events (created, canceled, past_due)
- Customer portal for self-serve plan changes

**Tier enforcement:**
- Subscription tier stored on User record
- Updated via Stripe webhooks
- Feature gates checked server-side on API routes

---

### File Storage — Supabase Storage

Used for:
- Goodreads CSV uploads (temporary, deleted after import)
- User avatars
- Cached book covers (if Google Books CDN is unreliable)

---

### Caching — Upstash Redis

- Rate limiting on API routes (book search, import)
- Cache Google Books API responses (books don't change often)
- Session data for active reading timers
- Serverless-native, per-request pricing

---

### Background Jobs — Upstash QStash

Used for:
- Goodreads CSV processing (can be large, shouldn't block the HTTP request)
- Weekly stats email digest
- Future: recommendation engine processing

---

### Email — Resend + React Email

- Templates built with React Email (type-safe, component-based)
- Resend for delivery
- Triggered emails: welcome, email confirmation, password reset, weekly digest

**Marketing email** (newsletter, onboarding sequences) handled separately via a tool like Loops or ConvertKit when needed.

---

### External APIs

| API | Usage | Notes |
|-----|-------|-------|
| Google Books API | Book search, metadata, cover images | Free, no auth for basic search |
| Apple App Store Connect | iOS distribution, in-app purchases | Required for App Store |
| Stripe API | Payments | Server-side only |

---

## Repository Structure

Two repositories:

```
readrise-web/          (Turborepo monorepo)
├── apps/
│   └── web/           Next.js app (web + API)
├── packages/
│   ├── db/            Drizzle schema + migrations
│   ├── types/         Shared TypeScript types
│   └── api-client/    Typed fetch wrapper (used by web and generated for iOS)
└── turbo.json

readrise-ios/          (Xcode project, separate repo)
├── ReadRise.xcodeproj
├── ReadRise/
│   ├── Features/
│   ├── Services/      API client, Supabase, Keychain
│   └── Models/
└── ReadRiseTests/
```

The iOS app consumes the REST API. Shared contract is maintained via an OpenAPI spec generated from the Next.js routes.

---

## Scalability Path

| Current (MVP) | When to change | Next step |
|---------------|---------------|-----------|
| Next.js Route Handlers | API becomes a bottleneck or needs long-running jobs | Extract to Fastify/Hono on Fly.io |
| Supabase managed Postgres | Approaching Supabase plan limits | Migrate to Neon or direct RDS |
| Upstash Redis | High-volume caching needs | Self-hosted Redis on Fly.io |
| Vercel (web) | Cost becomes significant at scale | Migrate to self-hosted or AWS |
| Monorepo (single web app) | Multiple web surfaces needed | Split into separate apps in Turborepo |

---

## What We're Not Using (and Why)

| Rejected | Reason |
|---------|--------|
| React Native | Native iOS features needed (barcode, background timer) |
| GraphQL | Overkill for MVP; REST + OpenAPI is simpler |
| tRPC | No Swift support; would still need REST for iOS |
| Prisma | Binary engine adds overhead; Drizzle is better for serverless |
| Firebase | MongoDB-style; poor fit for relational book/session data |
| PlanetScale | MySQL-based; Postgres is better supported in the ecosystem |
| Self-hosted anything | Too much ops burden for a small team at MVP |
