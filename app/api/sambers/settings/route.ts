import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/** PUT `{ hero_interval_seconds: number (3–10) }` */
export async function PUT(req: NextRequest) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })
  const body = await req.json().catch(() => null)
  const rows: { key: string; value: unknown; updated_at: string }[] = []
  const now = new Date().toISOString()

  if (body?.hero_interval_seconds !== undefined) {
    const n = Number(body.hero_interval_seconds)
    if (!Number.isInteger(n) || n < 3 || n > 10) {
      return NextResponse.json({ error: 'Interval harus 3–10 detik' }, { status: 400 })
    }
    rows.push({ key: 'hero_interval_seconds', value: n, updated_at: now })
  }
  if (rows.length === 0) return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })

  const { error } = await getSupabaseAdmin().from('site_settings').upsert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('hero-banners', { expire: 0 })
  return NextResponse.json({ ok: true })
}
