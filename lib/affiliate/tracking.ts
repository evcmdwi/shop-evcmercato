/**
 * EVC Affiliate Tracking Library
 * Handles cookie, localStorage, IP fingerprint, and attribution resolution
 */

import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'evc_ref'
const COOKIE_MAX_AGE = 2592000 // 30 days in seconds
const FINGERPRINT_WINDOW_HOURS = 24
const SALT = 'EVC_SALT_2026'

// ─── Cookie Management ─────────────────────────────────────────────

export function getRefCookieFromRequest(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null
}

export function buildRefCookieHeader(affiliateCode: string): string {
  return `${COOKIE_NAME}=${affiliateCode}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`
}

// ─── IP Fingerprinting ─────────────────────────────────────────────

export function computeFingerprint(req: NextRequest): string {
  const ip = req.headers.get('cf-connecting-ip') 
    || req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown'
  const ua = req.headers.get('user-agent') || ''
  const lang = req.headers.get('accept-language') || ''
  
  return createHash('sha256')
    .update(`${ip}|${ua}|${lang}|${SALT}`)
    .digest('hex')
}

export function getClientIP(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip') 
    || req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown'
}

// ─── Attribution Resolution ────────────────────────────────────────

export interface AttributionResult {
  code: string | null
  source: 'member_binding' | 'cookie' | 'fingerprint' | 'none'
}

/**
 * Resolve affiliate attribution for a given request
 * Priority: member_binding > cookie > fingerprint
 */
export async function resolveAttribution(
  req: NextRequest,
  userId: string | null,
  adminClient: any
): Promise<AttributionResult> {
  // Priority 1: Member binding (permanent, locked at registration)
  if (userId) {
    const { data: user } = await adminClient
      .from('users')
      .select('referred_by_affiliate_code')
      .eq('id', userId)
      .single()
    
    if (user?.referred_by_affiliate_code) {
      return { code: user.referred_by_affiliate_code, source: 'member_binding' }
    }
  }

  // Priority 2: Cookie
  const cookieCode = getRefCookieFromRequest(req)
  if (cookieCode) {
    // Validate affiliate is still active
    const { data: affiliate } = await adminClient
      .from('affiliates')
      .select('status')
      .eq('affiliate_code', cookieCode)
      .single()
    
    if (affiliate?.status === 'approved') {
      return { code: cookieCode, source: 'cookie' }
    }
  }

  // Priority 3: IP Fingerprint (24h window)
  const fingerprint = computeFingerprint(req)
  const cutoff = new Date(Date.now() - FINGERPRINT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  
  const { data: click } = await adminClient
    .from('referral_clicks')
    .select('affiliate_code')
    .eq('fingerprint_hash', fingerprint)
    .gte('clicked_at', cutoff)
    .order('clicked_at', { ascending: false })
    .limit(1)
    .single()
  
  if (click?.affiliate_code) {
    return { code: click.affiliate_code, source: 'fingerprint' }
  }

  return { code: null, source: 'none' }
}

// ─── Affiliate Code Generator ──────────────────────────────────────

/**
 * Generate unique affiliate code: NAMA + 3 digits
 * e.g., "BUDI234", "SARI567"
 */
export async function generateAffiliateCode(
  fullName: string,
  adminClient: any
): Promise<string> {
  // Normalize name: take first word, uppercase, max 6 chars
  const normalized = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z\s]/g, '') // remove special chars
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .slice(0, 6)

  const baseName = normalized || 'EVC'
  
  for (let attempt = 0; attempt < 20; attempt++) {
    const digits = Math.floor(100 + Math.random() * 900).toString() // 100-999
    const code = `${baseName}${digits}`
    
    const { data: existing } = await adminClient
      .from('affiliates')
      .select('id')
      .eq('affiliate_code', code)
      .single()
    
    if (!existing) return code
  }
  
  // Fallback: shorter name + timestamp suffix
  const ts = Date.now().toString().slice(-3)
  return `${baseName.slice(0, 4)}${ts}`
}

// ─── Short Code Generator ──────────────────────────────────────────

// Exclude ambiguous characters: 0, 1, I, l, O
const SAFE_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generate unique 6-char short link code
 */
export async function generateShortCode(adminClient: any): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
    }
    
    const { data: existing } = await adminClient
      .from('short_links')
      .select('id')
      .eq('short_code', code)
      .single()
    
    if (!existing) return code
  }
  
  throw new Error('Failed to generate unique short code after 20 attempts')
}

// ─── Target URL Builder ────────────────────────────────────────────

const BASE_URL = 'https://shop.evcmercato.com'

export function buildTargetUrl(
  linkType: 'homepage' | 'product' | 'category',
  affiliateCode: string,
  slug?: string
): string {
  switch (linkType) {
    case 'homepage':
      return `${BASE_URL}/?ref=${affiliateCode}`
    case 'product':
      return `${BASE_URL}/katalog/${slug}?ref=${affiliateCode}`
    case 'category':
      return `${BASE_URL}/katalog?category=${slug}&ref=${affiliateCode}`
    default:
      return `${BASE_URL}/?ref=${affiliateCode}`
  }
}
