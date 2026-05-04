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

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
