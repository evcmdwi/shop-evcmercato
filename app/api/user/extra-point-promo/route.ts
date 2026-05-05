import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/user/extra-point-promo
// Returns active extra point promo for the current authenticated user (if any)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { data: promo, error } = await admin
      .from('user_extra_point_promos')
      .select('multiplier, ends_at, starts_at, note')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('multiplier', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ promo: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      promo: promo
        ? { multiplier: promo.multiplier, ends_at: promo.ends_at }
        : null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
