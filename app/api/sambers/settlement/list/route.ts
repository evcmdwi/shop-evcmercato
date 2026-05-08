import { NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const admin = getSupabaseAdmin()

  const { data: settlements, error } = await admin
    .from('settlements')
    .select('id, period_label, settlement_date, total_affiliates, total_pv, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[settlement/list] error:', error)
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 })
  }

  return NextResponse.json({
    settlements: (settlements ?? []).map(s => ({
      id: s.id,
      period_label: s.period_label,
      settlement_date: s.settlement_date,
      total_affiliates: s.total_affiliates,
      total_pv: s.total_pv,
      status: s.status,
      generated_at: s.created_at,
    })),
  })
}
