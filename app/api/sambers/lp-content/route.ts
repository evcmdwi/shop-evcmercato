import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { parseEvcResmiContent } from '@/lib/lp/evc-resmi'
import { CONTENT_SETTING_KEY, MAX_SCREENSHOTS, statDefaults, statLabels, type StatKey } from '@/content/lp/evc-resmi'

// LP yang angka & screenshot-nya bisa diisi dari Sambers › Landing Pages.
const LP_CONTENT: Record<string, { key: string; tag: string }> = {
  'evc-resmi': { key: CONTENT_SETTING_KEY, tag: 'lp-evc-resmi' },
}

const MAX_STAT = 40
// Screenshot hanya dari storage project ini (hasil /api/sambers/upload).
const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`

/** GET ?slug=… — angka (tersimpan atau bawaan) + label + screenshot. */
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  const lp = LP_CONTENT[req.nextUrl.searchParams.get('slug') ?? '']
  if (!lp) return NextResponse.json({ error: 'LP ini tidak punya angka yang bisa diedit' }, { status: 404 })

  const { data, error } = await getSupabaseAdmin().from('site_settings').select('value').eq('key', lp.key).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const content = parseEvcResmiContent(data?.value)
  return NextResponse.json({
    stats: (Object.keys(statDefaults) as StatKey[]).map((k) => ({ key: k, label: statLabels[k], value: content.stats[k] })),
    screenshots: content.screenshots,
    max_screenshots: MAX_SCREENSHOTS,
  })
}

/** PUT `{ slug, stats: { [key]: string }, screenshots: string[] }` — angka kosong = kembali ke bawaan. */
export async function PUT(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  const body = await req.json().catch(() => null)
  const lp = LP_CONTENT[body?.slug ?? '']
  if (!lp) return NextResponse.json({ error: 'LP ini tidak punya angka yang bisa diedit' }, { status: 404 })

  const stats: Record<string, string> = {}
  for (const k of Object.keys(statDefaults) as StatKey[]) {
    const v = body?.stats?.[k]
    if (typeof v !== 'string') continue
    if (v.trim().length > MAX_STAT) {
      return NextResponse.json({ error: `"${statLabels[k]}" terlalu panjang (maks ${MAX_STAT} karakter)` }, { status: 400 })
    }
    stats[k] = v.trim()
  }

  const shots = Array.isArray(body?.screenshots) ? body.screenshots : []
  if (shots.length > MAX_SCREENSHOTS) {
    return NextResponse.json({ error: `Maksimal ${MAX_SCREENSHOTS} screenshot` }, { status: 400 })
  }
  if (!shots.every((u: unknown) => typeof u === 'string' && u.startsWith(STORAGE_PREFIX))) {
    return NextResponse.json({ error: 'Screenshot harus diupload lewat Sambers' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('site_settings')
    .upsert({ key: lp.key, value: { stats, screenshots: shots }, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag(lp.tag, { expire: 0 })
  return NextResponse.json({ ok: true })
}
