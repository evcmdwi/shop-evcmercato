import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  FEATURED_LIMIT,
  FEATURED_SETTING_KEY,
  cardPrice,
  getAutoRankedProducts,
  parseFeaturedIds,
} from '@/lib/catalog'

/** GET — produk aktif (urut otomatis) + urutan manual yang tersimpan. */
export async function GET() {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })
  const admin = getSupabaseAdmin()
  const [ranked, { data: setting, error }] = await Promise.all([
    getAutoRankedProducts(admin),
    admin.from('site_settings').select('value').eq('key', FEATURED_SETTING_KEY).maybeSingle(),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ids: parseFeaturedIds(setting?.value),
    products: ranked.map((p) => ({
      id: p.id,
      name: p.name,
      image_url: p.images?.[0] || p.image_url || null, // sama dengan ProductCard
      category: p.categories?.name ?? null,
      price: cardPrice(p).price,
    })),
  })
}

/** PUT `{ ids: string[] }` — maks 6 ID produk aktif, urut dari kiri. [] = otomatis penuh. */
export async function PUT(req: NextRequest) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })
  const body = await req.json().catch(() => null)
  const ids: unknown = body?.ids
  if (
    !Array.isArray(ids) ||
    ids.length > FEATURED_LIMIT ||
    ids.some((i) => typeof i !== 'string') ||
    new Set(ids).size !== ids.length
  ) {
    return NextResponse.json({ error: `Pilih maksimal ${FEATURED_LIMIT} produk berbeda` }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  if (ids.length) {
    const { data, error } = await admin.from('products').select('id').in('id', ids).eq('is_active', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if ((data ?? []).length !== ids.length) {
      return NextResponse.json({ error: 'Ada produk yang tidak aktif atau sudah dihapus' }, { status: 400 })
    }
  }

  const { error } = await admin
    .from('site_settings')
    .upsert({ key: FEATURED_SETTING_KEY, value: ids, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('home-data', { expire: 0 })
  return NextResponse.json({ ok: true })
}
