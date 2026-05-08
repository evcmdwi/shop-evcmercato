import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { TERMS_VERSION } from '@/lib/constants/terms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, terms_accepted } = body as { id?: string; email?: string; terms_accepted?: boolean }

    if (!id || !email) {
      return NextResponse.json({ error: 'id and email are required' }, { status: 400 })
    }

    if (!terms_accepted) {
      return NextResponse.json(
        { error: 'Centang persetujuan Syarat & Ketentuan untuk membuat akun' },
        { status: 400 }
      )
    }

    // NOTE: public.users is populated automatically by the Supabase trigger
    // `handle_new_user` on auth.users INSERT, which reads name and phone from
    // raw_user_meta_data. Manual INSERT here caused a primary-key conflict
    // (duplicate key error) because the trigger already ran synchronously.
    // The trigger uses ON CONFLICT (id) DO NOTHING, so no data is lost.
    // This route is kept for backward-compat with the register page flow.

    // Save terms acceptance audit trail
    const admin = getSupabaseAdmin()
    await admin.from('users').update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    }).eq('id', id)

    // Check active new_user promo and grant bonus points
    const now = new Date().toISOString()
    const { data: newUserPromo } = await admin
      .from('point_promos')
      .select('id, bonus_points, title')
      .eq('promo_type', 'new_user')
      .eq('is_active', true)
      .or(`active_until.is.null,active_until.gt.${now}`)
      .gte('active_from', '2000-01-01')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (newUserPromo?.bonus_points) {
      const bonusPoints = newUserPromo.bonus_points
      await admin.from('users').update({ total_points: bonusPoints }).eq('id', id)
      await admin.from('point_transactions').insert({
        user_id: id,
        type: 'earned',
        amount: bonusPoints,
        balance_after: bonusPoints,
        notes: `Bonus member baru: ${newUserPromo.title}`,
      })
    }

    // Affiliate attribution — save referred_by permanent at registration
    try {
      const { resolveAttribution, computeFingerprint } = await import('@/lib/affiliate/tracking')
      const attribution = await resolveAttribution(request, null, admin)
      if (attribution.code) {
        await admin.from('users').update({
          referred_by_affiliate_code: attribution.code,
          referred_at: new Date().toISOString()
        }).eq('id', id)

        // Increment lifetime_members
        const { data: aff } = await admin.from('affiliates').select('id, lifetime_members').eq('affiliate_code', attribution.code).single()
        if (aff) await admin.from('affiliates').update({ lifetime_members: (aff.lifetime_members || 0) + 1 }).eq('id', aff.id)

        // Update referral_clicks: mark converted
        const fingerprint = computeFingerprint(request)
        await admin.from('referral_clicks').update({ converted_to_user_id: id })
          .eq('fingerprint_hash', fingerprint).is('converted_to_user_id', null)

        console.log('[affiliate] register via', attribution.code, 'source:', attribution.source)
        // Notify affiliate about new referral member (non-critical)
        const { notifyNewReferralMember } = await import('@/lib/affiliate/notifications')
        notifyNewReferralMember(attribution.code, id).catch(console.error)
      }
    } catch (e) { console.error('[affiliate] register attribution failed (non-critical):', e) }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
