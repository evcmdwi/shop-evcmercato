import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await admin.from('referral_clicks').delete({ count: 'exact' }).lt('clicked_at', ninetyDaysAgo).is('converted_to_user_id', null)

  console.log(`[cron] affiliate cleanup-clicks: ${count} deleted`)
  return NextResponse.json({ deleted: count || 0, error: error?.message })
}
