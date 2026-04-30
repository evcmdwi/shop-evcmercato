import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getOrCreateCart, getFullCart } from '@/lib/cart-helpers'

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
  if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // 1. Validate product exists + is_active
  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, is_active, has_variants, stock, price')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  if (!product.is_active) {
    return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
  }

  // 2. Validate variant if product has_variants
  let variantStock: number | null = null
  if (product.has_variants) {
    if (!variant_id) {
      return NextResponse.json({ error: 'variant_id is required for this product' }, { status: 400 })
    }
    const { data: variant, error: variantError } = await admin
      .from('product_variants')
      .select('id, stock, is_active')
      .eq('id', variant_id)
      .eq('product_id', product_id)
      .single()

    if (variantError || !variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }
    if (variant.is_active === false) {
      return NextResponse.json({ error: 'Variant is not available' }, { status: 400 })
    }
    variantStock = variant.stock
  }

  // 3. Get or create cart
  const cart = await getOrCreateCart(admin, user.id)
  if (!cart) return NextResponse.json({ error: 'Failed to get or create cart' }, { status: 500 })

  // 4. Check existing cart item (product_id + variant_id match)
  let existingQuery = admin
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', product_id)

  if (variant_id) {
    existingQuery = existingQuery.eq('variant_id', variant_id)
  } else {
    existingQuery = existingQuery.is('variant_id', null)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) {
    // Upsert: add to existing quantity
    const new_qty = existing.quantity + quantity

    // Re-validate stock against new total
    const stock = variantStock ?? product.stock
    if (stock !== null && new_qty > stock) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${stock}, requested total: ${new_qty}` },
        { status: 400 }
      )
    }

    const { error: updateError } = await admin
      .from('cart_items')
      .update({ quantity: new_qty })
      .eq('id', existing.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  } else {
    // Validate stock for new item
    const stock = variantStock ?? product.stock
    if (stock !== null && quantity > stock) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${stock}` },
        { status: 400 }
      )
    }

    const { error: insertError } = await admin
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id,
        variant_id: variant_id ?? null,
        quantity,
      })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Update cart updated_at
  await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id)

  // Return full cart
  const fullCart = await getFullCart(admin, cart.id)
  if (!fullCart) return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })

  return NextResponse.json({ data: fullCart }, { status: 201 })
}
