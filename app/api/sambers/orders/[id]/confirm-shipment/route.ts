import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emitOrderShipped } from '@/lib/events/order-events'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { id } = await params
    const { resi_number, tracking_url } = await req.json()

    if (!resi_number || resi_number.trim().length < 8) {
      return NextResponse.json({ error: 'No. resi/order ID minimal 8 karakter' }, { status: 400 })
    }

    // Get current order (for cleanup + notification)
    const { data: order } = await admin
      .from('orders')
      .select('courier_type, resi_barcode_url, user_id, shipping_phone, shipping_recipient_name')
      .eq('id', id)
      .single()

    // Cleanup barcode from storage (if JNT)
    if (order?.resi_barcode_url) {
      try {
        // Extract path from signed URL or direct URL
        const url = new URL(order.resi_barcode_url)
        const pathMatch = url.pathname.match(/\/resi-barcodes\/(.+)/)
        if (pathMatch) {
          await admin.storage.from('resi-barcodes').remove([pathMatch[1]])
        }
      } catch (e) {
        console.warn('[confirm-shipment] cleanup barcode failed:', e)
      }
    }

    // Update order status to shipped
    const { error } = await admin
      .from('orders')
      .update({
        tracking_number: resi_number.trim(),
        tracking_url: tracking_url?.trim() || null,
        shipping_courier: order?.courier_type === 'grab' ? 'Grab Express' : 'JNT',
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        resi_barcode_url: null, // cleanup reference
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Emit shipped event for WA notification
    const { data: userData } = await admin
      .from('users')
      .select('name, phone')
      .eq('id', order?.user_id)
      .single()

    emitOrderShipped({
      orderId: id,
      orderShortId: id.slice(0, 8).toUpperCase(),
      customerName: (userData as any)?.name || order?.shipping_recipient_name || 'Customer',
      payerPhone: (userData as any)?.phone || order?.shipping_phone || '',
      status: 'shipped',
      courier: order?.courier_type === 'grab' ? 'Grab Express' : 'JNT',
      trackingNumber: resi_number.trim(),
      trackingUrl: tracking_url?.trim() || undefined,
      shippingMethod: order?.shipping_method || undefined,
    }).catch(console.error)

    return NextResponse.json({ data: { status: 'shipped', tracking_number: resi_number.trim() } })
  } catch (err) {
    console.error('[confirm-shipment] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
