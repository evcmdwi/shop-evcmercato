import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Daftar customer untuk di-follow up admin (segmen: unpaid, repeat, dormant, new) + tier & status VIP.
export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const admin = getSupabaseAdmin()
  const [{ data, error }, users] = await Promise.all([admin.rpc('admin_followup_candidates'), loadUserTiers(admin)])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byId = new Map(users.map((u) => [u.id, u]))
  const candidates = ((data ?? []) as { user_id: string }[]).map((c) => {
    const u = byId.get(c.user_id)
    return { ...c, tier: u?.tier ?? 'silver', vip_pct: Number(u?.special_discount_pct ?? 0) }
  })
  return NextResponse.json({ candidates })
}

// Ambil per 1000 baris (batas max-rows PostgREST).
async function loadUserTiers(admin: ReturnType<typeof getSupabaseAdmin>) {
  const rows: { id: string; tier: string; special_discount_pct: number | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await admin.from('users').select('id, tier, special_discount_pct').order('id').range(from, from + 999)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) return rows
  }
}
