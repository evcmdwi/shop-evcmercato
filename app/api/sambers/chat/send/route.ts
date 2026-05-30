import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  let body: { user_id?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_id, message } = body

  if (!user_id || !message) {
    return NextResponse.json({ error: 'user_id and message are required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Get user: name, phone
  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, name, phone')
    .eq('id', user_id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })
  }

  if (!user.phone) {
    return NextResponse.json({ error: 'Member tidak memiliki nomor HP' }, { status: 422 })
  }

  // Send WA
  const waResult = await sendWhatsApp({ to: user.phone, message })
  const status = waResult.success ? 'sent' : 'failed'
  const error_detail = waResult.success
    ? null
    : typeof waResult.error === 'string'
      ? waResult.error
      : (waResult.error as any)?.message ?? 'Unknown error'

  // Insert into admin_messages regardless of send result
  const { data: inserted, error: insertError } = await admin
    .from('admin_messages')
    .insert({
      user_id,
      message,
      sent_by: 'admin',
      status,
      error_detail,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[POST /api/sambers/chat/send] insert error:', insertError)
    return NextResponse.json({ error: 'Gagal menyimpan pesan' }, { status: 500 })
  }

  if (!waResult.success) {
    return NextResponse.json(
      {
        success: false,
        message_id: inserted.id,
        error: error_detail,
      },
      { status: 200 }
    )
  }

  return NextResponse.json({ success: true, message_id: inserted.id })
}
