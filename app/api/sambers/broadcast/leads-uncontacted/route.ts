import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/broadcast/leads-uncontacted?limit=50&exclude_campaign_id=<id>
// Returns leads that have never been successfully sent any broadcast
// Excludes leads that appear in broadcast_logs with status='sent'
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const admin = getSupabaseAdmin()

  // Step 1: Get distinct lead_ids that have EVER been successfully sent a broadcast
  // Fetch in batches to avoid query string limits
  const BATCH = 1000
  let page = 0
  const sentIds = new Set<string>()
  let fetchError = false

  while (true) {
    const { data, error } = await admin
      .from('broadcast_logs')
      .select('lead_id')
      .eq('status', 'sent')
      .range(page * BATCH, (page + 1) * BATCH - 1)

    if (error) { fetchError = true; break }
    if (!data || data.length === 0) break
    data.forEach((r) => sentIds.add(r.lead_id as string))
    if (data.length < BATCH) break
    page++
  }

  if (fetchError) {
    return NextResponse.json({ error: 'Gagal mengambil data broadcast logs' }, { status: 500 })
  }

  // Step 2: Fetch all active leads (exclude converted)
  // Then filter out sentIds in JS — avoids Supabase .not('id','in',...) URL length limits
  const neededCount = limit * 5 // fetch extra to account for filtering
  let allLeads: { id: string; nama: string; phone: string; kota: string | null }[] = []
  let leadsPage = 0
  const PAGE_SIZE = 500

  while (allLeads.filter(l => !sentIds.has(l.id)).length < limit) {
    const { data, error } = await admin
      .from('leads')
      .select('id, nama, phone, kota')
      .neq('status', 'converted')
      .order('created_at', { ascending: true }) // oldest first = paling lama belum dihubungi
      .range(leadsPage * PAGE_SIZE, (leadsPage + 1) * PAGE_SIZE - 1)

    if (error || !data || data.length === 0) break
    allLeads = allLeads.concat(data)
    if (data.length < PAGE_SIZE) break
    leadsPage++
    if (allLeads.length > neededCount) break // safety cap
  }

  // Step 3: Filter out already-sent leads, take first `limit`
  const uncontacted = allLeads
    .filter(l => !sentIds.has(l.id))
    .slice(0, limit)
    .map(l => ({ ...l, broadcast_count: 0 }))

  return NextResponse.json({
    leads: uncontacted,
    total_sent_excluded: sentIds.size,
  })
}
