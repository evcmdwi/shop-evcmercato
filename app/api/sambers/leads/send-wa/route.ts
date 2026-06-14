import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lead_id, message } = body

  if (!lead_id || !message?.trim()) {
    return NextResponse.json({ error: 'lead_id dan message wajib diisi' }, { status: 400 })
  }
  if (message.trim().length < 5) {
    return NextResponse.json({ error: 'Pesan minimal 5 karakter' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Get lead
  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('id, nama, phone')
    .eq('id', lead_id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
  }

  // Send WA
  const result = await sendWhatsApp({ to: lead.phone, message: message.trim() })

  const status = result.success ? 'sent' : 'failed'

  // Save to lead_messages
  const { error: insertError } = await admin
    .from('lead_messages')
    .insert({ lead_id, message: message.trim(), status })

  if (insertError) {
    console.error('[send-wa] failed to save lead_message:', insertError)
  }

  if (!result.success) {
    return NextResponse.json({ success: false, error: 'Gagal mengirim WA' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
