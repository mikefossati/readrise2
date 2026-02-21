import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // postgres-js with connection pooling params for Supabase
  const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(sql, { schema })
}

// Singleton for server-side usage (avoids multiple connections in dev with hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createClient> | undefined
}

export const db = globalThis.__db ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db
}

export type Db = typeof db
