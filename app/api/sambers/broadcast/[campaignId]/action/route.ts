import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/sambers/broadcast/[campaignId]/action
// Body: { action: 'pause' | 'resume' | 'stop' }
//
// Pause/stop: sets status in DB — the running SSE loop polls DB and breaks.
// Resume: sets status back to 'running' — caller must re-trigger /start to resume loop.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  const body = await req.json()
  const action = body?.action as string

  if (!['pause', 'resume', 'stop'].includes(action)) {
    return NextResponse.json({ error: 'action harus salah satu dari: pause, resume, stop' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: campaign, error } = await admin
    .from('broadcast_campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  if (action === 'pause') {
    if (campaign.status !== 'running') {
      return NextResponse.json({ error: `Campaign tidak sedang running (status: ${campaign.status})` }, { status: 400 })
    }
    // Write paused to DB — the loop in /start polls this and will break
    await admin
      .from('broadcast_campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignId)
    return NextResponse.json({ ok: true, status: 'paused', message: 'Campaign dijeda.' })
  }

  if (action === 'resume') {
    if (campaign.status !== 'paused') {
      return NextResponse.json({ error: `Campaign tidak sedang paused (status: ${campaign.status})` }, { status: 400 })
    }
    // Set status back to running so /start can be re-called
    await admin
      .from('broadcast_campaigns')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', campaignId)
    return NextResponse.json({ ok: true, status: 'running', message: 'Campaign dilanjutkan. Trigger /start untuk melanjutkan loop.' })
  }

  if (action === 'stop') {
    if (campaign.status === 'done') {
      return NextResponse.json({ error: 'Campaign sudah selesai' }, { status: 400 })
    }
    await admin
      .from('broadcast_campaigns')
      .update({ status: 'stopped', finished_at: new Date().toISOString() })
      .eq('id', campaignId)
    return NextResponse.json({ ok: true, status: 'stopped', message: 'Campaign dihentikan.' })
  }
}
