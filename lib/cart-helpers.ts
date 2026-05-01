import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Get or create a cart for a user.
 *
 * Accepts an optional `client` parameter (user-context Supabase client).
 * When provided, cart operations use the user's auth context so they satisfy
 * RLS policies (carts_own: auth.uid() = user_id).
 * Falls back to the service-role admin client when no client is provided
 * (e.g. called from server-side scripts / background jobs).
 *
 * Root cause of previous 500: SUPABASE_SERVICE_ROLE_KEY not set in CI
 * caused admin client creation to throw, propagating as an RLS error when
 * a partially-initialised client was used. Passing the user's auth client
 * directly eliminates this dependency for user-facing routes.
 */
export async function getOrCreateCart(
  userId: string,
  client?: SupabaseClient
): Promise<string> {
  const supabase = client ?? getSupabaseAdmin()

  // 1. Try to find existing cart
  const { data: existing, error: selectError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — any other code is a real error
    console.error('getOrCreateCart select error:', selectError)
    throw selectError
  }

  if (existing) return existing.id

  // 2. Create a new cart
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

/**
 * Fetch a full cart (items + product/variant details) for a given cart ID.
 *
 * Uses the provided client (user auth context) so the query satisfies the
 * cart_items RLS policy (cart_items_own). Falls back to admin client.
 */
export async function getFullCart(cartId: string, client?: SupabaseClient) {
  const supabase = client ?? getSupabaseAdmin()

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
