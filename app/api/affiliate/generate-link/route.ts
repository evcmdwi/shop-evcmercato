import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateShortCode, buildTargetUrl } from '@/lib/affiliate/tracking'
import type { ShortLinkType } from '@/types/affiliate'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify affiliate is approved
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, status, affiliate_code')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json(
      { error: 'Hanya affiliate yang disetujui dapat membuat link' },
      { status: 403 }
    )
  }

  let body: { link_type?: string; target_id?: string; slug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { link_type, slug } = body

  const validLinkTypes: ShortLinkType[] = ['homepage', 'product', 'category']
  if (!link_type || !validLinkTypes.includes(link_type as ShortLinkType)) {
    return NextResponse.json(
      { error: 'link_type harus salah satu dari: homepage, product, category' },
      { status: 400 }
    )
  }

  if ((link_type === 'product' || link_type === 'category') && !slug) {
    return NextResponse.json(
      { error: `slug wajib diisi untuk link_type '${link_type}'` },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const shortCode = await generateShortCode(adminClient)
  const targetUrl = buildTargetUrl(link_type as ShortLinkType, affiliate.affiliate_code!, slug)
  const shortUrl = `https://shop.evcmercato.com/r/${shortCode}`

  const { error: insertError } = await adminClient
    .from('short_links')
    .insert({
      short_code: shortCode,
      affiliate_id: affiliate.id,
      link_type,
      target_id: body.target_id ?? null,
      target_url: targetUrl,
      click_count: 0,
      status: 'active',
    })

  if (insertError) {
    console.error('[affiliate/generate-link] insert error:', insertError)
    return NextResponse.json({ error: 'Gagal menyimpan link' }, { status: 500 })
  }

  return NextResponse.json({ short_code: shortCode, short_url: shortUrl, target_url: targetUrl })
}
