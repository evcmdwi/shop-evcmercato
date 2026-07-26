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
    .select('id, name, message, status, total_leads, sent_count, failed_count, started_at, finished_at')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  const pending = campaign.total_leads - campaign.sent_count - campaign.failed_count

  // Ambil logs terbaru (max 100)
  const { data: rawLogs } = await admin
    .from('broadcast_logs')
    .select('id, lead_id, phone, status, sent_at, error_message, leads(nama)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
    .limit(100)

  const logs = (rawLogs ?? []).map((l) => ({
    id: l.id,
    lead_id: l.lead_id,
    nama: (l.leads as { nama?: string } | null)?.nama ?? '—',
    phone: l.phone,
    status: l.status as 'sent' | 'failed' | 'pending',
    sent_at: l.sent_at ?? null,
    error: l.error_message ?? undefined,
  }))

  return NextResponse.json({
    campaign_id: campaign.id,
    name: campaign.name,
    message: campaign.message,
    status: campaign.status,
    total: campaign.total_leads,
    sent: campaign.sent_count,
    failed: campaign.failed_count,
    pending,
    started_at: campaign.started_at,
    finished_at: campaign.finished_at,
    logs,
  })
}
