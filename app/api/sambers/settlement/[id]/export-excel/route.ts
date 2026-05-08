import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import * as XLSX from 'xlsx'

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
    console.error('[export-excel] fetch details error:', dErr)
    return NextResponse.json({ error: 'Failed to fetch settlement details' }, { status: 500 })
  }

  // Build worksheet data
  const rows: (string | number)[][] = [
    ['ID Member KKI', 'Nama Lengkap', 'Net PV'],
  ]

  let totalPv = 0
  for (const d of details ?? []) {
    const affRaw = d.affiliates
    const aff = (Array.isArray(affRaw) ? affRaw[0] : affRaw) as { full_name_kkd: string; kki_member_id: string | null } | null
    const kki = aff?.kki_member_id ?? '-'
    const name = aff?.full_name_kkd ?? '-'
    const pv = d.net_pv ?? 0
    totalPv += pv
    rows.push([kki, name, pv])
  }

  // Footer
  rows.push(['TOTAL', '', totalPv])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Style header row bold (xlsx-js doesn't support full styling without xlsx-style, skip)
  ws['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 12 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Settlement')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `settlement-${settlement.settlement_date ?? id}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
