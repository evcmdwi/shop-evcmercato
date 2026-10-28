import { createHmac } from 'node:crypto'

// Klien server-ke-server ke Findwi (surat.evcmercato.com/findwi/api/staff/*) untuk menu
// Sambers › Input Kartu Kredit. Kontrak tanda tangan sama dengan lib/findwi/service.ts di
// repo surat-sambers: hex HMAC-SHA256(FINDWI_STAFF_SECRET, `${ts}.${METHOD}.${path+query}.${body}`).
// Admin hanya menerima: kartu (id + label), saran merchant miliknya, dan riwayat inputnya.
const BASE = process.env.FINDWI_URL || 'https://surat.evcmercato.com'

export type FindwiResult<T> = ({ ok: true } & T) | { ok: false; message: string; status: number }

export async function findwiStaff<T>(method: 'GET' | 'POST', path: string, opts: { query?: Record<string, string>; body?: unknown } = {}): Promise<FindwiResult<T>> {
  const secret = process.env.FINDWI_STAFF_SECRET
  if (!secret) return { ok: false, message: 'Sambungan ke Findwi belum diaktifkan (FINDWI_STAFF_SECRET).', status: 503 }
  const qs = opts.query ? `?${new URLSearchParams(opts.query)}` : ''
  const pathQuery = `/findwi/api/staff/${path}${qs}`
  const body = opts.body === undefined ? '' : JSON.stringify(opts.body)
  const ts = String(Math.floor(Date.now() / 1000))
  const sig = createHmac('sha256', secret).update(`${ts}.${method}.${pathQuery}.${body}`).digest('hex')
  try {
    const res = await fetch(BASE + pathQuery, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Findwi-Timestamp': ts, 'X-Findwi-Signature': sig },
      body: method === 'POST' ? body : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) return { ok: false, message: json?.message ?? `Findwi tidak merespons (${res.status}).`, status: res.status || 502 }
    return json as { ok: true } & T
  } catch {
    return { ok: false, message: 'Findwi tidak bisa dihubungi. Coba lagi sebentar.', status: 502 }
  }
}
