import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/sambers/broadcast/campaigns — buat campaign baru
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, message, lead_ids } = body as {
    name: string
    message: string
    lead_ids: string[]
  }

  if (!name?.trim()) return NextResponse.json({ error: 'name wajib diisi' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'message wajib diisi' }, { status: 400 })
  if (!Array.isArray(lead_ids) || lead_ids.length === 0)
    return NextResponse.json({ error: 'lead_ids wajib diisi (array)' }, { status: 400 })

  const admin = getSupabaseAdmin()

  // Fetch leads to get phone numbers, exclude converted (already members)
  const { data: validLeads, error: leadsError } = await admin
    .from('leads')
    .select('id, phone')
    .in('id', lead_ids)
    .neq('status', 'converted')

  if (leadsError || !validLeads) {
    return NextResponse.json({ error: 'Gagal mengambil data leads' }, { status: 500 })
  }

  // Count excluded converted leads for info
  const excludedCount = lead_ids.length - validLeads.length
  const leads = validLeads

  // Create campaign
  const { data: campaign, error: campaignError } = await admin
    .from('broadcast_campaigns')
    .insert({ name, message, total_leads: leads.length })
    .select()
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Gagal membuat campaign', detail: campaignError?.message }, { status: 500 })
  }

  // Insert broadcast_logs for each lead (ON CONFLICT DO NOTHING for safety)
  const logRows = leads.map((lead) => ({
    campaign_id: campaign.id,
    lead_id: lead.id,
    phone: lead.phone,
    status: 'pending',
  }))

  const { error: logError } = await admin
    .from('broadcast_logs')
    .upsert(logRows, { onConflict: 'campaign_id,lead_id', ignoreDuplicates: true })

  if (logError) {
    return NextResponse.json({ error: 'Gagal membuat log broadcast', detail: logError.message }, { status: 500 })
  }

  return NextResponse.json({ campaign, excluded_converted: excludedCount }, { status: 201 })
}

// GET /api/sambers/broadcast/campaigns — list semua campaign + progress
export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  const { data: campaigns, error } = await admin
    .from('broadcast_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data campaigns', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ campaigns })
}
