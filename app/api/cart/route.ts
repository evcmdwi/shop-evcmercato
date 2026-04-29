import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Get or create cart
  let { data: cart } = await admin
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cart) {
    const { data: newCart, error: createError } = await admin
      .from('carts')
      .insert({ user_id: user.id })
      .select('id')
      .single()
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })
    cart = newCart
  }

  const { data: items, error } = await admin
    .from('cart_items')
    .select(`
      id,
      quantity,
      created_at,
      product_id,
      variant_id,
      products (
        id,
        name,
        slug,
        price,
        product_images (
          image_url,
          is_primary
        )
      ),
      product_variants (
        id,
        name,
        price,
        stock
      )
    `)
    .eq('cart_id', cart!.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { cart_id: cart!.id, items: items ?? [] } })
}
