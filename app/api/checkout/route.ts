import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createInvoice } from '@/lib/xendit'
import { TERMS_VERSION } from '@/lib/constants/terms'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const {
      address_id,
      delivery_note,
      shipping_district_id,
      shipping_district_name,
      shipping_regency_id,
      shipping_regency_name,
      shipping_province_id,
      shipping_province_name,
      terms_accepted,
    } = await req.json()
    if (!terms_accepted) {
      return NextResponse.json(
        { error: 'Centang persetujuan Syarat & Ketentuan untuk melanjutkan pembayaran' },
        { status: 400 }
      )
    }
    if (!address_id) {
      return NextResponse.json({ error: 'Alamat pengiriman wajib dipilih' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // 3. Validate address belongs to user
    const { data: address, error: addrError } = await admin
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .single()

    if (addrError || !address) {
      return NextResponse.json({ error: 'Alamat tidak valid' }, { status: 400 })
    }

    // 4. Get cart items
    const { data: cart } = await admin
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!cart) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })
    }

    const { data: cartItems } = await admin
      .from('cart_items')
      .select(`
        id, product_id, variant_id, quantity,
        products(id, name, price, has_variants, stock),
        product_variants(id, name, price, stock)
      `)
      .eq('cart_id', cart.id)

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })
    }

    // 5. Validate stock
    // Note: Supabase JS tidak support SELECT FOR UPDATE langsung
    // Gunakan manual check + rely on DB constraints untuk anti-overselling
    const stockErrors: string[] = []
    for (const item of cartItems) {
      const product = item.products as unknown as { id: string; name: string; price: number; has_variants: boolean; stock: number } | null
      const variant = item.product_variants as unknown as { id: string; name: string; price: number; stock: number } | null
      const availableStock = variant?.stock ?? product?.stock ?? 0
      if (availableStock < item.quantity) {
        const name = product?.name ?? 'Produk'
        const variantName = variant?.name ? ` (${variant.name})` : ''
        stockErrors.push(`${name}${variantName}: stok tersedia ${availableStock}, dibutuhkan ${item.quantity}`)
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json({
        error: 'Stok tidak cukup untuk beberapa item',
        details: stockErrors
      }, { status: 409 })
    }

    // 6. Calculate amounts
    const subtotal = cartItems.reduce((sum, item) => {
      const variant = item.product_variants as unknown as { price: number } | null
      const product = item.products as unknown as { price: number } | null
      const price = variant?.price ?? product?.price ?? 0
      return sum + (price * item.quantity)
    }, 0)

    const shipping_cost = 10000
    const service_fee = 3000
    const shipping_cost_discount = subtotal >= 50000 ? 10000 : 0
    const service_fee_discount = 3000 // always-on Phase 1
    const total_amount = subtotal + (shipping_cost - shipping_cost_discount) + (service_fee - service_fee_discount)

    // 7. Get user data for snapshot
    const { data: userData } = await admin
      .from('users')
      .select('name, email, phone')
      .eq('id', user.id)
      .single()

    // 8. INSERT order
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_price: total_amount,    // backward compat — mirrors total_amount (redundant col, to be dropped in Sub-PR G)
        subtotal,
        shipping_cost,
        shipping_cost_discount,
        service_fee,
        service_fee_discount,
        total_amount,
        shipping_address_id: address_id,
        shipping_recipient_name: address.recipient_name,
        shipping_phone: address.phone,
        shipping_full_address: address.full_address,
        shipping_city: address.city,
        shipping_province: address.province,
        shipping_postal_code: address.postal_code,
        shipping_method: 'reguler',
        points_earned: Math.floor(subtotal / 1000),
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION,
        delivery_note: delivery_note?.trim() || null,
        shipping_district_id: shipping_district_id || null,
        shipping_district_name: shipping_district_name || null,
        shipping_regency_id: shipping_regency_id || null,
        shipping_regency_name: shipping_regency_name || null,
        shipping_province_id: shipping_province_id || null,
        shipping_province_name: shipping_province_name || null,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Insert order error:', orderError)
      return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
    }

    // 9. INSERT order_items (snapshot)
    const orderItemsData = cartItems.map(item => {
      const product = item.products as unknown as { id: string; name: string; price: number } | null
      const variant = item.product_variants as unknown as { id: string; name: string; price: number } | null
      return {
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: product?.name ?? 'Produk',
        variant_name: variant?.name ?? null,
        price: variant?.price ?? product?.price ?? 0,
        quantity: item.quantity,
      }
    })

    const { error: itemsError } = await admin
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('Insert order_items error:', itemsError)
      // Rollback: hapus order yang baru dibuat
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Gagal menyimpan item pesanan' }, { status: 500 })
    }

    // 10. Decrease stock
    for (const item of cartItems) {
      if (item.variant_id) {
        const variant = item.product_variants as unknown as { stock: number } | null
        await admin
          .from('product_variants')
          .update({ stock: (variant?.stock ?? 0) - item.quantity })
          .eq('id', item.variant_id)
      } else {
        const product = item.products as unknown as { stock: number } | null
        await admin
          .from('products')
          .update({ stock: (product?.stock ?? 0) - item.quantity })
          .eq('id', item.product_id)
      }
    }

    // 11. Create Xendit Invoice (stub jika no key)
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shop.evcmercato.com'
    let xenditInvoiceId: string | null = null
    let xenditInvoiceUrl = `${APP_URL}/orders/${order.id}/sukses?mock=1`

    try {
      const invoice = await createInvoice({
        external_id: order.id,
        amount: total_amount,
        payer_email: user.email || '',
        description: `Order #${order.id.slice(0, 8).toUpperCase()} - EVC Mercato`,
        items: orderItemsData.map(item => ({
          name: item.product_name + (item.variant_name ? ` (${item.variant_name})` : ''),
          quantity: item.quantity,
          price: item.price,
          category: 'Produk Kesehatan Wanita',
        })),
        success_redirect_url: `${APP_URL}/orders/${order.id}/sukses`,
        failure_redirect_url: `${APP_URL}/orders/${order.id}/gagal`,
        customer_name: userData?.name || 'Customer',
        customer_phone: userData?.phone || address.phone,
      })
      xenditInvoiceId = invoice.id
      xenditInvoiceUrl = invoice.invoice_url
    } catch (xenditErr) {
      console.error('Xendit error (non-fatal in stub mode):', xenditErr)
      // Tetap lanjut dengan stub URL
    }

    // 12. Update order dengan xendit info
    await admin
      .from('orders')
      .update({ xendit_invoice_id: xenditInvoiceId, xendit_invoice_url: xenditInvoiceUrl })
      .eq('id', order.id)

    // 13. Clear cart
    await admin.from('cart_items').delete().eq('cart_id', cart.id)

    return NextResponse.json({
      data: { order_id: order.id, xendit_invoice_url: xenditInvoiceUrl },
      message: 'Pesanan berhasil dibuat'
    })

  } catch (err) {
    console.error('[/api/checkout] Unhandled error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
