import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Get user's cart
  const { data: cart } = await admin
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!cart) {
    // No cart = already empty
    return NextResponse.json({ data: null, message: 'Keranjang dikosongkan' })
  }

  // Delete all items
  const { error } = await admin.from('cart_items').delete().eq('cart_id', cart.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id)

  return NextResponse.json({ data: null, message: 'Keranjang dikosongkan' })
}
