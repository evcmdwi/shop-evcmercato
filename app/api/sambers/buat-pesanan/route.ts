import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isShippingMethod, resolveShippingRate } from '@/lib/shipping'
import { computeAdminOrderTotals, createOrderPaymentLink, normalizePhone } from '@/lib/admin-orders'

interface Body {
  admin_code?: string
  customer?: { user_id?: string | null; name?: string; phone?: string; email?: string }
  address?: {
    recipient_name?: string
    phone?: string
    full_address?: string
    district_id?: string
    district_name?: string
    regency_id?: string
    regency_name?: string
    province_id?: string
    province_name?: string
  }
  items?: { product_id?: string; variant_id?: string | null; quantity?: number }[]
  shipping_method?: string
  discount?: number
  delivery_note?: string
  send_link?: boolean
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

// POST — admin membuat pesanan untuk pembeli. Pesanan berstatus pending; poin, WA
// "pembayaran diterima" & komisi diproses cron setelah lunas (Xendit atau tandai lunas BCA).
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return bad('Unauthorized', auth.status)

  const body = (await req.json().catch(() => ({}))) as Body
  const admin = getSupabaseAdmin()

  // ── Validasi dasar ────────────────────────────────────────────────────
  const adminCode = String(body.admin_code ?? '').trim().toUpperCase()
  const { data: codeRow } = await admin.from('admin_codes').select('code').eq('code', adminCode).eq('is_active', true).maybeSingle()
  if (!codeRow) return bad('Pilih kode admin pembuat pesanan')

  const c = body.customer ?? {}
  const name = (c.name ?? '').trim()
  const phone = normalizePhone(c.phone ?? '')
  const email = (c.email ?? '').trim().toLowerCase()
  if (!name) return bad('Nama pembeli wajib diisi')
  if (!/^08\d{7,12}$/.test(phone)) return bad('No. WA tidak valid (contoh: 081234567890)')

  const a = body.address ?? {}
  const recipient = (a.recipient_name ?? '').trim() || name
  const recipientPhone = normalizePhone(a.phone ?? '') || phone
  const fullAddress = (a.full_address ?? '').trim()
  if (!fullAddress || !a.district_id || !a.regency_name || !a.province_name) {
    return bad('Alamat lengkap & kecamatan wajib diisi')
  }

  const method = body.shipping_method ?? 'reguler'
  if (!isShippingMethod(method)) return bad('Jenis pengiriman tidak valid')

  const discount = Number(body.discount ?? 0)
  if (!Number.isInteger(discount) || discount < 0) return bad('Diskon harus angka bulat ≥ 0')

  // Item digabung bila produk+varian sama.
  const merged = new Map<string, { product_id: string; variant_id: string | null; quantity: number }>()
  for (const it of body.items ?? []) {
    const qty = Number(it.quantity)
    if (!it.product_id || !Number.isInteger(qty) || qty < 1 || qty > 99) return bad('Jumlah produk tidak valid')
    const key = `${it.product_id}:${it.variant_id ?? ''}`
    const prev = merged.get(key)
    merged.set(key, { product_id: it.product_id, variant_id: it.variant_id ?? null, quantity: (prev?.quantity ?? 0) + qty })
  }
  const items = [...merged.values()]
  if (!items.length) return bad('Pilih minimal 1 paket/produk')

  // ── Harga & stok dari database ────────────────────────────────────────
  const { data: products } = await admin
    .from('products')
    .select('id, name, price, stock, is_active, has_variants, product_variants(id, name, price, stock, is_active)')
    .in('id', items.map((i) => i.product_id))
  const lines: { product_id: string; variant_id: string | null; product_name: string; variant_name: string | null; price: number; quantity: number; stock: number }[] = []
  for (const it of items) {
    const p = products?.find((x) => x.id === it.product_id)
    if (!p || !p.is_active) return bad('Ada produk yang sudah tidak aktif')
    const v = it.variant_id ? p.product_variants?.find((x) => x.id === it.variant_id) : null
    if (it.variant_id && (!v || v.is_active === false)) return bad(`Varian ${p.name} tidak tersedia`)
    if (p.has_variants && !v) return bad(`Pilih varian untuk ${p.name}`)
    const stock = v ? v.stock : p.stock
    if (stock < it.quantity) return bad(`Stok ${p.name}${v ? ` (${v.name})` : ''} tinggal ${stock}`, 409)
    lines.push({ ...it, product_name: p.name, variant_name: v?.name ?? null, price: v ? v.price : p.price, stock })
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  if (discount > subtotal) return bad('Diskon melebihi subtotal produk')

  const baseRate = await resolveShippingRate(admin, a.district_id, method)
  if (baseRate === null) return bad(`Pengiriman ${method === 'instan' ? 'Instan' : 'Sameday'} belum tersedia di kecamatan ini`)
  const { shippingDiscount, shippingCost, total } = computeAdminOrderTotals(subtotal, baseRate, discount)
  if (body.send_link && total < 1000) return bad('Total minimal Rp1.000 untuk link pembayaran — pilih Simpan Pesanan')

  // ── Pembeli: member yang dipilih, member dengan email sama, atau akun baru ──
  let userId: string | null = null
  if (c.user_id) {
    const { data: u } = await admin.from('users').select('id, phone').eq('id', c.user_id).maybeSingle()
    if (!u) return bad('Member tidak ditemukan')
    userId = u.id
    if (!u.phone) await admin.from('users').update({ phone }).eq('id', u.id)
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Email wajib diisi untuk pembeli baru (akun member dibuat otomatis)')
    const { data: existing } = await admin.from('users').select('id').ilike('email', email.replace(/[\\%_]/g, '\\$&')).limit(1).maybeSingle()
    if (existing) {
      userId = existing.id
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name, phone },
      })
      if (createErr || !created.user) {
        console.error('[buat-pesanan] create user:', createErr?.message)
        return bad('Gagal membuat akun member baru: ' + (createErr?.message ?? 'unknown'), 500)
      }
      userId = created.user.id
      // Trigger handle_new_user membuat baris users; pastikan nama & WA terisi.
      await admin.from('users').upsert({ id: userId, email, name, phone }, { onConflict: 'id' })
    }
  }

  // ── Alamat: simpan ke buku alamat member bila belum ada ────────────────
  const { data: sameAddr } = await admin
    .from('addresses')
    .select('id')
    .eq('user_id', userId)
    .eq('full_address', fullAddress)
    .eq('district_id', a.district_id)
    .limit(1)
    .maybeSingle()
  let addressId = sameAddr?.id ?? null
  if (!addressId) {
    const { data: newAddr } = await admin
      .from('addresses')
      .insert({
        user_id: userId,
        recipient_name: recipient,
        phone: recipientPhone,
        full_address: fullAddress,
        district_id: a.district_id,
        district: a.district_name ?? null,
        regency_id: a.regency_id ?? null,
        city: a.regency_name,
        province_id: a.province_id ?? null,
        province: a.province_name,
        is_default: false,
      })
      .select('id')
      .single()
    addressId = newAddr?.id ?? null
  }

  // ── Pesanan ───────────────────────────────────────────────────────────
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: userId,
      status: 'pending',
      order_type: 'purchase',
      subtotal,
      shipping_method: method,
      shipping_base_rate: baseRate,
      shipping_discount: shippingDiscount,
      shipping_cost: shippingCost,
      shipping_cost_discount: shippingDiscount,
      service_fee: 3000,
      service_fee_discount: 3000,
      admin_discount: discount,
      total_amount: total,
      total_price: total,
      points_earned: Math.floor((subtotal - discount) / 1000),
      admin_code: adminCode,
      shipping_address_id: addressId,
      shipping_recipient_name: recipient,
      shipping_phone: recipientPhone,
      shipping_full_address: fullAddress,
      shipping_city: a.regency_name,
      shipping_province: a.province_name,
      shipping_district_id: a.district_id,
      shipping_district_name: a.district_name ?? null,
      shipping_regency_id: a.regency_id ?? null,
      shipping_regency_name: a.regency_name,
      shipping_province_id: a.province_id ?? null,
      shipping_province_name: a.province_name,
      delivery_note: body.delivery_note?.trim() || null,
    })
    .select('id')
    .single()
  if (orderErr || !order) {
    console.error('[buat-pesanan] insert order:', orderErr?.message)
    return bad('Gagal membuat pesanan', 500)
  }

  const { error: itemsErr } = await admin.from('order_items').insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      variant_id: l.variant_id,
      product_name: l.product_name,
      variant_name: l.variant_name,
      price: l.price,
      quantity: l.quantity,
    }))
  )
  if (itemsErr) {
    console.error('[buat-pesanan] insert items:', itemsErr.message)
    await admin.from('orders').delete().eq('id', order.id)
    return bad('Gagal menyimpan item pesanan', 500)
  }

  // Kurangi stok (sama seperti checkout; dikembalikan trigger bila batal/kedaluwarsa).
  for (const l of lines) {
    if (l.variant_id) await admin.from('product_variants').update({ stock: l.stock - l.quantity }).eq('id', l.variant_id)
    else await admin.from('products').update({ stock: l.stock - l.quantity }).eq('id', l.product_id)
  }

  let payment_url: string | null = null
  let wa_sent: boolean | null = null
  let link_error: string | null = null
  if (body.send_link) {
    try {
      ;({ payment_url, wa_sent } = await createOrderPaymentLink(admin, order.id))
    } catch (e) {
      console.error('[buat-pesanan] payment link:', e)
      link_error = 'Pesanan tersimpan, tapi link pembayaran gagal dibuat — coba lagi dari detail pesanan'
    }
  }

  return NextResponse.json({ order_id: order.id, total, payment_url, wa_sent, link_error }, { status: 201 })
}
