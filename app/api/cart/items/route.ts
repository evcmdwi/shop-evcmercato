import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { product_id, variant_id, quantity = 1 } = body

  if (!product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }
  if (quantity < 1) {
    return NextResponse.json({ error: 'quantity must be at least 1' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Validate stock
  if (variant_id) {
    const { data: variant } = await admin
      .from('product_variants')
      .select('stock')
      .eq('id', variant_id)
      .single()
    if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    if (variant.stock !== null && variant.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }
  } else {
    const { data: product } = await admin
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single()
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    if (product.stock !== null && product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }
  }

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

  // Upsert cart item
  const upsertData = {
    cart_id: cart!.id,
    product_id,
    variant_id: variant_id ?? null,
    quantity,
  }

  // Check if item already exists
  const query = admin
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart!.id)
    .eq('product_id', product_id)

  if (variant_id) {
    query.eq('variant_id', variant_id)
  } else {
    query.is('variant_id', null)
  }

  const { data: existing } = await query.single()

  let data, error
  if (existing) {
    // Update quantity (add to existing)
    const newQty = existing.quantity + quantity;
    ({ data, error } = await admin
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id)
      .select()
      .single())
  } else {
    ({ data, error } = await admin
      .from('cart_items')
      .insert(upsertData)
      .select()
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update cart updated_at
  await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart!.id)

  return NextResponse.json({ data }, { status: 201 })
}
