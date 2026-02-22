# ReadRise — Phase 2.5: UX/UI Redesign

**Created:** 2026-02-22
**Status:** Planned
**Audience:** Young adults (18–30), book-curious, aesthetic-aware
**Constraint:** No schema changes. No new API routes. Visual and structural changes only.

---

## 1. Why This Phase Exists

Phase 2 shipped a functionally complete product. The UX is correct but the UI is generic — zinc cards on white/dark, a productivity-tool sidebar, and a dashboard with no emotional hierarchy. It reads as a SaaS admin panel, not a product for people who love books.

Young adults in 2026 choose apps that feel like an extension of their identity. They follow #BookTok and #Bookstagram. They buy the annotated edition. Competitors like StoryGraph are winning this audience precisely because they feel personal. ReadRise needs warmth, personality, and a clear emotional hook before Phase 3 growth work begins.

**The one-sentence brief:** Warm it up, make streak the hero, and let the books do the visual work.

---

## 2. Design Principles

### 2.1 Warm minimalism, not cold minimalism
Replace zinc-gray with a warmer palette. Keep spacious layout but use ink-black, warm cream, and a single amber accent. Think: independent bookshop, not productivity SaaS.

### 2.2 Streak as identity
The reading streak is the single most powerful engagement mechanic available. It should appear on every surface — sidebar, dashboard hero, session completion toast, onboarding completion. Losing a streak should feel bad. Hitting a milestone should feel like an achievement.

### 2.3 Book covers do the visual work
Large cover art replaces uniform colored cards. The library should look like a real shelf — varied, personal, visually rich. Covers are already fetched from Google Books; we just need to show them larger.

---

## 3. Design System Changes

### 3.1 Color Palette

| Token | Current | New | Use |
|-------|---------|-----|-----|
| Background | `zinc-50` / `zinc-950` | `#faf8f4` (warm white) / `#1a1a2e` (ink) | Page background |
| Card bg | `white` / `zinc-900` | `#f0ebe0` (parchment) / `#252538` | Card backgrounds |
| Primary accent | `zinc-900` / `white` | `#e8923a` (amber) | CTAs, active states, streak |
| Accent soft | — | `#fef3e2` | Tinted card backgrounds |
| Success / streak | `green-600` | `#5c7a64` (sage) | Streak, goals, complete |
| Muted text | `zinc-500` | `#7a7068` | Metadata, labels |
| Border | `zinc-200` | `#ddd5c8` | Card and input borders |

### 3.2 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / headings | Fraunces (serif, Google Fonts) | 700 | 48px hero → 28px section |
| UI / body | Inter (current) | 400–600 | 18px body → 13px meta |

Fraunces is a variable optical-size serif with personality — widely used in editorial and lifestyle products. It replaces the current sans-serif headings for all `h1` display-level text only; Inter stays for all functional UI text.

### 3.3 Spacing & Shape
- Card border-radius: `12px` (up from `8px`) — softer, more inviting
- Sidebar: slim icon rail `64px` wide (down from `224px`)
- Book covers: `128px` wide in grid (up from current thumbnail sizes)
- "Now Reading" covers: `full card height` with gradient overlay

---

## 4. Screen-by-Screen Specification

---

### 4.1 Sidebar — Slim Icon Rail

**Current:** 224px fixed sidebar with text labels and four nav items.
**New:** 64px icon-only rail with tooltip labels on hover and streak counter pinned to bottom.

**Layout:**
```
┌────┐
│    │   ← Ink background (#1a1a2e)
│ ◉  │   ← Logo mark only (no "ReadRise" text)
│────│
│ 󱉒  │   ← Dashboard   (active = amber left-border + icon)
│ 󰂫  │   ← Library
│ ◎  │   ← Goals
│ ≡  │   ← Billing
│    │
│    │   ← flex-1 spacer
│────│
│ 🔥 │   ← Streak flame icon (amber, Lucide Flame)
│ 14 │   ← Day count in amber, 11px
│    │
│ 👤 │   ← User avatar (user menu on click)
└────┘
```

**Behaviour:**
- Hover any icon → tooltip label slides in from right (no permanent labels)
- Streak counter updates live via the plan data already fetched in dashboard layout
- Zero nav items removed — same four destinations, just more compact

**Files to change:** `src/components/layout/sidebar.tsx`

---

### 4.2 Dashboard Page

**Current:** Page greeting + four identical stat cards + goal card.
**New:** Streak hero card (full width) + compact stat row + two-col cards (goal + currently reading) + recent sessions list.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Good morning, Sofia.                           Feb 22       │
│                                                              │
│  ┌── STREAK HERO (amber-tinted, full width) ──────────────┐ │
│  │  🔥  14-day streak                                      │ │
│  │  ████████████████████░░░░  Read today to keep it going. │ │
│  │                                        [ Log session → ]│ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 12 books │ │ 3,847 pg │ │  68 hrs  │ │ 42 p/hr  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌────────────────────────────┐ ┌────────────────────────┐  │
│  │  2026 Goal                 │ │  Currently Reading     │  │
│  │  12/24 ████░░░░ 50%        │ │  [cover] Title         │  │
│  │  On pace for 26 ✓          │ │  p.187 / 412           │  │
│  │                            │ │  [ Continue → ]        │  │
│  └────────────────────────────┘ └────────────────────────┘  │
│                                                              │
│  Recent sessions                                        All  │
│  ──────────────────────────────────────────────────────      │
│  [cover]  Tomorrow...   Feb 22  1h 12m  48 p/hr             │
│  [cover]  Crying in H   Feb 21  0h 45m  39 p/hr             │
└──────────────────────────────────────────────────────────────┘
```

**Key changes from current:**
- Streak hero card (amber `#fef3e2` background, Flame icon, progress bar, CTA to book detail)
- Stat cards become a compact single row (smaller, no icons)
- "Currently Reading" card links directly to the active book
- Recent sessions list replaces nothing — it is a new section sourced from existing API data (`readingSessions` already returned from stats)
- Greeting uses Fraunces font

**Files to change:** `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/loading.tsx`

---

### 4.3 Library Page

**Current:** Tabs across top, uniform small-cover grid for all shelves.
**New:** "Now Reading" featured band pinned above the tab group; tabs for all other shelves; larger covers in grid.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Library                              [Import]  [+ Add book] │
│                                                              │
│  ── Now Reading ─────────────────────────────────────────    │
│  ┌─────────────────────────────┐ ┌───────────────────────┐   │
│  │ [COVER tall, gradient foot] │ │ [COVER tall]          │   │
│  │ Tomorrow, and Tomorrow...   │ │ Crying in H Mart      │   │
│  │ ████████░░░░  p.187 / 412   │ │ ████░░░░░  p.89 / 239 │   │
│  │ [ Continue → ]              │ │ [ Continue → ]        │   │
│  └─────────────────────────────┘ └───────────────────────┘   │
│                                                              │
│  [ Want to Read 14 ]  [ Finished 12 ]  [ Abandoned 3 ]       │
│  ────────────────────────────────────────────────────         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                        │
│  │   │ │   │ │   │ │   │ │   │ │   │                        │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                        │
│  Title  Title  Title  Title  Title  + Add                    │
└──────────────────────────────────────────────────────────────┘
```

**Key changes:**
- "Now Reading" is a permanently visible featured band — not a tab, not hideable — because active books are the primary engagement loop
- Each reading-book card shows cover (tall, ~200px), title, author, progress bar, and "Continue" CTA
- Tabs below cover Want to Read / Finished / Abandoned only
- Grid for tabbed shelves uses `128px` wide covers (up from current ~80px)
- Last card in every grid is an "Add book" ghost card

**Files to change:** `src/app/(dashboard)/library/page.tsx`

---

### 4.4 Book Detail Page

**Current:** Small cover in header, stacked info cards, session timer buried in card 2.
**New:** Large cover hero header (parchment background), session card promoted to primary action zone immediately below header.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  ← Library                                                   │
│                                                              │
│  ┌── BOOK HEADER (parchment bg) ─────────────────────────┐  │
│  │  [COVER 180px]  Tomorrow, and Tomorrow, and Tomorrow   │  │
│  │                 Gabrielle Zevin                        │  │
│  │                 416 pages · Literary Fiction           │  │
│  │                 ★ ★ ★ ★ ☆                              │  │
│  │                 [ Reading ▾ ]  [ Physical ▾ ]          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌── SESSION (amber-tinted) ─────────────────────────────┐  │
│  │  ⏱ 00:00:00    p.187 → [____]         [ ▶  Start ]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Progress  ████████████░░░░  p.187 / 416  45%               │
│                                                              │
│  Session history                                             │
│  Feb 22  1h 12m  p.147→187  48 p/hr                         │
│  Feb 21  0h 45m  p.102→147  39 p/hr                         │
│                                                              │
│  Notes                                                   ✎  │
│  "Achingly beautiful. The friendship between Sadie..."       │
└──────────────────────────────────────────────────────────────┘
```

**Key changes:**
- Book header has parchment background (`#f0ebe0`) to set it apart from page bg
- Cover size increased to `180px` height
- Session timer card is the first content card, not the second — promotes the core action loop
- Session card has amber tint to match streak/action color language
- "Session history" is a flat list (no card wrapper) — reduces visual noise
- Notes section is inline, not a separate card with a form header

**Files to change:** `src/app/(dashboard)/books/[id]/page.tsx`, `src/components/reading/session-timer.tsx`

---

### 4.5 Goals Page

**Current:** Progress bar + number input + quick presets.
**New:** Adds pace indicator sentence and monthly bar chart; otherwise keeps existing structure.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  2026 Reading Goal                                           │
│                                                              │
│  ┌── PROGRESS CARD ─────────────────────────────────────┐   │
│  │  12  read          ████████████░░░░░░░░░░  of 24     │   │
│  │  ─────────────────────────────────────────────────    │   │
│  │  📅  At your current pace you'll finish with 2 spare  │   │
│  │  📖  Averaging 1.3 books/month this year              │   │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Monthly breakdown                                           │
│  Jan ██████ 3    Feb ████ 2    Mar ░░ —    Apr ░░ —         │
│  May ░░ —   Jun ░░ —    Jul ░░ —    Aug ░░ —                │
│                                                              │
│  Update goal                                                 │
│  ┌────────────┐  [ Update ]                                  │
│  │  24      ↕ │                                              │
│  └────────────┘                                              │
│  Quick set: [ 12 ]  [ 24 ]  [ 36 ]  [ 52 ]                  │
└──────────────────────────────────────────────────────────────┘
```

**Key changes:**
- Pace indicator sentence (derived from `booksReadThisYear / weekOfYear * 52`)
- Monthly bar chart (derived from existing `readingSessions` data grouped by month — no new API needed)
- "2026 Book Goal" heading uses Fraunces font

**Files to change:** `src/app/(dashboard)/goals/page.tsx`

---

### 4.6 Landing Page

**Current:** Text hero + feature strip + pricing. No product preview. No social proof.
**New:** Adds a product screenshot block and a scrolling testimonial/social-proof strip between hero and features.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  ◉ ReadRise                        Sign in   Get started →  │
├──────────────────────────────────────────────────────────────┤
│  Your reading life,                                          │  ← Fraunces 52px
│  finally organised.                                          │
│                                                              │
│  Track books. Measure your speed. Build a streak.            │
│                                                              │
│  [ Start for free → ]   [ See how it works ]                 │
│                                                              │
│  ┌── PRODUCT SCREENSHOT (tilted, shadow) ─────────────────┐ │
│  │   ░░ dashboard preview with streak + covers ░░         │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  "The reading tracker I never knew I needed." @bookclub_isa  │  ← Marquee strip
│  "Finally quit Goodreads for this."  @readswith_roma         │
├──────────────────────────────────────────────────────────────┤
│  Feature strip  ·  Pricing table (unchanged structure)       │
└──────────────────────────────────────────────────────────────┘
```

**Key changes:**
- Hero headline switches to Fraunces font
- Product screenshot block (static image or iframe-style mockup) after CTAs
- Social proof marquee strip between hero and features
- CTA button uses amber background

**Files to change:** `src/app/page.tsx`

---

### 4.7 Onboarding — Step 1 & Step 4 Tone

**Current:** Functional wizard, clinical tone, step 4 has an emoji as the only warmth.
**New:** Fraunces headline on every step; step 4 shows streak counter initialised to Day 1.

**Step 4 — Done (new):**
```
┌──────────────────────────────────┐
│    ● ● ● ●  (progress dots)      │
│                                  │
│         🔥                       │
│                                  │
│   You're on a 1-day streak.      │  ← Streak begins NOW
│                                  │
│   Your reading life starts       │  ← Fraunces
│   today, Sofia.                  │
│                                  │
│   [ Go to my library → ]         │
└──────────────────────────────────┘
```

Initialising the streak counter on day 1 is a psychological anchor — it gives users something to protect immediately.

**Files to change:** `src/app/onboarding/page.tsx`

---

## 5. Implementation Plan

Work is purely front-end. No schema changes, no new API routes, no new packages beyond one font (`next/font/google` — already available in Next.js).

### Milestone 2.5-A — Design System Foundation
1. Add Fraunces via `next/font/google` in `layout.tsx`
2. Update `tailwind.config` / CSS variables with new palette tokens
3. Update sidebar to slim icon rail with streak badge

### Milestone 2.5-B — Dashboard & Library (highest impact)
4. Rebuild dashboard: streak hero card, compact stat row, currently-reading card, recent sessions
5. Rebuild library: "Now Reading" featured band, larger cover grid

### Milestone 2.5-C — Book Detail & Goals
6. Book detail: parchment header, promote session card, flatten session history
7. Goals: add pace indicator sentence and monthly bar chart

### Milestone 2.5-D — Landing & Onboarding
8. Landing page: Fraunces heading, product screenshot block, social proof marquee
9. Onboarding: Fraunces headings, step 4 streak initialisation

### Milestone 2.5-E — QA
10. Visual QA across breakpoints (mobile 375px, tablet 768px, desktop 1280px)
11. Run full test suite — no component tests should break (layout changes only)
12. Lint + typecheck + build clean

---

## 6. Files Affected

| File | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | Add Fraunces font variable |
| `apps/web/tailwind.config.ts` (or CSS) | New palette tokens |
| `apps/web/src/components/layout/sidebar.tsx` | Slim icon rail, streak badge |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx` | Full rebuild per spec |
| `apps/web/src/app/(dashboard)/dashboard/loading.tsx` | Update skeleton shapes |
| `apps/web/src/app/(dashboard)/library/page.tsx` | Now Reading band, larger grid |
| `apps/web/src/app/(dashboard)/books/[id]/page.tsx` | Parchment header, session promoted |
| `apps/web/src/components/reading/session-timer.tsx` | Amber card styling |
| `apps/web/src/app/(dashboard)/goals/page.tsx` | Pace indicator, monthly chart |
| `apps/web/src/app/page.tsx` | Fraunces hero, screenshot block, marquee |
| `apps/web/src/app/onboarding/page.tsx` | Fraunces headings, streak on step 4 |

No changes to: API routes, database schema, auth flow, billing, privacy/terms, test files.

---

## 7. Success Criteria

- Streak counter is visible from every authenticated screen (sidebar badge)
- "Now Reading" books are never more than one click from continuing a session
- Dashboard communicates emotional state (streak alive/at risk) not just data counts
- Library feels like a personal collection, not a data table
- Full test suite still passes after all changes
- Lighthouse performance score does not regress (Fraunces is subset-loaded via `next/font`)
