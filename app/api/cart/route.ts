import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getOrCreateCart, getFullCart } from '@/lib/cart-helpers'

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  try {
    // Use the user-context client (auth cookies) for auth check and cart ops.
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fast path: count_only=true — returns just item count, no JOIN needed.
    // Used by navbar cart icon to avoid expensive full cart fetch on every page.
    const countOnly = req.nextUrl.searchParams.get('count_only') === 'true'
    if (countOnly) {
      const cartId = await getOrCreateCart(user.id, supabase)
      const { count, error } = await supabase
        .from('cart_items')
        .select('id', { count: 'exact', head: true })
        .eq('cart_id', cartId)
      if (error) throw error
      const elapsed = Date.now() - t0
      return NextResponse.json(
        { count: count ?? 0 },
        { headers: { 'x-cart-timing': `${elapsed}ms (count_only)` } }
      )
    }

    const cartId = await getOrCreateCart(user.id, supabase)
    const cart = await getFullCart(cartId, supabase)

    // Fetch user's special discount for checkout display
    const { getSupabaseAdmin } = await import('@/lib/supabase-admin')
    const admin = getSupabaseAdmin()
    const { data: userData } = await admin
      .from('users')
      .select('special_discount_pct')
      .eq('id', user.id)
      .single()

    const elapsed = Date.now() - t0
    return NextResponse.json(
      {
        data: {
          ...cart,
          special_discount_pct: userData?.special_discount_pct ?? null,
        }
      },
      { headers: { 'x-cart-timing': `${elapsed}ms (full)` } }
    )
  } catch (err) {
    console.error('GET /api/cart error:', err)
    return NextResponse.json(
      { error: 'Server error', detail: String(err) },
      { status: 500 }
    )
  }
}
