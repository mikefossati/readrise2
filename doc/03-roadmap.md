# ReadRise — Roadmap & Phase Plan

**Last updated:** 2026-02-21
**Status:** Phase 1 Complete (web) — Phase 1.5 iOS pending

---

## Phase Overview

| Phase | Name | Goal | Status |
|-------|------|------|--------|
| 0 | Foundation | Architecture, tooling, dev environment | Complete |
| 1 | MVP Core | Ship closed beta with critical user journey | Web Complete / iOS Pending |
| 2 | Polish & Launch | Public launch, monetization, iOS App Store | Not Started |
| 3 | Growth | Social features, Android, recommendations | Not Started |
| 4 | Scale | Advanced analytics, API, integrations | Not Started |

---

## Phase 0 — Foundation

**Goal:** Everything in place before a single feature is built.

### Deliverables
- [x] Tech stack decisions documented
- [x] Repository structure established (Turborepo monorepo for web; separate repo planned for iOS)
- [x] Local dev environment working (web + iOS)
- [x] Database schema v1 designed and reviewed (Drizzle schema in `packages/db`)
- [x] Auth system wired up (Supabase Auth, middleware, server/client helpers, OAuth callback)
- [x] CI/CD pipeline configured (GitHub Actions: lint, typecheck, build)
- [x] Staging environment running (Supabase project + Vercel deploy)
- [x] Google Books API key provisioned
- [x] Design system / component library selected (shadcn/ui + Tailwind v4)
- [x] Error tracking configured (Sentry server + client instrumentation files)

**Exit criteria:** A developer can sign up, log in, and see an empty dashboard on both web and iOS.

---

## Phase 1 — MVP Core

**Goal:** Complete the critical user journey. Ready for closed beta.

### Milestone 1.1 — Library ✅
- [x] Book search (Google Books API)
- [x] Add book to shelf
- [x] Shelf views (Reading, Want to Read, Finished, Abandoned)
- [x] Book detail page
- [x] Goodreads CSV import

### Milestone 1.2 — Reading Activity ✅
- [x] Progress logging (page / percentage)
- [x] Session timer (start/stop)
- [x] Pages-per-hour calculation
- [x] Mark book as Finished
- [x] Mark book as Abandoned

### Milestone 1.3 — Enrichment ✅
- [x] 1–5 star rating
- [x] Private review / notes
- [x] Manual start/finish date entry
- [x] Re-read support

### Milestone 1.4 — Stats & Goals ✅
- [x] Stats dashboard (books read, pages, hours, speed, streak, genre)
- [x] Annual book goal with progress bar

### Milestone 1.5 — iOS
- [ ] iOS app feature parity with web (milestones 1.1–1.4)
- [ ] Barcode scan via camera
- [ ] iOS session timer (background-aware)

**Exit criteria:** Closed beta users can complete the full critical user journey on web and iOS without critical bugs.

---

## Phase 2 — Polish & Launch

**Goal:** Public launch. Monetization live. App Store approved.

### Deliverables
- [ ] Onboarding flow (first-run experience, import prompt)
- [ ] Empty states and loading states polished
- [ ] Responsive design tested across devices
- [ ] Monetization tiers implemented (Free / Reader / Bibliophile)
- [ ] Stripe payment integration
- [ ] Feature gating per tier
- [ ] iOS App Store submission and approval
- [ ] Marketing landing page
- [ ] Privacy policy and terms of service
- [ ] Basic email notifications (welcome, weekly summary)
- [ ] Support channel established

**Exit criteria:** App is publicly available on web and iOS App Store. First paying customers.

---

## Phase 3 — Growth

**Goal:** Increase retention and expand platform reach.

### Deliverables
- [ ] Year-in-Review shareable card
- [ ] Social profiles (opt-in, public reading profile)
- [ ] Follow friends, see their currently-reading
- [ ] Reading challenges with friends
- [ ] Author follow + new release alerts
- [ ] Recommendations engine (based on reading history)
- [ ] Series tracking
- [ ] Custom shelves and tags
- [ ] Advanced goal types (pages/day, genre diversity, time-based)
- [ ] Push notification reminders (iOS)
- [ ] Android app

**Exit criteria:** Month-over-month user growth. Social features driving referrals.

---

## Phase 4 — Scale

**Goal:** Platform depth and third-party ecosystem.

### Deliverables
- [ ] Public API (read-only, for integrations)
- [ ] Kindle/Kobo reading sync (via integrations)
- [ ] Audiobook support (Audible integration)
- [ ] Advanced analytics export (CSV, PDF)
- [ ] Book club / group reads feature
- [ ] Widget support (iOS home screen)
- [ ] Web browser extension (log progress from any site)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-21 | MVP targets web + iOS simultaneously | iOS barcode scan is a key differentiator worth the early cost |
| 2026-02-21 | Social features deferred to Phase 3 | Validate core value prop before social complexity |
| 2026-02-21 | Launch free tier first, gate later | Lower acquisition friction; validate retention before monetizing |
| 2026-02-21 | Goodreads import is P0 | Users won't rebuild their library from scratch |
