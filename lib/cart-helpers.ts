import { SupabaseClient } from '@supabase/supabase-js'

export async function getOrCreateCart(
  admin: SupabaseClient,
  userId: string
): Promise<{ id: string } | null> {
  let { data: cart } = await admin
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!cart) {
    const { data: newCart, error } = await admin
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single()
    if (error) return null
    cart = newCart
  }

  return cart
}

interface RawCartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  products: {
    id: string
    name: string
    price: number
    has_variants: boolean
    product_images: { image_url: string; is_primary: boolean }[]
  } | null
  product_variants: {
    id: string
    name: string
    price: number
    stock: number | null
    image_url: string | null
  } | null
}

export async function getFullCart(admin: SupabaseClient, cartId: string) {
  const { data: rawItems, error } = await admin
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
        product_images (
          image_url,
          is_primary
        )
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

  if (error) return null

  const items = (rawItems as unknown as RawCartItem[]).map((item) => {
    const product = item.products!
    const variant = item.product_variants ?? null

    // Build images array sorted: primary first
    const images = (product.product_images ?? [])
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((img) => img.image_url)

    const display_price = variant ? variant.price : product.price
    const display_image = variant?.image_url ?? images[0] ?? null
    const subtotal = display_price * item.quantity

    // Determine current stock
    const current_stock = variant ? (variant.stock ?? Infinity) : Infinity
    const is_out_of_stock = current_stock < item.quantity

    return {
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        has_variants: product.has_variants,
        images,
      },
      variant: variant
        ? {
            id: variant.id,
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
            image_url: variant.image_url,
          }
        : null,
      display_price,
      display_image,
      subtotal,
      is_out_of_stock,
    }
  })

  const item_count = items.length
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    id: cartId,
    items,
    item_count,
    subtotal,
  }
}
