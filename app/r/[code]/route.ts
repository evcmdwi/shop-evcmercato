import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { computeFingerprint, getClientIP, buildRefCookieHeader } from '@/lib/affiliate/tracking'

const BASE_URL = 'https://shop.evcmercato.com'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const admin = getSupabaseAdmin()

  // Lookup short link
  const { data: link } = await admin
    .from('short_links')
    .select('*, affiliates!inner(status, affiliate_code)')
    .eq('short_code', code)
    .eq('status', 'active')
    .single()

  // Invalid or inactive → redirect to homepage
  if (!link || link.affiliates?.status !== 'approved') {
    return NextResponse.redirect(BASE_URL)
  }

  const affiliateCode = link.affiliates.affiliate_code
  const fingerprint = computeFingerprint(req)

  // Record click (fire and forget)
  void Promise.resolve(admin.from('referral_clicks').insert({
    short_link_id: link.id,
    affiliate_code: affiliateCode,
    ip_address: getClientIP(req),
    user_agent: req.headers.get('user-agent') || '',
    fingerprint_hash: fingerprint,
  })).then(async () => {
    // Increment click count
    await admin.from('short_links')
      .update({ 
        click_count: (link.click_count || 0) + 1,
        last_clicked_at: new Date().toISOString()
      })
      .eq('id', link.id)
  }).catch(console.error)

  // Set affiliate cookie + redirect
  const response = NextResponse.redirect(link.target_url)
  response.headers.set('Set-Cookie', buildRefCookieHeader(affiliateCode))
  
  return response
}
