import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/broadcast/leads-uncontacted?limit=50&campaign_id=<id>
// Returns leads that have NOT been included in the specified campaign.
// If campaign_id is omitted, excludes leads already sent in ANY campaign.
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const campaignId = searchParams.get('campaign_id') ?? null

  const admin = getSupabaseAdmin()

  // Step 1: Get lead_ids already in the target campaign (all statuses)
  // If campaign_id provided → exclude leads in that campaign
  // If not → exclude leads ever successfully sent in any campaign
  const BATCH = 1000
  let page = 0
  const excludedIds = new Set<string>()
  let fetchError = false

  while (true) {
    let q = admin
      .from('broadcast_logs')
      .select('lead_id')
      .range(page * BATCH, (page + 1) * BATCH - 1)

    if (campaignId) {
      // Exclude leads already in THIS campaign (any status)
      q = q.eq('campaign_id', campaignId)
    } else {
      // Fallback: exclude leads ever successfully sent
      q = q.eq('status', 'sent')
    }

    const { data, error } = await q
    if (error) { fetchError = true; break }
    if (!data || data.length === 0) break
    data.forEach((r) => excludedIds.add(r.lead_id as string))
    if (data.length < BATCH) break
    page++
  }

  if (fetchError) {
    return NextResponse.json({ error: 'Gagal mengambil data broadcast logs' }, { status: 500 })
  }

  // Step 2: Fetch leads in pages, filter excluded in JS (avoids URL length limit)
  let allLeads: { id: string; nama: string; phone: string; kota: string | null }[] = []
  let leadsPage = 0
  const PAGE_SIZE = 500

  while (allLeads.filter(l => !excludedIds.has(l.id)).length < limit) {
    const { data, error } = await admin
      .from('leads')
      .select('id, nama, phone, kota')
      .neq('status', 'converted')
      .order('created_at', { ascending: true })
      .range(leadsPage * PAGE_SIZE, (leadsPage + 1) * PAGE_SIZE - 1)

    if (error || !data || data.length === 0) break
    allLeads = allLeads.concat(data)
    if (data.length < PAGE_SIZE) break
    leadsPage++
    if (allLeads.length > 5000) break // safety cap
  }

  // Step 3: Filter & slice
  const result = allLeads
    .filter(l => !excludedIds.has(l.id))
    .slice(0, limit)
    .map(l => ({ ...l, broadcast_count: 0 }))

  return NextResponse.json({
    leads: result,
    excluded_count: excludedIds.size,
    campaign_id: campaignId,
  })
}
