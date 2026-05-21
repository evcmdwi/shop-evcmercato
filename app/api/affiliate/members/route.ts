import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getSession().then(r => ({ data: { user: r.data.session?.user ?? null }, error: r.error }))
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, affiliate_code, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!affiliate) return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  if (affiliate.status !== 'approved') return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const admin = getSupabaseAdmin()
  const { data: members, error } = await admin
    .from('users')
    .select('id, name, email, created_at, total_points')
    .eq('referred_by_affiliate_code', affiliate.affiliate_code)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mask email & name for privacy
  const masked = (members ?? []).map((m) => {
    const nameParts = (m.name || '').split(' ')
    const maskedName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0] || 'Member'
    const emailParts = (m.email || '').split('@')
    const maskedEmail = emailParts[0].slice(0, 3) + '***@' + (emailParts[1] || '')
    return {
      id: m.id,
      name: maskedName,
      email: maskedEmail,
      joined_at: m.created_at,
      total_points: m.total_points ?? 0,
    }
  })

  return NextResponse.json({ members: masked, total: masked.length })
}
