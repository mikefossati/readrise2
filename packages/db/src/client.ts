import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Supabase connection pooler (pgbouncer) in transaction mode:
  // - max: 1 per serverless invocation — the pooler manages the real pool
  // - prepare: false — pgbouncer transaction mode doesn't support prepared statements
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  })

  return drizzle(sql, { schema })
}

// Singleton for server-side usage (avoids multiple connections in dev with hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createClient> | undefined
}

function getDb() {
  if (!globalThis.__db) {
    globalThis.__db = createClient()
  }
  return globalThis.__db
}

// Lazy proxy — createClient() is deferred until the first query, so importing
// this module during `next build` (without DATABASE_URL) doesn't throw.
export const db = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop as string)
  },
})

export type Db = typeof db
