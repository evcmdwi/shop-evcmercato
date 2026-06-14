import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'

function applyTemplate(template: string, lead: { nama: string; kota: string | null; interest: string | null }) {
  return template
    .replace(/\{Nama\}/g, lead.nama || '')
    .replace(/\{Kota\}/g, lead.kota || '')
    .replace(/\{Interest\}/g, lead.interest || '')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lead_ids, template } = body

  if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids wajib diisi' }, { status: 400 })
  }
  if (!template?.trim()) {
    return NextResponse.json({ error: 'template wajib diisi' }, { status: 400 })
  }
  if (lead_ids.length > 50) {
    return NextResponse.json({ error: 'Maksimal 50 leads per broadcast' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Fetch all leads
  const { data: leads, error: leadsError } = await admin
    .from('leads')
    .select('id, nama, phone, kota, interest')
    .in('id', lead_ids)

  if (leadsError || !leads) {
    return NextResponse.json({ error: 'Gagal mengambil data leads' }, { status: 500 })
  }

  let sent = 0
  let failed = 0
  const results: { lead_id: string; nama: string; status: 'sent' | 'failed'; error?: string }[] = []

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const message = applyTemplate(template, lead)

    const waResult = await sendWhatsApp({ to: lead.phone, message })
    const status: 'sent' | 'failed' = waResult.success ? 'sent' : 'failed'

    if (waResult.success) {
      sent++
    } else {
      failed++
    }

    results.push({ lead_id: lead.id, nama: lead.nama, status, error: waResult.success ? undefined : String(waResult.error) })

    // Save to lead_messages
    await admin.from('lead_messages').insert({ lead_id: lead.id, message, status })

    // Delay between messages (except last)
    if (i < leads.length - 1) {
      await delay(1500)
    }
  }

  return NextResponse.json({ sent, failed, results })
}
