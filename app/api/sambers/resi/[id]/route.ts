import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { SENDER_INFO } from '@/lib/constants/sender-info'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params

  // Admin auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdmin = user && adminEmails.includes(user.email?.toLowerCase() ?? '')
  if (!isAdmin) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { data: order } = await admin
    .from('orders')
    .select(`id, status, courier_type, resi_barcode_url, delivery_note, resi_generated_at,
      shipping_recipient_name, shipping_phone, shipping_full_address,
      shipping_city, shipping_province, shipping_postal_code, created_at`)
    .eq('id', id)
    .single()

  if (!order || !order.resi_generated_at) {
    return new NextResponse('Resi belum digenerate', { status: 404 })
  }

  const isJnt = order.courier_type === 'jnt'
  const isGrab = order.courier_type === 'grab'
  const orderShortId = id.slice(0, 8).toUpperCase()
  const resiDate = new Date(order.resi_generated_at).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const addressParts = [order.shipping_city, order.shipping_province, order.shipping_postal_code]
    .filter(Boolean).join(', ')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Resi #${orderShortId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: system-ui, sans-serif;
    }
    @media print { body { background: white; } }
    .resi {
      width: 10cm; height: 10cm;
      border: 2px solid black;
      background: white;
      display: flex; flex-direction: column;
      padding: 0.2cm; overflow: hidden;
    }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      height: 1.2cm; margin-bottom: 0.15cm;
      border-bottom: 1px solid #ccc; padding-bottom: 0.1cm;
    }
    .header-left { display: flex; flex-direction: column; }
    .header-left img { height: 0.7cm; width: auto; }
    .header-left span { font-size: 0.22cm; color: #666; margin-top: 0.05cm; }
    .header-right { display: flex; flex-direction: column; align-items: flex-end; }
    .header-right img { height: 0.7cm; width: auto; }
    .badge { font-size: 0.22cm; font-weight: bold; margin-top: 0.05cm; }
    .barcode-section {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 2.8cm; border-bottom: 1px solid #ccc; margin-bottom: 0.15cm;
    }
    .barcode-section img { max-height: 2.2cm; max-width: 8cm; object-fit: contain; }
    .grab-logo { height: 1.2cm; width: auto; }
    .grab-text { font-size: 0.55cm; font-weight: bold; color: #00B14F; margin-top: 0.1cm; }
    .address-section { display: flex; flex: 1; gap: 0.15cm; margin-bottom: 0.15cm; }
    .penerima { flex: 6; border-right: 1px solid #ccc; padding-right: 0.15cm; }
    .pengirim { flex: 4; }
    .addr-heading { font-size: 0.27cm; font-weight: bold; text-transform: uppercase; margin-bottom: 0.1cm; }
    .addr-name { font-size: 0.36cm; font-weight: bold; line-height: 1.2; }
    .addr-phone { font-size: 0.27cm; margin-bottom: 0.05cm; }
    .addr-detail { font-size: 0.25cm; line-height: 1.3; color: #333; }
    .delivery-note {
      background: #FEF3C7; border-left: 4px solid #F59E0B;
      padding: 0.15cm; margin-bottom: 0.15cm;
    }
    .delivery-note-heading { font-size: 0.27cm; font-weight: bold; margin-bottom: 0.05cm; }
    .delivery-note-body { font-size: 0.3cm; font-weight: bold; color: #7f1d1d; }
    .footer {
      display: flex; justify-content: space-between;
      border-top: 1px solid #ccc; padding-top: 0.1cm;
    }
    .footer-left { font-size: 0.27cm; font-weight: bold; }
    .footer-right { font-size: 0.27cm; }
  </style>
</head>
<body>
  <div class="resi">
    <div class="header">
      <div class="header-left">
        <img src="/logo-evcmercato.jpg" alt="EVC Mercato" />
        <span>${SENDER_INFO.website}</span>
      </div>
      ${isJnt ? `
      <div class="header-right">
        <img src="/logo-jnt.jpg" alt="JNT" />
        <span class="badge">REGULER</span>
      </div>` : ''}
    </div>

    <div class="barcode-section">
      ${isJnt && order.resi_barcode_url ? `<img src="${order.resi_barcode_url}" alt="Barcode JNT" />` : ''}
      ${isGrab ? `
        <img src="/logo-grab-express.jpg" alt="Grab Express" class="grab-logo" />
        <div class="grab-text">INSTAN / SAMEDAY</div>
      ` : ''}
    </div>

    <div class="address-section">
      <div class="penerima">
        <div class="addr-heading">Penerima</div>
        <div class="addr-name">${order.shipping_recipient_name ?? ''}</div>
        <div class="addr-phone">${order.shipping_phone ?? ''}</div>
        <div class="addr-detail">
          ${order.shipping_full_address ?? ''}<br/>
          ${addressParts}
        </div>
      </div>
      <div class="pengirim">
        <div class="addr-heading">Pengirim</div>
        <div class="addr-name">${SENDER_INFO.name}</div>
        <div class="addr-phone">${SENDER_INFO.phone}</div>
      </div>
    </div>

    ${order.delivery_note ? `
    <div class="delivery-note">
      <div class="delivery-note-heading">⚠️ PESAN UNTUK KURIR:</div>
      <div class="delivery-note-body">${order.delivery_note}</div>
    </div>` : ''}

    <div class="footer">
      <div class="footer-left">No. Pesanan: #${orderShortId}</div>
      <div class="footer-right">Tgl: ${resiDate}</div>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
