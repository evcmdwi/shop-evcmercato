import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { CARD_PRODUCT_SELECT, cardPrice, productSlug } from '@/lib/catalog'
import type { ProductWithCategory } from '@/types/product'
import {
  CONTENT_SETTING_KEY,
  MAX_SCREENSHOTS,
  products as productDefs,
  statDefaults,
  type StatKey,
} from '@/content/lp/evc-resmi'

export interface EvcResmiProduct {
  id: string
  slug: string
  label: string
  image: string | null
  price: number
  /** "Mulai" — produk multi-varian dengan harga berbeda. */
  from: boolean
  popular: boolean
}

export interface EvcResmiContent {
  stats: Record<StatKey, string>
  screenshots: string[]
}

export interface EvcResmiData extends EvcResmiContent {
  products: EvcResmiProduct[]
}

/** Isi site_settings → angka (kosong = bawaan) + screenshot (maks 4, URL valid saja). */
export function parseEvcResmiContent(value: unknown): EvcResmiContent {
  const v = (value ?? {}) as { stats?: Record<string, unknown>; screenshots?: unknown }
  const stats = { ...statDefaults }
  for (const k of Object.keys(statDefaults) as StatKey[]) {
    const s = v.stats?.[k]
    if (typeof s === 'string' && s.trim()) stats[k] = s.trim()
  }
  const screenshots = Array.isArray(v.screenshots)
    ? v.screenshots.filter((u): u is string => typeof u === 'string' && u.startsWith('https://')).slice(0, MAX_SCREENSHOTS)
    : []
  return { stats, screenshots }
}

/**
 * Produk berdasarkan ID tetap (urutan dari content/lp/evc-resmi.ts) dengan harga yang
 * sama dengan kartu produk shop (varian aktif termurah). Produk nonaktif / tanpa harga
 * dilewati. Cache 60 detik + tag `lp-evc-resmi` (disegarkan saat produk atau angka
 * diubah di Sambers).
 */
export const getEvcResmiData = unstable_cache(
  async (): Promise<EvcResmiData> => {
    const admin = getSupabaseAdmin()
    const [{ data: rows }, { data: setting }] = await Promise.all([
      admin.from('products').select(CARD_PRODUCT_SELECT).in('id', productDefs.map((p) => p.id)),
      admin.from('site_settings').select('value').eq('key', CONTENT_SETTING_KEY).maybeSingle(),
    ])
    const byId = new Map(((rows ?? []) as ProductWithCategory[]).filter((p) => p.is_active).map((p) => [p.id, p]))

    const list: EvcResmiProduct[] = []
    for (const def of productDefs) {
      const p = byId.get(def.id)
      if (!p) continue
      const { price, from } = cardPrice(p)
      if (!(price > 0)) continue
      list.push({
        id: p.id,
        slug: productSlug(p),
        label: def.label,
        image: p.image_url ?? null,
        price,
        from,
        popular: !!def.popular,
      })
    }

    return { products: list, ...parseEvcResmiContent(setting?.value) }
  },
  ['lp-evc-resmi-v2'],
  { revalidate: 60, tags: ['lp-evc-resmi'] }
)
