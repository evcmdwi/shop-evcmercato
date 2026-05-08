import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }
  if (auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super_admin only' }, { status: 403 })
  }

  let body: { period_start: string; period_end: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { period_start, period_end } = body
  if (!period_start || !period_end) {
    return NextResponse.json({ error: 'period_start and period_end are required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // 1. Fetch valid commissions in period
  const { data: validCommissions, error: fetchError } = await admin
    .from('commissions')
    .select(`
      id,
      affiliate_id,
      order_id,
      pv_earned,
      status,
      valid_at,
      affiliates (
        affiliate_code,
        full_name_kkd,
        kki_member_id,
        user_id
      ),
      orders (
        total_price
      )
    `)
    .eq('status', 'valid')
    .gte('valid_at', `${period_start}T00:00:00.000Z`)
    .lte('valid_at', `${period_end}T23:59:59.999Z`)

  if (fetchError) {
    console.error('[settlement/generate] fetch valid commissions error:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }

  // 2. Fetch owed_back commissions in period
  const { data: owedCommissions } = await admin
    .from('commissions')
    .select('id, affiliate_id, pv_earned')
    .eq('status', 'owed_back')
    .gte('valid_at', `${period_start}T00:00:00.000Z`)
    .lte('valid_at', `${period_end}T23:59:59.999Z`)

  // 3. Build affiliate map
  const affiliateMap = new Map<string, {
    affiliate_code: string
    full_name_kkd: string
    kki_member_id: string | null
    user_id: string
    commission_ids: string[]
    total_pv: number
    owed_back_pv: number
  }>()

  for (const c of validCommissions ?? []) {
    const affRaw = c.affiliates; const aff = (Array.isArray(affRaw) ? affRaw[0] : affRaw) as { affiliate_code: string; full_name_kkd: string; kki_member_id: string | null; user_id: string } | null
    if (!aff) continue
    if (!affiliateMap.has(c.affiliate_id)) {
      affiliateMap.set(c.affiliate_id, {
        affiliate_code: aff.affiliate_code,
        full_name_kkd: aff.full_name_kkd,
        kki_member_id: aff.kki_member_id,
        user_id: aff.user_id,
        commission_ids: [],
        total_pv: 0,
        owed_back_pv: 0,
      })
    }
    const entry = affiliateMap.get(c.affiliate_id)!
    entry.commission_ids.push(c.id)
    entry.total_pv += c.pv_earned
  }

  // Apply owed_back
  for (const c of owedCommissions ?? []) {
    if (affiliateMap.has(c.affiliate_id)) {
      affiliateMap.get(c.affiliate_id)!.owed_back_pv += c.pv_earned
    }
  }

  const totalPv = Array.from(affiliateMap.values()).reduce(
    (s, a) => s + Math.max(0, a.total_pv - a.owed_back_pv),
    0
  )
  const periodLabel = `Periode ${period_start} - ${period_end}`

  // 4. Create settlement record
  const { data: settlement, error: settlementError } = await admin
    .from('settlements')
    .insert({
      period_start,
      period_end,
      period_label: periodLabel,
      settlement_date: period_end,
      total_affiliates: affiliateMap.size,
      total_pv: totalPv,
      status: 'finalized',
      generated_by: auth.userId,
    })
    .select()
    .single()

  if (settlementError || !settlement) {
    console.error('[settlement/generate] create settlement error:', settlementError)
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 })
  }

  const settlementId = settlement.id

  // 5. Create settlement_details and update commissions
  const settlementDetails: { settlement_id: string; affiliate_id: string; net_pv: number; total_pv: number; owed_back_pv: number }[] = []

  for (const [affiliateId, data] of affiliateMap.entries()) {
    const netPv = Math.max(0, data.total_pv - data.owed_back_pv)

    // Insert settlement_detail
    await admin.from('settlement_details').insert({
      settlement_id: settlementId,
      affiliate_id: affiliateId,
      total_pv: data.total_pv,
      owed_back_pv: data.owed_back_pv,
      net_pv: netPv,
    })

    // Mark valid commissions as settled
    if (data.commission_ids.length > 0) {
      await admin
        .from('commissions')
        .update({ status: 'settled', settlement_id: settlementId })
        .in('id', data.commission_ids)
    }

    // Mark owed_back commissions as settled too
    const owedIds = (owedCommissions ?? [])
      .filter(c => c.affiliate_id === affiliateId)
      .map(c => c.id)
    if (owedIds.length > 0) {
      await admin
        .from('commissions')
        .update({ status: 'settled', settlement_id: settlementId })
        .in('id', owedIds)
    }

    settlementDetails.push({ settlement_id: settlementId, affiliate_id: affiliateId, net_pv: netPv, total_pv: data.total_pv, owed_back_pv: data.owed_back_pv })
  }

  // 6. Send WA notifications
  for (const detail of settlementDetails) {
    const affData = affiliateMap.get(detail.affiliate_id)
    if (!affData) continue

    const { data: user } = await admin
      .from('users')
      .select('phone, name')
      .eq('id', affData.user_id)
      .single()

    if (user?.phone) {
      const msg = `✅ Settlement ${periodLabel} telah diproses!\n\nTotal PV Anda periode ini: ${detail.net_pv.toLocaleString('id-ID')}\n\nStatus: Sudah masuk ke ID KKI Anda\n\nCek di dashboard: shop.evcmercato.com → Affiliate → Settlement\n\n— Tim EVC Mercato`
      sendWhatsApp({ to: user.phone, message: msg }).catch(console.error)
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shop.evcmercato.com'

  return NextResponse.json({
    settlement_id: settlementId,
    total_affiliates: affiliateMap.size,
    total_pv: totalPv,
    excel_url: `${baseUrl}/api/sambers/settlement/${settlementId}/export-excel`,
    csv_url: `${baseUrl}/api/sambers/settlement/${settlementId}/export-csv`,
  })
}
