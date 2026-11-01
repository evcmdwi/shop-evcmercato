import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Penjualan per hari (WIB) untuk dashboard admin. Definisi sama dengan papan skor Follow Up:
// pesanan purchase yang sudah lunas, dihitung di tanggal paid_at, omzet = total_amount − ongkir.
const PAID = ['paid', 'processed', 'shipped', 'delivered']
const DAY = 86400000
const MAX_DAYS = 366
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const wibDate = (t: string | number) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
const wibStart = (date: string) => new Date(date + 'T00:00:00+07:00').getTime()

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const today = wibDate(Date.now())
    const sp = req.nextUrl.searchParams
    const to = sp.get('to') || today
    const from = sp.get('from') || wibDate(wibStart(to) - 29 * DAY)
    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      return NextResponse.json({ error: 'Format tanggal YYYY-MM-DD' }, { status: 400 })
    }
    const startMs = wibStart(from)
    const endMs = wibStart(to) + DAY
    const days = Math.round((endMs - startMs) / DAY)
    if (!(days >= 1)) return NextResponse.json({ error: 'Tanggal "dari" harus sebelum "sampai"' }, { status: 400 })
    if (days > MAX_DAYS) return NextResponse.json({ error: `Rentang maksimal ${MAX_DAYS} hari` }, { status: 400 })

    // Ringkasan tetap (hari ini / 7 / 30 hari) ikut diambil dalam satu query bila rentang lebih sempit.
    const summaryStart = wibStart(today) - 29 * DAY
    const summaryEnd = wibStart(today) + DAY
    const qFrom = Math.min(startMs, summaryStart)
    const qTo = Math.max(endMs, summaryEnd)

    const admin = getSupabaseAdmin()
    const rows: { paid_at: string; total_amount: number | null; shipping_cost: number | null }[] = []
    for (let off = 0; ; off += 1000) {
      const { data, error } = await admin.from('orders')
        .select('paid_at, total_amount, shipping_cost')
        .eq('order_type', 'purchase').in('status', PAID)
        .gte('paid_at', new Date(qFrom).toISOString()).lt('paid_at', new Date(qTo).toISOString())
        .order('paid_at').range(off, off + 999)
      if (error) throw new Error(error.message)
      rows.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }

    const byDay = new Map<string, { omzet: number; orders: number }>()
    for (const o of rows) {
      const d = wibDate(o.paid_at)
      const cur = byDay.get(d) ?? { omzet: 0, orders: 0 }
      cur.omzet += (o.total_amount ?? 0) - (o.shipping_cost ?? 0)
      cur.orders += 1
      byDay.set(d, cur)
    }

    const series = (s: number, n: number) => Array.from({ length: n }, (_, i) => {
      const date = wibDate(s + i * DAY + 12 * 3600000)
      return { date, ...(byDay.get(date) ?? { omzet: 0, orders: 0 }) }
    })
    const sum = (list: { omzet: number; orders: number }[]) =>
      list.reduce((a, r) => ({ omzet: a.omzet + r.omzet, orders: a.orders + r.orders }), { omzet: 0, orders: 0 })

    const last30 = series(summaryStart, 30)
    const daily = series(startMs, days)

    return NextResponse.json({
      data: {
        today,
        summary: {
          today: sum(last30.slice(-1)),
          last7: sum(last30.slice(-7)),
          last30: sum(last30),
        },
        range: { from, to, days, ...sum(daily) },
        daily,
      },
    })
  } catch (err) {
    console.error('[/api/sambers/dashboard/sales]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
