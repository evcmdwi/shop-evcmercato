import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { FU_DAILY_TARGET } from '@/lib/followup-target'

const PAID = ['paid', 'processed', 'shipped', 'delivered']
const DAY = 86400000

const wibDate = (iso: string | number) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })

type Admin = ReturnType<typeof getSupabaseAdmin>
type FuRow = { admin_code: string; created_at: string; user_id?: string; lead_id?: string }

// Ambil per 1000 baris (batas max-rows PostgREST).
async function fetchFollowups(admin: Admin, table: 'admin_followups' | 'lead_followups', key: 'user_id' | 'lead_id', from: string, to: string) {
  const rows: FuRow[] = []
  for (let off = 0; ; off += 1000) {
    const { data, error } = await admin
      .from(table)
      .select(`admin_code, created_at, ${key}`)
      .gte('created_at', from)
      .lt('created_at', to)
      .order('created_at')
      .range(off, off + 999)
    if (error) throw error
    rows.push(...((data ?? []) as unknown as FuRow[]))
    if (!data || data.length < 1000) return rows
  }
}

// Papan skor admin per bulan (WIB): follow up member & leads, Join, closing per sumber, omzet (tanpa ongkir),
// hari capai target harian & streak.
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const month = req.nextUrl.searchParams.get('month') ?? ''
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'month=YYYY-MM' }, { status: 400 })
  const [y, m] = month.split('-').map(Number)
  const from = new Date(Date.UTC(y, m - 1, 1, -7)).toISOString()
  const to = new Date(Date.UTC(y, m, 1, -7)).toISOString()
  // Hitungan harian butuh rentang lebih panjang untuk streak yang melewati awal bulan.
  const dailyFrom = new Date(Math.min(Date.parse(from), Date.now() - 45 * DAY)).toISOString()
  const dailyTo = new Date(Math.max(Date.parse(to), Date.now() + DAY)).toISOString()

  const admin = getSupabaseAdmin()
  let memberFus: FuRow[], leadFus: FuRow[]
  try {
    ;[memberFus, leadFus] = await Promise.all([
      fetchFollowups(admin, 'admin_followups', 'user_id', dailyFrom, dailyTo),
      fetchFollowups(admin, 'lead_followups', 'lead_id', dailyFrom, dailyTo),
    ])
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  const [{ data: codes }, { data: orders, error: e2 }, { data: joins, error: e3 }, { data: leadLocks, error: e4 }] = await Promise.all([
    admin.from('admin_codes').select('code, name, is_active').order('code'),
    admin
      .from('orders')
      .select('id, admin_code, admin_source, total_amount, shipping_cost')
      .not('admin_code', 'is', null)
      .in('status', PAID)
      .gte('paid_at', from)
      .lt('paid_at', to),
    admin.from('leads').select('converted_by_admin').not('converted_by_admin', 'is', null).gte('converted_at', from).lt('converted_at', to),
    admin.from('admin_followups').select('converted_order_id').not('lead_id', 'is', null).not('converted_order_id', 'is', null),
  ])
  if (e2 || e3 || e4) return NextResponse.json({ error: (e2 ?? e3 ?? e4)!.message }, { status: 500 })
  const leadOrderIds = new Set((leadLocks ?? []).map((l) => l.converted_order_id as string))

  // Per admin per hari WIB: jumlah orang unik yang di-FU (member + leads).
  const daily = new Map<string, Map<string, Set<string>>>()
  const addDaily = (r: FuRow, who: string) => {
    const byDay = daily.get(r.admin_code) ?? new Map<string, Set<string>>()
    daily.set(r.admin_code, byDay)
    const d = wibDate(r.created_at)
    const set = byDay.get(d) ?? new Set<string>()
    byDay.set(d, set)
    set.add(who)
  }
  memberFus.forEach((r) => addDaily(r, 'u:' + r.user_id))
  leadFus.forEach((r) => addDaily(r, 'l:' + r.lead_id))

  const today = wibDate(Date.now())
  const inMonth = (r: FuRow) => r.created_at >= from && r.created_at < to

  const rows = (codes ?? []).map((c) => {
    const mine = (orders ?? []).filter((o) => o.admin_code === c.code)
    const myFus = memberFus.filter((f) => f.admin_code === c.code && inMonth(f))
    const myLeadFus = leadFus.filter((f) => f.admin_code === c.code && inMonth(f))
    const by = (s: string) => mine.filter((o) => o.admin_source === s).length
    const closingLeads = mine.filter((o) => leadOrderIds.has(o.id)).length
    const byDay = daily.get(c.code) ?? new Map<string, Set<string>>()
    const count = (d: string) => byDay.get(d)?.size ?? 0

    const targetDays = [...byDay.entries()].filter(([d, s]) => d.startsWith(month) && s.size >= FU_DAILY_TARGET).length
    // Streak: hari berturut-turut capai target; Minggu dilewati, hari ini belum capai tidak memutus.
    let streak = 0
    for (let t = Date.now(); ; t -= DAY) {
      const d = wibDate(t)
      if (new Date(d + 'T00:00:00Z').getUTCDay() === 0) continue
      if (count(d) >= FU_DAILY_TARGET) streak++
      else if (d !== today) break
      if (Date.now() - t > 44 * DAY) break
    }

    return {
      code: c.code,
      name: c.name,
      is_active: c.is_active,
      today_fu: count(today),
      target_days: targetDays,
      streak,
      followups: myFus.length,
      customers_followed: new Set(myFus.map((f) => f.user_id)).size,
      lead_followups: myLeadFus.length,
      leads_followed: new Set(myLeadFus.map((f) => f.lead_id)).size,
      joins: (joins ?? []).filter((j) => j.converted_by_admin === c.code).length,
      closing: mine.length,
      closing_followup: by('followup') - closingLeads,
      closing_leads: closingLeads,
      closing_dibuat: by('dibuat'),
      closing_klaim: by('klaim'),
      omzet: mine.reduce((s, o) => s + (o.total_amount ?? 0) - (o.shipping_cost ?? 0), 0),
    }
  })
  rows.sort((a, b) => b.omzet - a.omzet || b.closing - a.closing || b.joins - a.joins || b.followups + b.lead_followups - a.followups - a.lead_followups)
  return NextResponse.json({
    month,
    target: FU_DAILY_TARGET,
    rows: rows.filter((r) => r.is_active || r.closing || r.followups || r.lead_followups || r.joins),
  })
}
