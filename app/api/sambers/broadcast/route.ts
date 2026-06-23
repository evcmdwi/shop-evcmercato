import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/broadcast — list recent campaigns
export async function GET(_req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  const { data: campaigns, error } = await admin
    .from('broadcast_campaigns')
    .select('id, name, status, total_leads, sent_count, failed_count, created_at, started_at, finished_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Gagal mengambil campaigns' }, { status: 500 })

  return NextResponse.json({ campaigns: campaigns ?? [] })
}

// POST /api/sambers/broadcast — buat campaign baru + siapkan broadcast_logs
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nama, pesan, lead_ids } = body as { nama: string; pesan: string; lead_ids: string[] }

  if (!nama?.trim()) return NextResponse.json({ error: 'nama wajib diisi' }, { status: 400 })
  if (!pesan?.trim() || pesan.trim().length < 5)
    return NextResponse.json({ error: 'pesan minimal 5 karakter' }, { status: 400 })
  if (!Array.isArray(lead_ids) || lead_ids.length === 0)
    return NextResponse.json({ error: 'lead_ids wajib diisi' }, { status: 400 })
  if (lead_ids.length > 500)
    return NextResponse.json({ error: 'Maksimal 500 leads per campaign' }, { status: 400 })

  const admin = getSupabaseAdmin()

  // Fetch leads to get phone numbers
  const { data: leads, error: leadsError } = await admin
    .from('leads')
    .select('id, phone')
    .in('id', lead_ids)

  if (leadsError || !leads || leads.length === 0) {
    return NextResponse.json({ error: 'Gagal mengambil data leads' }, { status: 500 })
  }

  // Create campaign
  const { data: campaign, error: campaignError } = await admin
    .from('broadcast_campaigns')
    .insert({
      name: nama.trim(),
      message: pesan.trim(),
      status: 'draft',
      total_leads: leads.length,
    })
    .select('id')
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Gagal membuat campaign' }, { status: 500 })
  }

  // Create broadcast_logs (one per lead, status=pending)
  const logs = leads.map((l) => ({
    campaign_id: campaign.id,
    lead_id: l.id,
    phone: l.phone,
    status: 'pending',
  }))

  const { error: logsError } = await admin.from('broadcast_logs').insert(logs)
  if (logsError) {
    // Rollback campaign
    await admin.from('broadcast_campaigns').delete().eq('id', campaign.id)
    return NextResponse.json({ error: 'Gagal membuat broadcast logs' }, { status: 500 })
  }

  return NextResponse.json({ campaign_id: campaign.id, total: leads.length })
}
