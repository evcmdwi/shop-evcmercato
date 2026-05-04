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
    .select(`id, status, courier_type, resi_barcode_url, tracking_number, delivery_note, resi_generated_at,
      shipping_recipient_name, shipping_phone, shipping_full_address,
      shipping_city, shipping_province, shipping_postal_code,
      shipping_district_name, shipping_regency_name, shipping_province_name, created_at`)
    .eq('id', id)
    .single()

  if (!order || !order.resi_generated_at) {
    return new NextResponse('Resi belum digenerate', { status: 404 })
  }

  const isJnt = order.courier_type === 'jnt'
  const isGrab = order.courier_type === 'grab'
  const resiNumber = (order.tracking_number || '') as string
  const orderShortId = id.slice(0, 8).toUpperCase()
  const resiDate = new Date(order.resi_generated_at).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const addressParts = [
    order.shipping_district_name,
    order.shipping_regency_name || order.shipping_city,
    order.shipping_province_name || order.shipping_province,
    order.shipping_postal_code,
  ].filter(Boolean).join(', ')

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
      box-sizing: border-box;
    }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
      height: 1.6cm; margin-bottom: 0.15cm;
      border-bottom: 1px solid #ccc; padding-bottom: 0.1cm;
    }
    .header-left { display: flex; flex-direction: row; align-items: center; gap: 0.15cm; }
    .header-left img { height: 1.2cm; width: auto; }
    .header-left span { font-size: 0.55cm; color: #333; font-weight: bold; }
    .header-right { display: flex; flex-direction: column; align-items: flex-end; }
    .header-right img { height: 1.3cm; width: auto; }
    .courier-badge { font-size: 0.35cm; font-weight: bold; text-align: center; margin-bottom: 0.1cm; letter-spacing: 0.05cm; }
    .barcode-section {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      flex-shrink: 0;
      max-height: 2.1cm; overflow: hidden;
      border-bottom: 1px solid #ccc; margin-bottom: 0.15cm;
      padding: 0.05cm 0;
    }
    .barcode-section img { max-height: 2.0cm; max-width: 8.5cm; object-fit: contain; width: auto; }
    #barcode-svg { max-width: 8cm; max-height: 2.0cm; display: block; margin: 0 auto; }
    .resi-number-text { font-size: 0.32cm; font-family: monospace; font-weight: bold; text-align: center; letter-spacing: 0.05cm; margin-top: 0.1cm; }
    .grab-logo { height: 1.6cm; width: auto; }
    .address-section { display: flex; flex: 1; min-height: 0; overflow: hidden; gap: 0.15cm; margin-bottom: 0.1cm; }
    .penerima { flex: 7; border-right: 1px solid #ccc; padding-right: 0.15cm; }
    .pengirim { flex: 3; }
    .addr-heading { font-size: 0.32cm; font-weight: bold; text-transform: uppercase; margin-bottom: 0.1cm; }
    .addr-name { font-size: 0.46cm; font-weight: bold; line-height: 1.2; }
    .addr-phone { font-size: 0.35cm; margin-bottom: 0.06cm; }
    .addr-detail { font-size: 0.28cm; line-height: 1.4; color: #333; }
    .delivery-note {
      flex-shrink: 0;
      background: #FEF3C7; border-left: 4px solid #F59E0B;
      padding: 0.15cm; margin-bottom: 0.1cm;
    }
    .delivery-note-heading { font-size: 0.35cm; font-weight: bold; margin-bottom: 0.08cm; }
    .delivery-note-body { font-size: 0.42cm; font-weight: bold; color: #7f1d1d; }
    .footer {
      display: flex; justify-content: space-between;
      flex-shrink: 0;
      border-top: 1px solid #ccc; padding-top: 0.1cm;
      margin-top: auto;
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
      </div>` : ''}
    </div>

    <div class="barcode-section">
      ${isGrab ? '<div class="courier-badge" style="color:#00B14F">INSTAN / SAMEDAY</div>' : ''}
      ${isJnt ? `
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/barcodes/JsBarcode.code128.min.js"></script>
        <svg id="barcode-svg"></svg>
        <div class="resi-number-text">${resiNumber || 'SP0000000000000'}</div>
        <script>
          try {
            JsBarcode("#barcode-svg", "${resiNumber || 'SP0000000000000'}", {
              format: "CODE128",
              width: 2,
              height: 40,
              displayValue: false,
              margin: 0,
            });
          } catch(e) {
            document.getElementById("barcode-svg").style.display = "none";
          }
        </script>
      ` : ''}
      ${isGrab ? `<img src="/logo-grab-express.jpg" alt="Grab Express" class="grab-logo" />` : ''}
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
