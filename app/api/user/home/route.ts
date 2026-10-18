import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const PAID_STATUSES = ['paid', 'shipped', 'delivered']
const MAX_REORDER_ITEMS = 8

interface VariantRow { id: string; name: string; price: number; stock: number; is_active: boolean; image_url: string | null }
interface ProductRow {
  id: string; name: string; price: number; stock: number; is_active: boolean; has_variants: boolean
  image_url: string | null; images: string[] | null; product_variants: VariantRow[] | null
}

/** Data beranda untuk pelanggan login: saldo poin, hadiah berikutnya, produk untuk dipesan lagi. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const [{ data: profile }, { data: orders }, { data: rewards }] = await Promise.all([
    admin.from('users').select('name, total_points').eq('id', user.id).single(),
    admin
      .from('orders')
      .select('id, created_at, order_items(product_id, variant_id, quantity)')
      .eq('user_id', user.id)
      .in('status', PAID_STATUSES)
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('point_redemptions')
      .select('id, title, points_required, redeem_stock, redeemed_count')
      .eq('is_active', true)
      .or('active_until.is.null,active_until.gt.now()')
      .order('points_required', { ascending: true }),
  ])

  const totalPoints = profile?.total_points ?? 0
  const available = (rewards ?? []).filter((r) => r.redeem_stock - r.redeemed_count > 0)
  // Hadiah berikutnya = termurah yang belum terjangkau; kalau semua terjangkau, yang termahal.
  const nextReward =
    available.find((r) => r.points_required > totalPoints) ?? available[available.length - 1] ?? null

  // Produk dari pesanan lunas, terbaru dulu, unik per produk+varian.
  const seen = new Set<string>()
  const picks: { product_id: string; variant_id: string | null; quantity: number }[] = []
  for (const o of orders ?? []) {
    for (const it of (o.order_items ?? []) as { product_id: string | null; variant_id: string | null; quantity: number }[]) {
      if (!it.product_id) continue
      const key = `${it.product_id}:${it.variant_id ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      picks.push({ product_id: it.product_id, variant_id: it.variant_id, quantity: it.quantity })
    }
  }

  let products: unknown[] = []
  if (picks.length) {
    const { data: rows } = await admin
      .from('products')
      .select('id, name, price, stock, is_active, has_variants, image_url, images, product_variants(id, name, price, stock, is_active, image_url)')
      .in('id', [...new Set(picks.map((p) => p.product_id))])
    const byId = new Map(((rows ?? []) as ProductRow[]).map((p) => [p.id, p]))

    products = picks
      .map((pick) => {
        const p = byId.get(pick.product_id)
        if (!p || !p.is_active) return null
        const variant = pick.variant_id ? p.product_variants?.find((v) => v.id === pick.variant_id && v.is_active) : null
        if (p.has_variants && !variant) return null // varian lama sudah dihapus
        const stock = variant ? variant.stock : p.stock
        return {
          product_id: p.id,
          variant_id: variant?.id ?? null,
          name: p.name,
          variant_name: variant?.name ?? null,
          price: variant?.price ?? p.price,
          image: variant?.image_url || p.images?.[0] || p.image_url || null,
          in_stock: stock > 0,
          last_quantity: pick.quantity,
        }
      })
      .filter(Boolean)
      .slice(0, MAX_REORDER_ITEMS)
  }

  return NextResponse.json({
    name: profile?.name ?? null,
    total_points: totalPoints,
    next_reward: nextReward ? { id: nextReward.id, title: nextReward.title, points_required: nextReward.points_required } : null,
    last_order_id: orders?.[0]?.id ?? null,
    order_count: orders?.length ?? 0,
    products,
  })
}
