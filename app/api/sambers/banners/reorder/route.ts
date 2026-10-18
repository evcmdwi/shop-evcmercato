import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/** POST `{ ids: string[] }` — urutan baru (index = sort_order). */
export async function POST(req: NextRequest) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })
  const body = await req.json().catch(() => null)
  const ids: unknown = body?.ids
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string') || ids.length > 200) {
    return NextResponse.json({ error: 'Data urutan tidak valid' }, { status: 400 })
  }
  const admin = getSupabaseAdmin()
  const results = await Promise.all(
    (ids as string[]).map((id, i) => admin.from('hero_banners').update({ sort_order: i }).eq('id', id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })
  revalidateTag('hero-banners', { expire: 0 })
  return NextResponse.json({ ok: true })
}
