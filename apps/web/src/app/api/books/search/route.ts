import { searchBooks } from '@/lib/google-books'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-helpers'

export async function GET(request: Request) {
  const { error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ data: [] })
  }

  const volumes = await searchBooks(query.trim())
  return NextResponse.json({ data: volumes })
}
