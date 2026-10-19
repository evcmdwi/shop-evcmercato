import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const PAID = ['paid', 'processed', 'shipped', 'delivered']

// Papan skor admin per bulan (WIB): jumlah follow-up, closing per sumber, omzet (tanpa ongkir).
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const month = req.nextUrl.searchParams.get('month') ?? ''
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'month=YYYY-MM' }, { status: 400 })
  const [y, m] = month.split('-').map(Number)
  const from = new Date(Date.UTC(y, m - 1, 1, -7)).toISOString()
  const to = new Date(Date.UTC(y, m, 1, -7)).toISOString()

  const admin = getSupabaseAdmin()
  const [{ data: codes }, { data: fus, error: e1 }, { data: orders, error: e2 }] = await Promise.all([
    admin.from('admin_codes').select('code, name, is_active').order('code'),
    admin.from('admin_followups').select('admin_code, user_id').gte('created_at', from).lt('created_at', to),
    admin
      .from('orders')
      .select('admin_code, admin_source, total_amount, shipping_cost')
      .not('admin_code', 'is', null)
      .in('status', PAID)
      .gte('paid_at', from)
      .lt('paid_at', to),
  ])
  if (e1 || e2) return NextResponse.json({ error: (e1 ?? e2)!.message }, { status: 500 })

  const rows = (codes ?? []).map((c) => {
    const mine = (orders ?? []).filter((o) => o.admin_code === c.code)
    const myFus = (fus ?? []).filter((f) => f.admin_code === c.code)
    const by = (s: string) => mine.filter((o) => o.admin_source === s).length
    return {
      code: c.code,
      name: c.name,
      is_active: c.is_active,
      followups: myFus.length,
      customers_followed: new Set(myFus.map((f) => f.user_id)).size,
      closing: mine.length,
      closing_followup: by('followup'),
      closing_dibuat: by('dibuat'),
      closing_klaim: by('klaim'),
      omzet: mine.reduce((s, o) => s + (o.total_amount ?? 0) - (o.shipping_cost ?? 0), 0),
    }
  })
  rows.sort((a, b) => b.omzet - a.omzet || b.closing - a.closing || b.followups - a.followups)
  return NextResponse.json({ month, rows: rows.filter((r) => r.is_active || r.closing || r.followups) })
}
