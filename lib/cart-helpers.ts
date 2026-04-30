import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function getOrCreateCart(userId: string): Promise<string> {
  const supabase = getSupabaseAdmin()

  // 1. Try select existing cart
  const { data: existing, error: selectError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = not found — other errors are real errors
    console.error('getOrCreateCart select error:', selectError)
    throw selectError
  }

  if (existing) return existing.id

  // 2. Create new cart
  const { data: newCart, error: insertError } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single()

  if (insertError) {
    console.error('getOrCreateCart insert error:', insertError)
    throw insertError
  }

  return newCart.id
}

export async function getFullCart(cartId: string) {
  const supabase = getSupabaseAdmin()

  const { data: items, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      product_id,
      variant_id,
      quantity,
      products (
        id,
        name,
        price,
        has_variants,
        images
      ),
      product_variants (
        id,
        name,
        price,
        stock,
        image_url
      )
    `)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getFullCart error:', error)
    throw error
  }

  const computedItems = (items ?? []).map((item) => {
    const product = item.products as any
    const variant = item.product_variants as any
    const display_price = variant?.price ?? product?.price ?? 0
    const display_image = variant?.image_url ?? product?.images?.[0] ?? null
    const current_stock = variant?.stock ?? product?.stock ?? null

    return {
      ...item,
      product,
      variant,
      display_price,
      display_image,
      subtotal: display_price * item.quantity,
      is_out_of_stock: current_stock !== null && current_stock < item.quantity,
    }
  })

  return {
    id: cartId,
    items: computedItems,
    item_count: computedItems.length,
    subtotal: computedItems.reduce((sum, i) => sum + i.subtotal, 0),
  }
}
