import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/broadcast/leads-uncontacted?limit=50&campaign_id=<id>
// Returns leads that have NOT been included in the specified campaign GROUP.
// A campaign group = the root campaign + all its child batches (parent_campaign_id).
// If campaign_id is omitted, excludes leads already sent (status='sent') in ANY campaign.
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const campaignId = searchParams.get('campaign_id') ?? null

  const admin = getSupabaseAdmin()

  // Step 1: Resolve the campaign GROUP (root + all children)
  // so we exclude leads that have been in any batch of the same campaign.
  let groupCampaignIds: string[] = []

  if (campaignId) {
    // Fetch the source campaign to find its root
    const { data: sourceCampaign, error: srcErr } = await admin
      .from('broadcast_campaigns')
      .select('id, parent_campaign_id')
      .eq('id', campaignId)
      .single()

    if (!srcErr && sourceCampaign) {
      const rootId: string = (sourceCampaign.parent_campaign_id as string | null) ?? sourceCampaign.id

      // Fetch all campaigns in the group: root itself + all children of root
      const { data: groupCampaigns } = await admin
        .from('broadcast_campaigns')
        .select('id')
        .or(`id.eq.${rootId},parent_campaign_id.eq.${rootId}`)

      groupCampaignIds = (groupCampaigns ?? []).map((c) => c.id as string)
    } else {
      // Fallback: just use the requested campaign_id
      groupCampaignIds = [campaignId]
    }
  }

  // Step 2: Collect excluded lead_ids from the group
  const BATCH = 1000
  let page = 0
  const excludedIds = new Set<string>()
  let fetchError = false

  while (true) {
    let q = admin
      .from('broadcast_logs')
      .select('lead_id')
      .range(page * BATCH, (page + 1) * BATCH - 1)

    if (groupCampaignIds.length > 0) {
      // Exclude leads in ANY campaign within this group (any status)
      q = q.in('campaign_id', groupCampaignIds)
    } else {
      // No campaign_id provided → exclude leads ever successfully sent in any campaign
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

  // Step 3: Fetch leads in pages, filter excluded in JS (avoids URL length limit)
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

  // Step 4: Filter & slice
  const result = allLeads
    .filter(l => !excludedIds.has(l.id))
    .slice(0, limit)
    .map(l => ({ ...l, broadcast_count: 0 }))

  return NextResponse.json({
    leads: result,
    excluded_count: excludedIds.size,
    campaign_id: campaignId,
    group_campaign_ids: groupCampaignIds,
  })
}
