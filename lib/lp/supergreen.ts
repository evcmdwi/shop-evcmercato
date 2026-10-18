import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { CARD_PRODUCT_SELECT, cardPrice, pointsForAmount, productSlug, soldCount } from '@/lib/catalog'
import type { ProductWithCategory } from '@/types/product'
import {
  DAILY_TABLETS,
  FAQ_SETTING_KEY,
  faqQuestions,
  packages,
  type PackageKey,
} from '@/content/lp/supergreen-food'

/** "Rp7.000" — format tanpa spasi seperti di brief. */
export const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')

export interface SgfPackage {
  key: PackageKey
  slug: string
  name: string
  detail: string
  badge: string
  highlight: boolean
  photo: string
  price: number
  /** Harga per hari (dosis dewasa), dibulatkan ke ratusan terdekat. */
  perDay: number
  points: number
}

export interface SgfData {
  packages: SgfPackage[]
  /** Harga per hari terendah, dibulatkan ke ribuan (hero & penutup). Null bila tidak ada paket. */
  minPerDay: number | null
  /** Paket Trial (bar melayang di HP). */
  trial: SgfPackage | null
  /** Total terjual gabungan produk Supergreen, dibulatkan ke bawah ke puluhan. */
  soldRounded: number
  faq: { id: string; q: string; a: string }[]
}

/**
 * Harga dari tabel produk yang sama dengan halaman produk shop (harga varian aktif
 * termurah, sama dengan kartu produk). Cache 60 detik + tag `lp-supergreen` yang
 * disegarkan saat produk diubah di Sambers atau FAQ disimpan.
 */
export const getSgfData = unstable_cache(
  async (): Promise<SgfData> => {
    const admin = getSupabaseAdmin()
    const [{ data: products }, { data: setting }] = await Promise.all([
      admin.from('products').select(CARD_PRODUCT_SELECT).ilike('name', '%supergreen%'),
      admin.from('site_settings').select('value').eq('key', FAQ_SETTING_KEY).maybeSingle(),
    ])
    const list = (products ?? []) as ProductWithCategory[]
    const bySlug = new Map(list.filter((p) => p.is_active).map((p) => [productSlug(p), p]))

    const pkgs: SgfPackage[] = []
    for (const def of packages) {
      const p = bySlug.get(def.slug)
      if (!p) continue
      const price = cardPrice(p).price
      if (!(price > 0)) continue
      pkgs.push({
        key: def.key,
        slug: def.slug,
        name: def.name,
        detail: def.detail,
        badge: def.badge,
        highlight: def.highlight,
        photo: def.photo,
        price,
        perDay: Math.round(price / (def.tablets / DAILY_TABLETS) / 100) * 100,
        points: pointsForAmount(price),
      })
    }

    const minExact = pkgs.length
      ? Math.min(...pkgs.map((p) => p.price / (packages.find((d) => d.key === p.key)!.tablets / DAILY_TABLETS)))
      : null
    const sold = list.reduce((sum, p) => sum + soldCount(p), 0)

    const answers = (setting?.value ?? {}) as Record<string, unknown>
    const faq = faqQuestions
      .map((f) => {
        const saved = answers[f.id]
        const a = typeof saved === 'string' ? saved.trim() : f.defaultAnswer
        return { id: f.id, q: f.q, a }
      })
      .filter((f) => f.a)

    return {
      packages: pkgs,
      minPerDay: minExact === null ? null : Math.round(minExact / 1000) * 1000,
      trial: pkgs.find((p) => p.key === 'trial') ?? null,
      soldRounded: Math.floor(sold / 10) * 10,
      faq,
    }
  },
  ['lp-supergreen-v2'],
  { revalidate: 60, tags: ['lp-supergreen'] }
)
