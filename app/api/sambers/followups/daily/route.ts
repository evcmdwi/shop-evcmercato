import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { FU_DAILY_TARGET } from '@/lib/followup-target'

const PAID = ['paid', 'processed', 'shipped', 'delivered']
const DAY = 86400000
const HISTORY_DAYS = 14

const wibDate = (iso: string | number) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
const wibStart = (date: string) => new Date(date + 'T00:00:00+07:00').getTime()

type Admin = ReturnType<typeof getSupabaseAdmin>

// Ambil per 1000 baris (batas max-rows PostgREST).
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = []
  for (let off = 0; ; off += 1000) {
    const { data, error } = await build(off, off + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) return rows
  }
}

async function namesById(admin: Admin, table: 'users' | 'leads', col: 'name' | 'nama', ids: string[]) {
  const map = new Map<string, string>()
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from(table).select(`id, ${col}`).in('id', ids.slice(i, i + 200))
    for (const r of (data ?? []) as unknown as Record<string, string>[]) map.set(r.id, r[col] ?? '')
  }
  return map
}

// Performa harian admin (WIB): follow up member & leads, hasil yang dicatat, join, pesanan,
// kegiatan per jam, plus riwayat HISTORY_DAYS hari terakhir terhadap target.
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const date = req.nextUrl.searchParams.get('date') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date=YYYY-MM-DD' }, { status: 400 })
  const dayFrom = new Date(wibStart(date)).toISOString()
  const dayTo = new Date(wibStart(date) + DAY).toISOString()
  const histFrom = new Date(wibStart(date) - (HISTORY_DAYS - 1) * DAY).toISOString()

  const admin = getSupabaseAdmin()
  try {
    const [codes, memberFus, leadFus, joins, orders] = await Promise.all([
      admin.from('admin_codes').select('code, name, is_active').order('code').then((r) => r.data ?? []),
      fetchAll<{ admin_code: string; created_at: string; user_id: string; segment: string; lead_id: string | null }>((a, b) =>
        admin.from('admin_followups').select('admin_code, created_at, user_id, segment, lead_id')
          .gte('created_at', histFrom).lt('created_at', dayTo).order('created_at').range(a, b)),
      fetchAll<{ admin_code: string; created_at: string; lead_id: string; result: string | null; result_at: string | null }>((a, b) =>
        admin.from('lead_followups').select('admin_code, created_at, lead_id, result, result_at')
          .gte('created_at', histFrom).lt('created_at', dayTo).order('created_at').range(a, b)),
      admin.from('leads').select('id, nama, converted_by_admin, converted_at')
        .not('converted_by_admin', 'is', null).gte('converted_at', dayFrom).lt('converted_at', dayTo)
        .then((r) => r.data ?? []),
      admin.from('orders').select('id, admin_code, admin_source, status, total_amount, shipping_cost, created_at, paid_at, shipping_recipient_name, user_id')
        .not('admin_code', 'is', null)
        .or(`and(created_at.gte.${dayFrom},created_at.lt.${dayTo}),and(paid_at.gte.${dayFrom},paid_at.lt.${dayTo})`)
        .then((r) => r.data ?? []),
    ])

    const todayMember = memberFus.filter((f) => f.created_at >= dayFrom)
    const todayLead = leadFus.filter((f) => f.created_at >= dayFrom)
    const [userNames, leadNames] = await Promise.all([
      namesById(admin, 'users', 'name', [...new Set(todayMember.map((f) => f.user_id))]),
      namesById(admin, 'leads', 'nama', [...new Set(todayLead.map((f) => f.lead_id))]),
    ])

    const rows = codes.map((c) => {
      const mFu = todayMember.filter((f) => f.admin_code === c.code)
      const lFu = todayLead.filter((f) => f.admin_code === c.code)
      const myJoins = joins.filter((j) => j.converted_by_admin === c.code)
      const myOrders = orders.filter((o) => o.admin_code === c.code)
      const created = myOrders.filter((o) => o.admin_source === 'dibuat' && o.created_at >= dayFrom && o.created_at < dayTo)
      const paid = myOrders.filter((o) => PAID.includes(o.status) && o.paid_at && o.paid_at >= dayFrom && o.paid_at < dayTo)

      const results: Record<string, number> = {}
      for (const f of leadFus) {
        if (f.admin_code === c.code && f.result && f.result_at && f.result_at >= dayFrom && f.result_at < dayTo) {
          results[f.result] = (results[f.result] ?? 0) + 1
        }
      }

      // Riwayat: orang unik di-FU per hari.
      const perDay = new Map<string, Set<string>>()
      const add = (d: string, who: string) => {
        const s = perDay.get(d) ?? new Set<string>()
        perDay.set(d, s)
        s.add(who)
      }
      // Kunci member hasil daftar dari leads bukan follow up baru (lead-nya sudah dihitung).
      memberFus.filter((f) => f.admin_code === c.code && !f.lead_id).forEach((f) => add(wibDate(f.created_at), 'u:' + f.user_id))
      leadFus.filter((f) => f.admin_code === c.code).forEach((f) => add(wibDate(f.created_at), 'l:' + f.lead_id))
      const history = Array.from({ length: HISTORY_DAYS }, (_, i) => {
        const d = wibDate(wibStart(date) - (HISTORY_DAYS - 1 - i) * DAY + 12 * 3600000)
        return { date: d, fu: perDay.get(d)?.size ?? 0 }
      })

      const timeline = [
        ...mFu.map((f) => ({ at: f.created_at, kind: f.lead_id ? 'join' as const : 'fu_member' as const, label: userNames.get(f.user_id) || 'Member', detail: f.lead_id ? 'didaftarkan dari leads' : f.segment })),
        ...lFu.map((f) => ({ at: f.created_at, kind: 'fu_lead' as const, label: leadNames.get(f.lead_id) || 'Lead', detail: f.result ?? '' })),
        ...created.map((o) => ({ at: o.created_at, kind: 'order' as const, label: o.shipping_recipient_name || 'Pesanan', detail: o.status })),
        ...paid.filter((o) => o.admin_source !== 'dibuat').map((o) => ({ at: o.paid_at!, kind: 'closing' as const, label: o.shipping_recipient_name || 'Pesanan', detail: o.admin_source ?? '' })),
      ].sort((a, b) => b.at.localeCompare(a.at))

      return {
        code: c.code,
        name: c.name,
        is_active: c.is_active,
        fu_total: perDay.get(date)?.size ?? 0,
        fu_member: new Set(mFu.filter((f) => !f.lead_id).map((f) => f.user_id)).size,
        fu_lead: new Set(lFu.map((f) => f.lead_id)).size,
        results,
        joins: myJoins.length,
        orders_created: created.length,
        closing: paid.length,
        omzet: paid.reduce((s, o) => s + (o.total_amount ?? 0) - (o.shipping_cost ?? 0), 0),
        first_at: timeline.length ? timeline[timeline.length - 1].at : null,
        last_at: timeline.length ? timeline[0].at : null,
        history,
        timeline,
      }
    })

    rows.sort((a, b) => b.fu_total - a.fu_total || b.closing - a.closing)
    return NextResponse.json({
      date,
      target: FU_DAILY_TARGET,
      rows: rows.filter((r) => r.is_active || r.fu_total || r.closing || r.orders_created),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
