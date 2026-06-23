import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/broadcast/[campaignId]/status — return progress
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  const admin = getSupabaseAdmin()

  const { data: campaign, error } = await admin
    .from('broadcast_campaigns')
    .select('id, name, status, total_leads, sent_count, failed_count, started_at, finished_at')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  const pending = campaign.total_leads - campaign.sent_count - campaign.failed_count

  return NextResponse.json({
    campaign_id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    total: campaign.total_leads,
    sent: campaign.sent_count,
    failed: campaign.failed_count,
    pending,
    started_at: campaign.started_at,
    finished_at: campaign.finished_at,
  })
}
