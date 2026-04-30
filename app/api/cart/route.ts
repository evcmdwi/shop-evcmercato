import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getOrCreateCart, getFullCart } from '@/lib/cart-helpers'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cartId = await getOrCreateCart(user.id)
    const cart = await getFullCart(cartId)

    return NextResponse.json({ data: cart })
  } catch (err) {
    console.error('GET /api/cart error:', err)
    return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 })
  }
}
