import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { findwiStaff } from '@/lib/findwi-staff'

// Sambers › Input Kartu Kredit. Data tidak disimpan di toko — diteruskan ke Findwi pemilik
// (status Menunggu → diverifikasi pemilik). Identitas staf = username akun Sambers.
async function staffLabel() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: auth.status }) }
  const label = auth.account?.username ?? `admin-${auth.userId?.slice(0, 8)}`
  return { label }
}

// GET ?q=… → saran "Dibayar ke"; tanpa q → kartu + batas + riwayat "Input saya".
export async function GET(req: NextRequest) {
  const s = await staffLabel()
  if ('error' in s) return s.error
  const q = req.nextUrl.searchParams.get('q')
  if (q !== null) {
    const r = await findwiStaff<{ merchants: { merchant: string }[] }>('GET', 'merchants', { query: { staff: s.label, q } })
    return NextResponse.json(r.ok ? { merchants: r.merchants.map((m) => m.merchant) } : { merchants: [] })
  }
  const [cards, history] = await Promise.all([
    findwiStaff<{ cards: { id: string; label: string }[]; max_amount: number }>('GET', 'cards'),
    findwiStaff<{ submissions: unknown[] }>('GET', 'submissions', { query: { staff: s.label } }),
  ])
  if (!cards.ok) return NextResponse.json({ error: cards.message }, { status: cards.status })
  return NextResponse.json({
    staff: s.label,
    cards: cards.cards,
    max_amount: cards.max_amount,
    submissions: history.ok ? history.submissions : [],
  })
}

export async function POST(req: NextRequest) {
  const s = await staffLabel()
  if ('error' in s) return s.error
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Isian tidak valid' }, { status: 400 })
  const r = await findwiStaff<{ id: string }>('POST', 'submissions', {
    body: {
      staff: s.label,
      txn_date: b.txn_date,
      card_id: b.card_id,
      merchant: b.merchant,
      amount: b.amount,
      type: b.type,
      note: typeof b.note === 'string' && b.note.trim() ? b.note : undefined,
      client_id: b.client_id,
    },
  })
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: r.status >= 500 ? 502 : 400 })
  return NextResponse.json({ ok: true, id: r.id })
}
