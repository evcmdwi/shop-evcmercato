import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getOrCreateCart } from '@/lib/cart-helpers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // 1. Fetch order with items — verify it belongs to the current user
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, user_id, status, order_items(id, product_id, variant_id, quantity)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const items = (order.order_items ?? []) as Array<{
      id: string
      product_id: string
      variant_id: string | null
      quantity: number
    }>

    if (items.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 })
    }

    // 2. Get or create active cart
    const cartId = await getOrCreateCart(user.id, supabase)

    // 3. Add each item to cart (upsert: accumulate quantity if already exists)
    for (const item of items) {
      // Check if product is still active
      const { data: product } = await admin
        .from('products')
        .select('id, is_active, has_variants, stock')
        .eq('id', item.product_id)
        .single()

      if (!product || !product.is_active) continue // skip unavailable products

      // Check variant still active if applicable
      if (product.has_variants && item.variant_id) {
        const { data: variant } = await admin
          .from('product_variants')
          .select('id, is_active, stock')
          .eq('id', item.variant_id)
          .single()

        if (!variant || variant.is_active === false) continue
      }

      // Upsert into cart_items
      let existingQuery = admin
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', item.product_id)

      if (item.variant_id) {
        existingQuery = existingQuery.eq('variant_id', item.variant_id)
      } else {
        existingQuery = existingQuery.is('variant_id', null)
      }

      const { data: existing } = await existingQuery.maybeSingle()

      if (existing) {
        await admin
          .from('cart_items')
          .update({ quantity: existing.quantity + item.quantity })
          .eq('id', existing.id)
      } else {
        await admin
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: item.product_id,
            variant_id: item.variant_id ?? null,
            quantity: item.quantity,
          })
      }
    }

    // 4. Update cart timestamp
    await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/cart/reorder error:', err)
    return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 })
  }
}
