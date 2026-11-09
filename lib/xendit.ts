// Xendit Payment Sessions (pengganti legacy Invoice /v2/invoices — legacy API kena
// maintenance fee bulanan sejak Okt 2026). Brief: ~/Downloads/BRIEF_XENDIT_MIGRASI.md.
// JANGAN menambah pemanggilan endpoint legacy (/v2/invoices, /invoices/*/expire!, dll).
//
// Catatan:
// - reference_id = nilai external_id lama (UUID order / PAYLINK-…), dibaca balik oleh webhook.
// - Tanpa objek `customer` (opsional untuk PAY + PAYMENT_LINK): Xendit tidak mengirim
//   email/notifikasi apa pun ke pembeli — notifikasi tetap via WA/Resend kita sendiri.
// - Tanpa `items`: total kita memuat ongkir/diskon sehingga tak selalu = jumlah item.
// - Kolom DB lama dipakai ulang: xendit_invoice_id ← ps-…, xendit_invoice_url ← payment_link_url.

const API = 'https://api.xendit.co'
/** Durasi link bayar — sama dengan invoice_duration lama (86400 dtk). */
export const PAYMENT_LINK_TTL_MS = 24 * 60 * 60 * 1000

interface CreateSessionParams {
  reference_id: string
  amount: number
  description: string
  success_return_url?: string
  cancel_return_url?: string
  ttlMs?: number
}

export interface PaymentSession {
  /** payment_session_id (ps-…) */
  id: string
  /** payment_link_url — halaman bayar Xendit */
  payment_url: string
  expires_at: string | null
}

function authHeader(secretKey: string) {
  return 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
}

export async function createPaymentSession(params: CreateSessionParams): Promise<PaymentSession> {
  const secretKey = process.env.XENDIT_SECRET_KEY
  const expiresAt = new Date(Date.now() + (params.ttlMs ?? PAYMENT_LINK_TTL_MS)).toISOString()

  // STUB MODE — jika tidak ada key (dev/test)
  if (!secretKey) {
    console.log('[Xendit STUB] createPaymentSession:', params.reference_id)
    return {
      id: 'mock_ps_' + Date.now(),
      payment_url: (params.success_return_url ?? 'https://shop.evcmercato.com') + '?mock=1',
      expires_at: expiresAt,
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout
  try {
    const res = await fetch(`${API}/sessions`, {
      method: 'POST',
      headers: { Authorization: authHeader(secretKey), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference_id: params.reference_id,
        session_type: 'PAY',
        mode: 'PAYMENT_LINK',
        amount: params.amount,
        currency: 'IDR',
        country: 'ID',
        description: params.description.slice(0, 1000),
        expires_at: expiresAt,
        locale: 'id',
        ...(params.success_return_url ? { success_return_url: params.success_return_url } : {}),
        ...(params.cancel_return_url ? { cancel_return_url: params.cancel_return_url } : {}),
      }),
      signal: controller.signal,
    })
    const raw = await res.text()
    if (!res.ok) {
      console.error('[Xendit] createPaymentSession failed:', res.status, raw.slice(0, 500))
      throw new Error(`Xendit error ${res.status}: ${raw.slice(0, 500)}`)
    }
    const data = JSON.parse(raw) as { payment_session_id: string; payment_link_url: string | null; expires_at?: string }
    if (!data.payment_link_url) throw new Error('Xendit: payment_link_url kosong')
    return { id: data.payment_session_id, payment_url: data.payment_link_url, expires_at: data.expires_at ?? expiresAt }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Matikan link bayar yang belum dibayar (mis. pesanan ditandai lunas via transfer BCA).
 * Hanya Payment Session (ps-…). Invoice legacy (dibuat sebelum migrasi) TIDAK dimatikan —
 * memanggil endpoint legacy = kena maintenance fee; invoice itu kedaluwarsa sendiri ≤ 24 jam.
 */
export async function cancelPaymentSession(sessionId: string): Promise<boolean> {
  const secretKey = process.env.XENDIT_SECRET_KEY
  if (!secretKey || sessionId.startsWith('mock_')) return true
  if (!sessionId.startsWith('ps-')) {
    console.warn('[Xendit] link legacy tidak dibatalkan (dibiarkan kedaluwarsa):', sessionId)
    return true
  }
  const res = await fetch(`${API}/sessions/${encodeURIComponent(sessionId)}/cancel`, {
    method: 'POST',
    headers: { Authorization: authHeader(secretKey) },
  })
  if (!res.ok) console.error('[Xendit] cancelPaymentSession failed:', sessionId, res.status, await res.text().catch(() => ''))
  return res.ok
}

/** channel_code pembayaran (Payments API v3), null bila gagal. */
export async function getPaymentChannelCode(paymentId: string | null | undefined): Promise<string | null> {
  const secretKey = process.env.XENDIT_SECRET_KEY
  if (!secretKey || !paymentId) return null
  try {
    const res = await fetch(`${API}/v3/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: authHeader(secretKey), 'api-version': '2024-11-11' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('[Xendit] getPayment failed:', paymentId, res.status, (await res.text().catch(() => '')).slice(0, 200))
      return null
    }
    const data = (await res.json()) as { channel_code?: string }
    return data.channel_code ?? null
  } catch (e) {
    console.error('[Xendit] getPayment error:', paymentId, e)
    return null
  }
}

/**
 * channel_code v3 → nilai channel gaya legacy (payment_channel invoice), agar label metode
 * bayar tetap sama: BCA_VIRTUAL_ACCOUNT → BCA, CARDS → CREDIT_CARD, QRIS/OVO/… tetap.
 */
export function legacyChannel(channelCode: string): string {
  const c = channelCode.toUpperCase()
  if (c === 'CARDS' || c === 'CARD' || c === 'CREDIT_CARD') return 'CREDIT_CARD'
  return c.replace(/_VIRTUAL_ACCOUNT$/, '')
}

/**
 * channel_code v3 → kategori `payment_method` gaya legacy invoice (yang selama ini disimpan
 * di orders.xendit_payment_method): BANK_TRANSFER, QR_CODE, EWALLET, CREDIT_CARD, RETAIL_OUTLET.
 */
export function legacyMethod(channelCode: string): string {
  const c = channelCode.toUpperCase()
  if (c.endsWith('_VIRTUAL_ACCOUNT')) return 'BANK_TRANSFER'
  if (c === 'QRIS') return 'QR_CODE'
  if (c === 'CARDS' || c === 'CARD' || c === 'CREDIT_CARD') return 'CREDIT_CARD'
  if (['OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA', 'GOPAY', 'ASTRAPAY', 'JENIUSPAY', 'NEXCASH'].includes(c)) return 'EWALLET'
  if (c === 'ALFAMART' || c === 'INDOMARET') return 'RETAIL_OUTLET'
  return c
}
