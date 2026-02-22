import { getAuthenticatedUser } from '@/lib/api-helpers'
import { db, users } from '@readrise/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ displayName: z.string().min(1).max(100) })

export async function GET() {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  return NextResponse.json({
    data: { displayName: dbUser!.displayName, avatarUrl: dbUser!.avatarUrl },
  })
}

export async function PATCH(req: Request) {
  const { dbUser, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const [updated] = await db
    .update(users)
    .set({ displayName: parsed.data.displayName, updatedAt: new Date() })
    .where(eq(users.id, dbUser!.id))
    .returning()

  return NextResponse.json({ data: updated })
}
