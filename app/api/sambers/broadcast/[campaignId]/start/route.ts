import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'
import { broadcastPauseFlags } from '@/lib/broadcast-state'

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// POST /api/sambers/broadcast/[campaignId]/start — mulai kirim broadcast (SSE stream)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  const admin = getSupabaseAdmin()

  // Verify campaign exists
  const { data: campaign, error: campaignError } = await admin
    .from('broadcast_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  if (campaign.status === 'running') {
    return NextResponse.json({ error: 'Campaign sudah running' }, { status: 400 })
  }
  if (campaign.status === 'done') {
    return NextResponse.json({ error: 'Campaign sudah selesai' }, { status: 400 })
  }

  // Mark campaign as running
  broadcastPauseFlags.delete(campaignId)
  await admin
    .from('broadcast_campaigns')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', campaignId)

  // Return SSE stream
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // stream closed
        }
      }

      try {
        // Anti-duplicate: ambil leads yang belum dikirim untuk campaign ini
        const { data: pendingLogs, error: logsError } = await admin
          .from('broadcast_logs')
          .select('id, lead_id, phone')
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')

        if (logsError || !pendingLogs) {
          send({ type: 'error', message: 'Gagal mengambil pending logs' })
          controller.close()
          return
        }

        if (pendingLogs.length === 0) {
          send({ type: 'done', message: 'Tidak ada leads pending' })
          await admin
            .from('broadcast_campaigns')
            .update({ status: 'done', finished_at: new Date().toISOString() })
            .eq('id', campaignId)
          controller.close()
          return
        }

        send({ type: 'start', total: pendingLogs.length })

        let processedCount = 0

        for (let i = 0; i < pendingLogs.length; i++) {
          // Check pause flag
          if (broadcastPauseFlags.get(campaignId)) {
            send({ type: 'paused', sent: processedCount, remaining: pendingLogs.length - i })
            break
          }

          const log = pendingLogs[i]

          // Send WA message
          const result = await sendWhatsApp({ to: log.phone, message: campaign.message })
          const success = result.success
          processedCount++

          const now = new Date().toISOString()

          // Update broadcast_log
          await admin
            .from('broadcast_logs')
            .update({
              status: success ? 'sent' : 'failed',
              error_message: success ? null : String(result.error),
              sent_at: success ? now : null,
            })
            .eq('id', log.id)

          // Increment counter on campaign
          const counterPatch = success
            ? { sent_count: campaign.sent_count + processedCount }
            : { failed_count: campaign.failed_count + 1 }

          // Use RPC increment to avoid race condition
          if (success) {
            await admin.rpc('increment_campaign_sent', { campaign_id: campaignId })
          } else {
            await admin.rpc('increment_campaign_failed', { campaign_id: campaignId })
          }

          send({
            type: 'progress',
            index: i + 1,
            total: pendingLogs.length,
            lead_id: log.lead_id,
            phone: log.phone,
            status: success ? 'sent' : 'failed',
            error: success ? undefined : String(result.error),
          })

          // If all done
          if (i === pendingLogs.length - 1) {
            await admin
              .from('broadcast_campaigns')
              .update({ status: 'done', finished_at: now })
              .eq('id', campaignId)
            send({ type: 'done', sent: processedCount })
            break
          }

          // Cooling break every 10 messages
          if ((i + 1) % 10 === 0) {
            const cooling = randomInt(120000, 300000) // 2–5 menit
            send({ type: 'cooling', ms: cooling, message: `Cooling break ${Math.round(cooling / 1000)}s` })
            await delay(cooling)
          } else {
            // Normal interval: 15–120 detik
            const interval = randomInt(15000, 120000)
            send({ type: 'wait', ms: interval })
            await delay(interval)
          }
        }
      } catch (err: any) {
        send({ type: 'error', message: err?.message || 'Unknown error' })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
