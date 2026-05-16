import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createHash, randomUUID } from 'node:crypto'

const SHOP_HOME = 'https://shop.evcmercato.com/'
const LP_BASE = 'https://evcmercato.com/lp/'
const SESSION_COOKIE = 'evc_session'
const SESSION_MAX_AGE = 60 * 24 * 60 * 60 // 60 days in seconds

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

async function logClick(params: {
  shortLinkId: string
  affiliateId: string | null
  landingPageId: string | null
  ipHash: string
  userAgent: string
  referrer: string
  visitorSessionId: string
}): Promise<void> {
  const admin = getSupabaseAdmin()

  // Insert click row
  await admin.from('short_link_clicks').insert({
    short_link_id: params.shortLinkId,
    affiliate_id: params.affiliateId,
    landing_page_id: params.landingPageId,
    ip_hash: params.ipHash,
    user_agent: params.userAgent || null,
    referrer: params.referrer || null,
    visitor_session_id: params.visitorSessionId,
    clicked_at: new Date().toISOString(),
  })

  // Increment click_count: fetch + update (simple, avoids needing a DB function)
  const { data: linkRow } = await admin
    .from('short_links')
    .select('click_count')
    .eq('id', params.shortLinkId)
    .single()

  await admin
    .from('short_links')
    .update({
      click_count: (linkRow?.click_count ?? 0) + 1,
      last_clicked_at: new Date().toISOString(),
    })
    .eq('id', params.shortLinkId)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const admin = getSupabaseAdmin()

  const { data: link } = await admin
    .from('short_links')
    .select(`
      id,
      short_code,
      link_type,
      target_url,
      status,
      landing_page_id,
      affiliate_id,
      affiliates:affiliate_id (
        id,
        code,
        status
      ),
      landing_pages:landing_page_id (
        id,
        slug,
        status
      )
    `)
    .eq('short_code', code)
    .eq('status', 'active')
    .maybeSingle()

  if (!link) {
    return NextResponse.redirect(SHOP_HOME, { status: 302 })
  }

  // Determine affiliate ref
  const affiliate = Array.isArray(link.affiliates) ? link.affiliates[0] : link.affiliates
  let attributeRef: string | null = affiliate?.code ?? null
  if (affiliate?.status === 'suspended' || affiliate?.status === 'banned') {
    attributeRef = null
  }

  // Resolve target URL
  const lp = Array.isArray(link.landing_pages) ? link.landing_pages[0] : link.landing_pages
  let target: string

  if (link.link_type === 'landing_page') {
    if (!lp || lp.status === 'archived') {
      target = SHOP_HOME
    } else {
      target = `${LP_BASE}${lp.slug}`
    }
  } else {
    target = link.target_url ?? SHOP_HOME
  }

  // Append ?ref= if applicable
  if (attributeRef) {
    const separator = target.includes('?') ? '&' : '?'
    target = `${target}${separator}ref=${encodeURIComponent(attributeRef)}`
  }

  // Session cookie
  const existingSession = req.cookies.get(SESSION_COOKIE)?.value
  const isNewSession = !existingSession
  const visitorSessionId = existingSession || randomUUID()

  // IP and headers
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  const ipHash = hashIp(ip)
  const userAgent = req.headers.get('user-agent') || ''
  const referrer = req.headers.get('referer') || ''

  // Fire-and-forget click logging
  logClick({
    shortLinkId: link.id,
    affiliateId: link.affiliate_id ?? null,
    landingPageId: link.landing_page_id ?? null,
    ipHash,
    userAgent,
    referrer,
    visitorSessionId,
  }).catch(() => {
    // Silent — don't block redirect
  })

  // Build response
  const response = NextResponse.redirect(target, { status: 302 })

  if (isNewSession) {
    response.cookies.set(SESSION_COOKIE, visitorSessionId, {
      maxAge: SESSION_MAX_AGE,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}
