import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getFullCart } from '@/lib/cart-helpers'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { quantity } = body

  if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
    return NextResponse.json({ error: 'quantity must be a non-negative integer' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Verify ownership via cart
  const { data: item } = await admin
    .from('cart_items')
    .select('id, product_id, variant_id, cart_id, carts!inner(user_id)')
    .eq('id', id)
    .single()

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const cartData = item.carts as unknown as { user_id: string }
  if (cartData.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // quantity === 0 → DELETE item
  if (quantity === 0) {
    const { error: deleteError } = await admin.from('cart_items').delete().eq('id', id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', item.cart_id)

    const fullCart = await getFullCart(admin, item.cart_id)
    if (!fullCart) return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
    return NextResponse.json({ data: fullCart })
  }

  // quantity > 0 → validate stock, UPDATE
  if (item.variant_id) {
    const { data: variant } = await admin
      .from('product_variants')
      .select('stock')
      .eq('id', item.variant_id)
      .single()
    if (variant && variant.stock !== null && variant.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${variant.stock}` },
        { status: 400 }
      )
    }
  } else {
    const { data: product } = await admin
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()
    if (product && product.stock !== null && product.stock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.stock}` },
        { status: 400 }
      )
    }
  }

  const { error: updateError } = await admin
    .from('cart_items')
    .update({ quantity })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', item.cart_id)

  const fullCart = await getFullCart(admin, item.cart_id)
  if (!fullCart) return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })

  return NextResponse.json({ data: fullCart })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Verify ownership via cart
  const { data: item } = await admin
    .from('cart_items')
    .select('id, cart_id, carts!inner(user_id)')
    .eq('id', id)
    .single()

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const cartData = item.carts as unknown as { user_id: string }
  if (cartData.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin.from('cart_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', item.cart_id)

  return NextResponse.json({ data: null, message: 'Item dihapus dari keranjang' })
}
