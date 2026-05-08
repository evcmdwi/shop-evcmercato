import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuthWithRole(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  // Delete cascade: channels, commissions, short_links, clicks, notifications
  await supabase.from('affiliate_channels').delete().eq('affiliate_id', id)
  await supabase.from('short_links').delete().eq('affiliate_id', id)
  await supabase.from('referral_clicks').delete().eq('affiliate_id', id)
  await supabase.from('commission_line_items').delete().in(
    'commission_id',
    (await supabase.from('commissions').select('id').eq('affiliate_id', id)).data?.map(r => r.id) ?? []
  )
  await supabase.from('commissions').delete().eq('affiliate_id', id)
  await supabase.from('notifications').delete().eq('affiliate_id', id)

  const { error } = await supabase.from('affiliates').delete().eq('id', id)
  if (error) {
    console.error('[affiliate/delete] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus affiliate' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
