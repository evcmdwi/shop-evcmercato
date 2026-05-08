import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const { id } = await params
  const admin = getSupabaseAdmin()

  // Fetch settlement
  const { data: settlement, error: sErr } = await admin
    .from('settlements')
    .select('id, period_label, settlement_date')
    .eq('id', id)
    .single()

  if (sErr || !settlement) {
    return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
  }

  // Fetch settlement_details with affiliate info
  const { data: details, error: dErr } = await admin
    .from('settlement_details')
    .select(`
      net_pv,
      affiliates (
        full_name_kkd,
        kki_member_id
      )
    `)
    .eq('settlement_id', id)
    .order('net_pv', { ascending: false })

  if (dErr) {
    console.error('[export-csv] fetch details error:', dErr)
    return NextResponse.json({ error: 'Failed to fetch settlement details' }, { status: 500 })
  }

  // Build CSV
  const lines: string[] = ['ID Member KKI,Nama Lengkap,Net PV']

  for (const d of details ?? []) {
    const affRaw = d.affiliates
    const aff = (Array.isArray(affRaw) ? affRaw[0] : affRaw) as { full_name_kkd: string; kki_member_id: string | null } | null
    const kki = (aff?.kki_member_id ?? '-').replace(/,/g, ';')
    const name = (aff?.full_name_kkd ?? '-').replace(/,/g, ';')
    const pv = d.net_pv ?? 0
    lines.push(`${kki},${name},${pv}`)
  }

  const csv = lines.join('\n')
  const filename = `settlement-${settlement.settlement_date ?? id}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
