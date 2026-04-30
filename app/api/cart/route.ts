import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getOrCreateCart, getFullCart } from '@/lib/cart-helpers'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const cart = await getOrCreateCart(admin, user.id)
  if (!cart) return NextResponse.json({ error: 'Failed to get or create cart' }, { status: 500 })

  const fullCart = await getFullCart(admin, cart.id)
  if (!fullCart) return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })

  return NextResponse.json({ data: fullCart })
}
