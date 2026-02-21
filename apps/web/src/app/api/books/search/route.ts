import { searchBooks } from '@/lib/google-books'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    console.error('[/api/books/search] auth failed:', authError?.message ?? 'no user')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ data: [] })
  }

  const volumes = await searchBooks(query.trim())
  console.log(`[/api/books/search] q="${query}" → ${volumes.length} results`)
  return NextResponse.json({ data: volumes })
}
