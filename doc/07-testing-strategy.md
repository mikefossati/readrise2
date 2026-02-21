# ReadRise — Testing Strategy

**Last updated:** 2026-02-21
**Status:** Active policy — non-negotiable for all new code

---

## Policy

**Every new feature ships with tests. No exceptions.**

- New API routes → integration tests covering the happy path + auth error + ownership error
- New utility/helper functions → unit tests with full branch coverage
- New domain components (session timer, forms, dialogs) → component tests covering all interaction paths
- New critical user journeys → an E2E scenario or extension of an existing one

PRs that add functionality without corresponding tests will not be merged.

---

## Tooling

| Layer | Tool | Config file |
|-------|------|-------------|
| Unit & Integration | [Vitest](https://vitest.dev) | `vitest.config.ts` |
| Component | Vitest + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | `vitest.config.ts` (jsdom environment) |
| E2E | [Playwright](https://playwright.dev) | `playwright.config.ts` |
| API mocking | [MSW](https://mswjs.io) (Mock Service Worker) | `src/tests/msw/` |
| Test database | Docker Compose + `postgres:16` | `docker-compose.test.yml` |

**Why Vitest over Jest:** The project uses `"module": "ESNext"` / `"moduleResolution": "Bundler"`. Vitest handles this natively. Jest requires fragile transform config for the same setup.

**Why real DB for integration tests:** The API routes use multi-table joins, upserts with conflict targets, aggregate SQL (`count`, `sum`, `avg`), and cascade deletes. Mocking Drizzle would test nothing meaningful.

---

## Test Pyramid

```
                   ┌──────────────────────────┐
                   │   E2E  (Playwright)        │  ~15 scenarios
                   │   Critical user journeys   │
                   └────────────────────────────┘
              ┌──────────────────────────────────────┐
              │   Integration  (Vitest + real DB)     │  ~35 tests
              │   API route handlers                  │
              └────────────────────────────────────────┘
         ┌──────────────────────────────────────────────┐
         │   Component  (Vitest + RTL)                   │  ~30 tests
         │   Domain UI components, mocked fetch          │
         └────────────────────────────────────────────────┘
    ┌──────────────────────────────────────────────────────┐
    │   Unit  (Vitest)                                      │  ~40 tests
    │   Pure functions, data transforms, business logic     │
    └────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Unit Tests

**Target:** Pure functions with no external dependencies. Zero mocking required.

### What to test

| File | Functions | Scenarios |
|------|-----------|-----------|
| `lib/format.ts` | `formatDuration` | Zero seconds, sub-minute, hour rollover, large values |
| `lib/format.ts` | `formatDate` | Valid ISO string, locale output consistency |
| `lib/google-books.ts` | `volumeToBookData` | All fields mapped, missing optional fields default to null, ISBN extraction, cover URL construction |
| `lib/utils.ts` | `cn` | Tailwind class conflict resolution, falsy values dropped |
| `lib/streak.ts` *(extract from stats route)* | `calculateStreak` | Consecutive days, gap resets streak, single-day, empty history, streak including today vs yesterday |
| `lib/shelf.ts` *(extract from goodreads route)* | `mapShelf` | All Goodreads shelf names → correct enum, unknown input defaults to `want_to_read` |
| `lib/sessions.ts` *(extract from sessions route)* | `calcPagesPerHour` | Normal case, zero duration guard, null pages guard |

> **Rule:** If you write a pure function that contains branching logic, extract it to `lib/` and write a unit test immediately. Inline business logic in route handlers is untestable without integration overhead.

### Example

```ts
// apps/web/src/lib/format.test.ts
import { describe, test, expect } from 'vitest'
import { formatDuration } from './format'

describe('formatDuration', () => {
  test('zero seconds', () => expect(formatDuration(0)).toBe('00:00:00'))
  test('sub-minute', () => expect(formatDuration(45)).toBe('00:00:45'))
  test('1h 1m 1s', () => expect(formatDuration(3661)).toBe('01:01:01'))
  test('large values do not cap', () => expect(formatDuration(36000)).toBe('10:00:00'))
})
```

---

## Layer 2 — Component Tests

**Target:** Domain components. Test user-visible behavior (what the user sees and clicks), not implementation details.

### What to test

| Component | Key scenarios |
|-----------|--------------|
| `SessionTimer` | Shows `00:00:00` when no active session; elapsed ticks with fake timers; Start fires POST; Stop fires PATCH with correct `endPage`; buttons disable during pending |
| `BookSearch` | No request fired below 2 chars; 350ms debounce fires exactly one request; results render; Add button fires POST and closes dialog; error message shown on API failure |
| `ProgressForm` | Rejects page > pageCount; valid submit fires POST with correct body; toast shown on success |
| `ReviewForm` | Star rating selection updates value; submit fires PUT; existing review pre-populates fields |
| `GoodreadsImport` | Rejects non-CSV file; parses valid CSV and calls POST; progress shown during import; per-row error summary rendered |
| `ShelfActions` | Dropdown renders all shelf options; selecting new shelf fires PATCH; navigates/refreshes on success |

### Setup pattern

```ts
// vitest.config.ts — jsdom environment for component tests
// Mock fetch globally, or use MSW handlers in src/tests/msw/handlers.ts

// apps/web/src/components/reading/session-timer.test.tsx
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, test, expect } from 'vitest'
import { SessionTimer } from './session-timer'

vi.useFakeTimers()

test('increments elapsed every second while session is active', async () => {
  render(
    <SessionTimer
      userBookId="ub1"
      currentPage={50}
      activeSessionId="sess1"
      activeSessionStart={new Date().toISOString()}
    />
  )
  await act(() => vi.advanceTimersByTime(3000))
  expect(screen.getByText('00:00:03')).toBeInTheDocument()
})

test('shows 00:00:00 when no session', () => {
  render(
    <SessionTimer
      userBookId="ub1"
      currentPage={null}
      activeSessionId={null}
      activeSessionStart={null}
    />
  )
  expect(screen.getByText('00:00:00')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
})
```

---

## Layer 3 — Integration Tests

**Target:** API route handlers exercised against a real test PostgreSQL database.

### Test database setup

```bash
# Start test DB
docker compose -f docker-compose.test.yml up -d

# Apply schema
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/readrise_test \
  pnpm --filter @readrise/db db:push
```

Each test file:
- `beforeAll` — connects to test DB, seeds one test user
- `beforeEach` — truncates all tables in FK-safe order, re-seeds the test user
- `afterAll` — closes DB connection

Mock only Supabase auth (`vi.mock('@/lib/supabase/server')`) returning the seeded user's `authId`.

### Routes to cover

| Route | Methods | Required test cases |
|-------|---------|---------------------|
| `/api/library` | GET, POST | Add book → 201 + correct shelf; duplicate book uses existing record; GET returns only caller's books |
| `/api/library/[id]` | PATCH, DELETE | Shelf update persists; wrong user → 404; DELETE cascades to progress/sessions/reviews |
| `/api/library/[id]/progress` | POST | Logs page; `want_to_read` book auto-promoted to `reading`; page logged, percent calculated |
| `/api/library/[id]/review` | GET, PUT | Upsert — insert then update; rating validated (1–5, 0.5 steps); wrong user → 404 |
| `/api/library/[id]/sessions` | POST | New session created; any open session for same book closed first |
| `/api/library/[id]/sessions/[sessionId]` | PATCH | `durationSeconds`, `pagesRead`, `pagesPerHour` calculated correctly; session closed |
| `/api/stats` | GET | `booksReadThisYear` counts finished books in year; streak reflects session days |
| `/api/goals` | GET, POST | Create goal; update target on second POST for same year |

**Every route must also have:**
- Unauthenticated request → 401
- `userBookId` belonging to another user → 404
- Malformed request body → 400

### Example

```ts
// apps/web/src/app/api/library/library.test.ts
import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { POST, GET } from './route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: TEST_AUTH_ID } } }) }
  })
}))

describe('POST /api/library', () => {
  beforeEach(truncateAndSeedTestUser)

  test('adds book and returns 201 with want_to_read shelf', async () => {
    const req = new Request('http://test/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: mockGoogleBooksVolume }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.shelf).toBe('want_to_read')
  })

  test('second add of same book reuses existing book record', async () => {
    const req = () => new Request('http://test/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: mockGoogleBooksVolume }),
    })
    await POST(req())
    const res = await POST(req())
    // should not duplicate the book row
    expect(res.status).toBe(201)
    const bookCount = await db.select().from(books).where(eq(books.googleBooksId, 'test-id'))
    expect(bookCount).toHaveLength(1)
  })
})
```

---

## Layer 4 — End-to-End Tests (Playwright)

**Target:** Critical user journeys from browser to DB and back.

### Environment

- Run against `next start` with a dedicated E2E test database
- Playwright [global setup](https://playwright.dev/docs/auth) authenticates once, saves session cookie — tests reuse it to avoid repeated login
- `beforeEach` calls DB helper to seed fresh test data

### Scenarios

| Scenario | Priority |
|----------|----------|
| Unauthenticated `/dashboard` → redirect to `/login` | P0 |
| Sign up with email + password → land on dashboard | P0 |
| Log in → log out → redirect to `/login` | P0 |
| Search Google Books → add to library → appears in "Want to Read" | P0 |
| Move book to "Reading" shelf → appears in correct tab | P1 |
| Log reading progress → progress bar updates on book card | P1 |
| Start session → timer visible → stop → session in history | P1 |
| Set annual reading goal → progress percentage shown on dashboard | P1 |
| Upload valid Goodreads CSV → success summary with imported count | P2 |
| Upload invalid file type → error message | P2 |
| Rate and review a book → stars persist on page reload | P2 |

### Example

```ts
// apps/web/e2e/library.spec.ts
import { test, expect } from '@playwright/test'

test('add a book to library from search', async ({ page }) => {
  await page.goto('/library')
  await page.getByRole('button', { name: /search books/i }).click()
  await page.getByPlaceholder(/search/i).fill('Pragmatic Programmer')
  await page.getByText('The Pragmatic Programmer').first().click()
  await page.getByRole('button', { name: /add to library/i }).click()
  await page.getByRole('tab', { name: /want to read/i }).click()
  await expect(page.getByText('The Pragmatic Programmer')).toBeVisible()
})

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})
```

---

## CI Integration

Three new jobs added to `.github/workflows/ci.yml`, gated on the existing lint/typecheck job:

```yaml
unit-and-component:
  needs: ci
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with: { node-version: 24 }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter @readrise/web test:unit
    - run: pnpm --filter @readrise/web test:components

integration:
  needs: ci
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_DB: readrise_test
        POSTGRES_PASSWORD: postgres
      ports: ['5432:5432']
      options: --health-cmd pg_isready --health-interval 5s --health-retries 5
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/readrise_test
    NEXT_PUBLIC_SUPABASE_URL: http://supabase.test
    NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with: { node-version: 24 }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter @readrise/db db:push
    - run: pnpm --filter @readrise/web test:integration

e2e:
  needs: [unit-and-component, integration]
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_DB: readrise_e2e
        POSTGRES_PASSWORD: postgres
      ports: ['5432:5432']
      options: --health-cmd pg_isready --health-interval 5s --health-retries 5
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/readrise_e2e
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with: { node-version: 24 }
    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter @readrise/db db:push
    - run: pnpm exec playwright install --with-deps chromium
    - run: pnpm --filter @readrise/web build
    - run: pnpm --filter @readrise/web test:e2e
```

---

## Package Scripts

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --project unit",
    "test:components": "vitest run --project components",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Unit | 95% line | Pure functions — exhaustive coverage is straightforward |
| Component | 70% branch | Cover all interaction paths; skip trivial presentational branches |
| Integration | 80% route | All happy paths + auth/ownership error case per route |
| E2E | P0 + P1 scenarios | Not a coverage metric — these are regression smoke tests |

Coverage is enforced in CI via `vitest --coverage` with thresholds set in `vitest.config.ts`.

---

## Test File Conventions

```
apps/web/
  src/
    lib/
      format.ts
      format.test.ts          ← unit test lives next to the file it tests
    app/
      api/
        library/
          route.ts
          route.test.ts        ← integration test lives next to the route
    components/
      reading/
        session-timer.tsx
        session-timer.test.tsx ← component test lives next to the component
  e2e/
    auth.spec.ts               ← Playwright specs in dedicated top-level directory
    library.spec.ts
    goals.spec.ts
```

Test files live next to the source files they test (except E2E which lives in `e2e/`). No separate `__tests__` directories.

---

## Implementation Order

When building out the test suite from scratch, follow this sequence for maximum coverage-per-effort:

1. **Vitest setup** — install deps, write `vitest.config.ts`, validate with a trivial test
2. **Unit: `lib/format.ts`** — 5 tests, zero mocking, immediate CI value
3. **Extract + unit test streak logic, `mapShelf`, `calcPagesPerHour`** from route handlers into `lib/`
4. **Integration: library routes** — core domain, highest business risk
5. **Integration: progress + sessions routes** — session calculation logic is subtle
6. **Component: `SessionTimer` + `BookSearch`** — most complex client components
7. **Playwright: auth flow + add-book E2E** — highest-value smoke tests
8. **Remaining component + E2E tests** incrementally alongside new features
