import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    full_name_kkd?: string
    kki_member_id?: string
    director_leader?: string
    whatsapp?: string
    email?: string
    channels?: { platform: string; link_or_username?: string }[]
    agreement_kki_ethics?: boolean
    agreement_no_medical_claim?: boolean
    agreement_terms?: boolean
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    full_name_kkd,
    kki_member_id,
    director_leader,
    whatsapp,
    email,
    channels,
    agreement_kki_ethics,
    agreement_no_medical_claim,
    agreement_terms,
  } = body

  // Validate required fields
  if (!full_name_kkd || !kki_member_id || !director_leader || !whatsapp || !email || !channels || channels.length === 0) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
  }

  // Validate agreements
  if (!agreement_kki_ethics || !agreement_no_medical_claim || !agreement_terms) {
    return NextResponse.json({ error: 'Semua persetujuan harus dicentang' }, { status: 400 })
  }

  // Check existing affiliate record
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Anda sudah memiliki pengajuan affiliate', status: existing.status },
      { status: 409 }
    )
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Insert affiliate record
  const { data: affiliate, error: insertError } = await adminClient
    .from('affiliates')
    .insert({
      user_id: user.id,
      full_name_kkd,
      kki_member_id,
      director_leader,
      whatsapp,
      email,
      agreement_kki_ethics: true,
      agreement_no_medical_claim: true,
      agreement_terms: true,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !affiliate) {
    console.error('[affiliate/apply] insert error:', insertError)
    return NextResponse.json({ error: 'Gagal menyimpan data affiliate' }, { status: 500 })
  }

  // Insert affiliate channels
  if (channels.length > 0) {
    const channelRows = channels.map((ch) => ({
      affiliate_id: affiliate.id,
      platform: ch.platform,
      link_or_username: ch.link_or_username ?? null,
    }))

    const { error: chanError } = await adminClient
      .from('affiliate_channels')
      .insert(channelRows)

    if (chanError) {
      console.error('[affiliate/apply] channels insert error:', chanError)
      // non-fatal, continue
    }
  }

  // Notify admins (super_admin role)
  const { data: admins } = await adminClient
    .from('profiles')
    .select('id')
    .in('role', ['admin_evc', 'super_admin'])

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      type: 'affiliate_application',
      title: 'Pengajuan Affiliate Baru',
      message: `${full_name_kkd} mengajukan program affiliate (KKI: ${kki_member_id})`,
      data: { affiliate_id: affiliate.id, applicant_user_id: user.id },
      is_read: false,
    }))

    await adminClient.from('notifications').insert(notifications)
  }

  return NextResponse.json({ affiliate_id: affiliate.id, status: 'pending' }, { status: 201 })
}
