import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  HERO_MAX_SLIDES,
  bannerStatus,
  parseHeroSettings,
  toSlide,
  type HeroBanner,
} from '@/lib/hero-banners'
import { validateBannerInput } from './validate'

/**
 * GET  — daftar banner + pengaturan + pilihan produk/kategori untuk form.
 *        `?preview=1` → data draf untuk carousel beranda (semua banner yang belum berakhir).
 * POST — buat banner baru (urutan paling akhir).
 */
export async function GET(req: NextRequest) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const admin = getSupabaseAdmin()
  const [{ data: banners, error }, { data: settingRows }] = await Promise.all([
    admin.from('hero_banners').select('*').order('sort_order').order('created_at'),
    admin.from('site_settings').select('key, value').like('key', 'hero_%'),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const settings = parseHeroSettings(settingRows)
  const list = (banners ?? []) as HeroBanner[]

  if (req.nextUrl.searchParams.get('preview') === '1') {
    let drafts = list.filter((b) => bannerStatus(b) !== 'Berakhir')
    const focus = req.nextUrl.searchParams.get('banner')
    let start = 0
    if (focus) {
      const target = list.find((b) => b.id === focus)
      if (target) {
        drafts = [target, ...drafts.filter((b) => b.id !== focus)]
        start = 0
      }
    }
    return NextResponse.json({ slides: drafts.slice(0, HERO_MAX_SLIDES).map(toSlide), settings, start })
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    admin.from('products').select('name, slug').eq('is_active', true).order('name'),
    admin.from('categories').select('name, slug').order('name'),
  ])
  return NextResponse.json({ banners: list, settings, products: products ?? [], categories: categories ?? [] })
}

export async function POST(req: NextRequest) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const parsed = validateBannerInput(await req.json().catch(() => null))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: last } = await admin.from('hero_banners').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const sort_order = (last?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await admin.from('hero_banners').insert({ ...parsed.data, sort_order }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('hero-banners', { expire: 0 })
  return NextResponse.json({ banner: data })
}
