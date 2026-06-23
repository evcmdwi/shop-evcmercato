import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { broadcastPauseFlags } from '@/lib/broadcast-state'

// POST /api/sambers/broadcast/[campaignId]/pause — pause broadcast
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  const admin = getSupabaseAdmin()

  // Verify campaign exists and is running
  const { data: campaign, error } = await admin
    .from('broadcast_campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  if (campaign.status !== 'running') {
    return NextResponse.json({ error: `Campaign tidak sedang running (status: ${campaign.status})` }, { status: 400 })
  }

  // Set in-memory pause flag (queue worker checks this)
  broadcastPauseFlags.set(campaignId, true)

  // Update DB status to paused
  await admin
    .from('broadcast_campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId)

  return NextResponse.json({ ok: true, message: 'Campaign dijeda. Pesan yang sedang diproses akan selesai terlebih dahulu.' })
}
