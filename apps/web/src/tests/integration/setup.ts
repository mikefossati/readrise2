import { beforeEach, afterAll, vi } from 'vitest'

// Point the DB client at the test database before any module imports it.
// The lazy proxy in packages/db/src/client.ts defers createClient() until first access,
// so setting the env var here (in setupFiles, which run before test files) is sufficient.
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/readrise_test'

// Reset the singleton so this process always uses the test URL.
// Needed when the same Node process runs multiple test suites.
if (globalThis.__db) {
  globalThis.__db = undefined
}

// Mock next/server Response helpers that aren't available in bare Node
vi.mock('next/headers', () => ({ cookies: vi.fn() }))

import { truncateAll, seedTestUser } from './db-helpers'

beforeEach(async () => {
  await truncateAll()
  await seedTestUser()
})

afterAll(async () => {
  // Allow the postgres-js pool to drain so Vitest can exit cleanly.
  // We do a short sleep rather than reaching into the connection pool internals.
  await new Promise((r) => setTimeout(r, 200))
})
