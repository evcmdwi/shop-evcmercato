import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// DELETE /api/sambers/broadcast/[campaignId]
// Hapus campaign beserta semua log-nya
// Tidak boleh hapus campaign yang sedang running
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  const admin = getSupabaseAdmin()

  // Cek status campaign — tidak boleh hapus yang sedang running
  const { data: campaign, error: fetchError } = await admin
    .from('broadcast_campaigns')
    .select('id, status, name')
    .eq('id', campaignId)
    .single()

  if (fetchError || !campaign) {
    return NextResponse.json({ error: 'Campaign tidak ditemukan' }, { status: 404 })
  }

  if (campaign.status === 'running') {
    return NextResponse.json(
      { error: 'Campaign sedang berjalan — pause atau stop dulu sebelum menghapus' },
      { status: 409 }
    )
  }

  // Hapus broadcast_logs dulu (foreign key)
  const { error: logsError } = await admin
    .from('broadcast_logs')
    .delete()
    .eq('campaign_id', campaignId)

  if (logsError) {
    return NextResponse.json({ error: 'Gagal menghapus log campaign' }, { status: 500 })
  }

  // Hapus campaign
  const { error: campaignError } = await admin
    .from('broadcast_campaigns')
    .delete()
    .eq('id', campaignId)

  if (campaignError) {
    return NextResponse.json({ error: 'Gagal menghapus campaign' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: campaignId, name: campaign.name })
}
