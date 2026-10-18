import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductWithCategory } from '@/types/product'
import { slugify } from '@/lib/utils'

// Kolom produk untuk kartu produk (beranda & /katalog).
export const CARD_PRODUCT_SELECT =
  '*, categories(*), product_variants(id, name, price, stock, is_active, sort_order)'

/** Label tampilan kategori — slug URL tidak berubah (dipakai iklan & Merchant Center). */
const CATEGORY_LABELS: Record<string, string> = {
  fitsol: 'Fitsol',
  others: 'Lainnya',
}
export function categoryLabel(cat: { name: string; slug: string }): string {
  return CATEGORY_LABELS[cat.slug] ?? cat.name
}

/** Chip kecil di kartu produk. */
const CATEGORY_CHIPS: Record<string, string> = {
  natesh: 'Kewanitaan',
  kecantikan: 'Wajah',
  suplemen: 'Nutrisi',
  fitsol: 'Fitsol',
}
export function productChip(p: Pick<ProductWithCategory, 'name' | 'categories'>): string | null {
  if (/^paket\b/i.test(p.name.trim())) return 'Paket hemat'
  return p.categories ? CATEGORY_CHIPS[p.categories.slug] ?? null : null
}

/** EVC Points: Rp 1.000 = 1 poin (sama dengan /api/checkout). */
export function pointsForAmount(amount: number): number {
  return Math.floor(amount / 1000)
}

export function activeVariants(p: ProductWithCategory) {
  return (p.product_variants ?? []).filter((v) => v.is_active)
}

/** Harga yang ditampilkan = harga varian aktif termurah. */
export function cardPrice(p: ProductWithCategory): { price: number; from: boolean } {
  const vs = activeVariants(p)
  if (!p.has_variants || vs.length === 0) return { price: p.price, from: false }
  const prices = vs.map((v) => v.price)
  const min = Math.min(...prices)
  return { price: min, from: prices.some((x) => x !== min) }
}

/** Baris isi paket untuk produk satu harga, mis. "Paket 150 tablet". */
export function packDetail(p: ProductWithCategory): string | null {
  if (p.has_variants && activeVariants(p).length > 1) return null
  const m = p.name.match(/(\d+)\s*(tablet|tab|kapsul|sachet|pcs)\b/i)
  return m ? `Paket ${m[1]} ${m[2].toLowerCase() === 'tab' ? 'tablet' : m[2].toLowerCase()}` : null
}

/**
 * Varian yang bisa langsung dimasukkan keranjang dari kartu: produk tanpa varian
 * (variant_id null) atau tepat satu varian aktif. undefined = harus pilih varian
 * di halaman produk.
 */
export function quickAddVariant(p: ProductWithCategory): string | null | undefined {
  if (!p.has_variants) return null
  const vs = activeVariants(p)
  return vs.length === 1 ? vs[0].id : undefined
}

export function soldCount(p: ProductWithCategory): number {
  return p.total_sold ?? p.initial_sold_count ?? 0
}

export function productSlug(p: { name: string }): string {
  return slugify(p.name)
}

/**
 * Filter pencarian PostgREST: nama, kata kunci (search_keywords), atau nama
 * kategori. Karakter yang punya arti di sintaks `or=` dibuang.
 */
export function searchFilter(q: string, categoryIds: string[]): string | null {
  // Spasi → wildcard: "paket hemat" cocok dengan "Paket Hemat 60 hari".
  const term = q.replace(/[,()*%\\.:"']/g, ' ').trim().replace(/\s+/g, '*')
  if (!term) return null
  const parts = [`name.ilike.*${term}*`, `search_keywords.ilike.*${term}*`]
  if (categoryIds.length) parts.push(`category_id.in.(${categoryIds.join(',')})`)
  return parts.join(',')
}

/** Jumlah produk di "Paling sering dibeli ulang" (beranda). */
export const FEATURED_LIMIT = 6
/** Kunci site_settings: urutan manual dari Sambers › Tampilan Toko › Susun Produk Unggulan. */
export const FEATURED_SETTING_KEY = 'featured_product_ids'

export function parseFeaturedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, FEATURED_LIMIT) : []
}

/**
 * Semua produk aktif, diurutkan otomatis: jumlah pembeli yang membeli produk itu di
 * ≥2 pesanan web, lalu angka terjual. Butuh client admin (order_items/orders terkunci RLS).
 */
export async function getAutoRankedProducts(admin: SupabaseClient): Promise<ProductWithCategory[]> {
  const { data } = await admin.from('products').select(CARD_PRODUCT_SELECT).eq('is_active', true)
  const products = (data ?? []) as ProductWithCategory[]

  const { data: items } = await admin
    .from('order_items')
    .select('product_id, orders!inner(user_id, status)')
    .in('orders.status', ['paid', 'shipped', 'delivered'])
  const perProduct = new Map<string, Map<string, number>>()
  for (const it of (items ?? []) as unknown as { product_id: string; orders: { user_id: string } }[]) {
    const users = perProduct.get(it.product_id) ?? new Map<string, number>()
    users.set(it.orders.user_id, (users.get(it.orders.user_id) ?? 0) + 1)
    perProduct.set(it.product_id, users)
  }
  const repeatBuyers = (id: string) =>
    [...(perProduct.get(id)?.values() ?? [])].filter((n) => n > 1).length

  return products
    .map((p) => ({ p, r: repeatBuyers(p.id), s: soldCount(p) }))
    .sort((a, b) => b.r - a.r || b.s - a.s)
    .map((x) => x.p)
}

/**
 * Produk untuk "Paling sering dibeli ulang": urutan manual (ID produk) dulu; produk
 * nonaktif dilewati dan slot yang kosong diisi urutan otomatis.
 */
export async function getFeaturedProducts(
  admin: SupabaseClient,
  limit: number,
  manualIds: string[]
): Promise<ProductWithCategory[]> {
  const ranked = await getAutoRankedProducts(admin)
  const byId = new Map(ranked.map((p) => [p.id, p]))
  const manual = manualIds.map((id) => byId.get(id)).filter((p): p is ProductWithCategory => !!p)
  const picked = new Set(manual.map((p) => p.id))
  return [...manual, ...ranked.filter((p) => !picked.has(p.id))].slice(0, limit)
}
