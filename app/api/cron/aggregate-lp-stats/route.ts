import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const CRON_SECRET = 'evc_cron_2026'
const WIB_OFFSET_HOURS = 7 // UTC+7

function getYesterdayRangeWIB(): { start: string; end: string; dateStr: string } {
  const now = new Date()
  // Current date in WIB
  const wibNow = new Date(now.getTime() + WIB_OFFSET_HOURS * 3600 * 1000)

  // Yesterday in WIB
  const wibYesterday = new Date(wibNow)
  wibYesterday.setUTCDate(wibYesterday.getUTCDate() - 1)

  const year = wibYesterday.getUTCFullYear()
  const month = String(wibYesterday.getUTCMonth() + 1).padStart(2, '0')
  const day = String(wibYesterday.getUTCDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  // Yesterday 00:00 WIB = yesterday 00:00 - 7h UTC
  const startUTC = new Date(`${dateStr}T00:00:00.000+07:00`)
  const endUTC = new Date(`${dateStr}T23:59:59.999+07:00`)

  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString(),
    dateStr,
  }
}

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { start, end, dateStr } = getYesterdayRangeWIB()

  // Fetch all short_links with link_type='landing_page'
  const { data: links, error: linksErr } = await admin
    .from('short_links')
    .select('id, landing_page_id')
    .eq('link_type', 'landing_page')
    .not('landing_page_id', 'is', null)

  if (linksErr) {
    return NextResponse.json({ error: linksErr.message }, { status: 500 })
  }

  if (!links || links.length === 0) {
    return NextResponse.json({ processed: 0, date: dateStr })
  }

  let processed = 0

  for (const link of links) {
    const { data: clicks, error: clicksErr } = await admin
      .from('short_link_clicks')
      .select('id, resulted_in_register_user_id, resulted_in_order_id')
      .eq('short_link_id', link.id)
      .gte('clicked_at', start)
      .lte('clicked_at', end)

    if (clicksErr) continue

    const clickCount = clicks?.length ?? 0
    const signupCount = clicks?.filter((c) => c.resulted_in_register_user_id != null).length ?? 0
    const orderCount = clicks?.filter((c) => c.resulted_in_order_id != null).length ?? 0

    // UPSERT idempotent by (landing_page_id, short_link_id, stat_date)
    const { error: upsertErr } = await admin
      .from('landing_page_daily_stats')
      .upsert(
        {
          landing_page_id: link.landing_page_id,
          short_link_id: link.id,
          stat_date: dateStr,
          click_count: clickCount,
          signup_count: signupCount,
          order_count: orderCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'landing_page_id,short_link_id,stat_date' }
      )

    if (!upsertErr) {
      processed++
    }
  }

  return NextResponse.json({ processed, date: dateStr })
}
