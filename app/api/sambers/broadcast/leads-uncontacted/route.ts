import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/broadcast/leads-uncontacted?limit=50
// Returns leads that have never been in any broadcast campaign log
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const admin = getSupabaseAdmin()

  // Get lead_ids already in any broadcast_log
  const { data: contacted, error: contactedError } = await admin
    .from('broadcast_logs')
    .select('lead_id')

  if (contactedError) {
    return NextResponse.json({ error: 'Gagal mengambil data broadcast logs' }, { status: 500 })
  }

  const contactedIds = (contacted ?? []).map((r) => r.lead_id as string)

  // Fetch leads not in that set, and exclude converted (already members)
  let query = admin
    .from('leads')
    .select('id, nama, phone, kota, broadcast_count:id.count()')
    .neq('status', 'converted')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (contactedIds.length > 0) {
    query = query.not('id', 'in', `(${contactedIds.join(',')})`)
  }

  const { data: leads, error: leadsError } = await query

  if (leadsError) {
    // Fallback: just fetch latest leads without exclusion
    const { data: fallback } = await admin
      .from('leads')
      .select('id, nama, phone, kota')
      .neq('status', 'converted')
      .order('created_at', { ascending: false })
      .limit(limit)
    return NextResponse.json({ leads: fallback ?? [], note: 'fallback — exclusion query failed' })
  }

  return NextResponse.json({ leads: leads ?? [] })
}
