/**
 * Affiliate LP Short-Link Helper
 * Idempotent: returns existing active link or creates a new one.
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Alphanumeric chars minus visually confusable: 0, O, 1, l, I
const SAFE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
const SHORT_CODE_LENGTH = 6

function generateShortCode(): string {
  let code = ''
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }
  return code
}

export interface AffiliateLPShortLink {
  short_code: string
  url: string
}

/**
 * Returns an existing active short-link for the affiliate+LP combination,
 * or creates a new one if none exists.
 *
 * @param affiliateId  UUID of the affiliate row
 * @param lpId         UUID of the landing_pages row
 * @param affiliateCode  Affiliate referral code (e.g. "EVC-ABC123")
 * @returns            { short_code, url }
 */
export async function getOrCreateAffiliateLPShortLink(
  affiliateId: string,
  lpId: string,
  affiliateCode: string,
): Promise<AffiliateLPShortLink> {
  const supabase = getSupabaseAdmin()

  // ── 1. Check existing active link ──────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from('short_links')
    .select('short_code, target_url')
    .eq('affiliate_id', affiliateId)
    .eq('landing_page_id', lpId)
    .eq('link_type', 'landing_page')
    .eq('status', 'active')
    .maybeSingle()

  if (fetchError) {
    throw new Error(`[short-link-helper] fetch error: ${fetchError.message}`)
  }

  if (existing) {
    return {
      short_code: existing.short_code,
      url: existing.target_url,
    }
  }

  // ── 2. Fetch LP slug to build target URL ───────────────────────────────────
  const { data: lp, error: lpError } = await supabase
    .from('landing_pages')
    .select('slug')
    .eq('id', lpId)
    .single()

  if (lpError || !lp) {
    throw new Error(`[short-link-helper] landing page not found: ${lpId}`)
  }

  const targetUrl = `https://evcmercato.com/lp/${lp.slug}?ref=${affiliateCode}`

  // ── 3. Generate unique short code with collision retry ─────────────────────
  let short_code = ''
  const MAX_ATTEMPTS = 10

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateShortCode()

    const { data: collision } = await supabase
      .from('short_links')
      .select('id')
      .eq('short_code', candidate)
      .maybeSingle()

    if (!collision) {
      short_code = candidate
      break
    }
  }

  if (!short_code) {
    throw new Error('[short-link-helper] failed to generate unique short_code after max attempts')
  }

  // ── 4. Insert ───────────────────────────────────────────────────────────────
  const { data: inserted, error: insertError } = await supabase
    .from('short_links')
    .insert({
      short_code,
      affiliate_id: affiliateId,
      landing_page_id: lpId,
      link_type: 'landing_page',
      target_url: targetUrl,
      status: 'active',
      click_count: 0,
    })
    .select('short_code, target_url')
    .single()

  if (insertError) {
    // Handle race condition: if unique constraint fires, fetch the winner
    if (insertError.code === '23505') {
      const { data: winner } = await supabase
        .from('short_links')
        .select('short_code, target_url')
        .eq('affiliate_id', affiliateId)
        .eq('landing_page_id', lpId)
        .eq('link_type', 'landing_page')
        .eq('status', 'active')
        .single()

      if (winner) {
        return { short_code: winner.short_code, url: winner.target_url }
      }
    }
    throw new Error(`[short-link-helper] insert error: ${insertError.message}`)
  }

  return {
    short_code: inserted.short_code,
    url: inserted.target_url,
  }
}
