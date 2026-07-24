import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// POST /api/sambers/broadcast/[campaignId]/send-next
// Kirim 1 pesan berikutnya dari campaign.
// Client memanggil endpoint ini berulang (dengan delay di sisi browser) sampai done.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  const admin = getSupabaseAdmin()

  // Ambil campaign
  const { data: campaign, error: campaignError } = await admin
    .from('broadcast_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  if (campaign.status === 'paused' || campaign.status === 'stopped') {
    return NextResponse.json({ done: false, paused: true, status: campaign.status })
  }

  if (campaign.status === 'done') {
    return NextResponse.json({ done: true, status: 'done' })
  }

  // Mark running jika masih draft
  if (campaign.status === 'draft') {
    await admin
      .from('broadcast_campaigns')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', campaignId)
  }

  // Ambil 1 pending log berikutnya
  const { data: nextLog, error: logError } = await admin
    .from('broadcast_logs')
    .select('id, lead_id, phone')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (logError || !nextLog) {
    // Tidak ada lagi yang pending — campaign selesai
    await admin
      .from('broadcast_campaigns')
      .update({ status: 'done', finished_at: new Date().toISOString() })
      .eq('id', campaignId)
    return NextResponse.json({ done: true, status: 'done' })
  }

  // Kirim WA
  const result = await sendWhatsApp({ to: nextLog.phone, message: campaign.message })
  const success = result.success
  const now = new Date().toISOString()

  // Update log
  await admin
    .from('broadcast_logs')
    .update({
      status: success ? 'sent' : 'failed',
      error_message: success ? null : String(result.error),
      sent_at: success ? now : null,
    })
    .eq('id', nextLog.id)

  // Increment counter
  if (success) {
    await admin.rpc('increment_campaign_sent', { campaign_id: campaignId })
  } else {
    await admin.rpc('increment_campaign_failed', { campaign_id: campaignId })
  }

  // Hitung berapa sudah diproses (sent + failed)
  const { count: processedCount } = await admin
    .from('broadcast_logs')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .in('status', ['sent', 'failed'])

  // Cek apakah masih ada pending lagi
  const { count: remainingCount } = await admin
    .from('broadcast_logs')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  const processed = processedCount ?? 0
  const remaining = remainingCount ?? 0

  // Hitung delay untuk next request (di sisi client)
  // Cooling break setiap 10 pesan: 2–5 menit
  // Normal: 15–120 detik
  let nextDelayMs = 0
  if (remaining > 0) {
    if (processed % 10 === 0) {
      nextDelayMs = randomInt(120000, 300000) // cooling 2–5 menit
    } else {
      nextDelayMs = randomInt(15000, 120000) // normal 15–120 detik
    }
  }

  return NextResponse.json({
    done: remaining === 0,
    status: remaining === 0 ? 'done' : 'running',
    result: {
      lead_id: nextLog.lead_id,
      phone: nextLog.phone,
      success,
      error: success ? undefined : String(result.error),
    },
    processed,
    remaining,
    total: campaign.total_leads,
    nextDelayMs,
    isCooling: processed % 10 === 0 && remaining > 0,
  })
}
