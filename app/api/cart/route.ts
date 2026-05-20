import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getOrCreateCart, getFullCart } from '@/lib/cart-helpers'

export async function GET(req: NextRequest) {
  try {
    // Use the user-context client (auth cookies) for auth check and cart ops.
    // Passing this client to getOrCreateCart / getFullCart means cart queries
    // run under the user's RLS context — no dependency on SUPABASE_SERVICE_ROLE_KEY
    // for user-owned cart reads/creates.
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    return NextResponse.json({
      data: {
        ...cart,
        special_discount_pct: userData?.special_discount_pct ?? null,
      }
    })
  } catch (err) {
    console.error('GET /api/cart error:', err)
    return NextResponse.json(
      { error: 'Server error', detail: String(err) },
      { status: 500 }
    )
  }
}
