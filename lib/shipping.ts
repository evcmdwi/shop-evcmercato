import type { SupabaseClient } from '@supabase/supabase-js'

// Tarif dasar Reguler (JNT) — flat, tidak tergantung kecamatan.
export const REGULER_RATE = 10000

export const SHIPPING_METHODS = ['reguler', 'instan', 'sameday'] as const
export type ShippingMethod = (typeof SHIPPING_METHODS)[number]

export function isShippingMethod(v: unknown): v is ShippingMethod {
  return typeof v === 'string' && (SHIPPING_METHODS as readonly string[]).includes(v)
}

/**
 * Tarif dasar (sebelum diskon ongkir) untuk metode + kecamatan, dari tabel
 * shipping_rates. null = metode tidak tersedia di kecamatan itu.
 * Satu sumber untuk tampilan checkout (/api/shipping-rates) dan pembuatan order
 * (/api/checkout) — tarif dari browser tidak pernah dipercaya.
 */
export async function getShippingRates(
  admin: SupabaseClient,
  districtId: string | null
): Promise<{ instan: number | null; sameday: number | null; hasRate: boolean }> {
  if (!districtId) return { instan: null, sameday: null, hasRate: false }
  const { data: rate } = await admin
    .from('shipping_rates')
    .select('instan_rate, sameday_rate')
    .eq('district_id', districtId)
    .eq('is_active', true)
    .maybeSingle()
  return {
    instan: rate && rate.instan_rate > 0 ? rate.instan_rate : null,
    sameday: rate && rate.sameday_rate > 0 ? rate.sameday_rate : null,
    hasRate: !!rate,
  }
}

export async function resolveShippingRate(
  admin: SupabaseClient,
  districtId: string | null,
  method: ShippingMethod
): Promise<number | null> {
  if (method === 'reguler') return REGULER_RATE
  const rates = await getShippingRates(admin, districtId)
  return rates[method]
}
