import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const BASE_URL = 'https://shop.evcmercato.com'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const CATEGORY_MAP: Record<string, string> = {
  'natesh': 'Health & Beauty > Personal Care',
  'fitsol': 'Health & Beauty > Health Care > Fitness & Nutrition',
  'suplemen': 'Health & Beauty > Health Care > Vitamins & Supplements',
  'kecantikan': 'Health & Beauty > Personal Care > Cosmetics',
  'others': 'Health & Beauty',
}

const BRAND_MAP: Record<string, string> = {
  'natesh': 'Natesh',
  'fitsol': 'FITSOL',
  'suplemen': 'Suplemen KKI',
  'kecantikan': 'EVC Mercato',
  'others': 'KKI Group',
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET() {
  const admin = getSupabaseAdmin()

  const { data: products, error } = await admin
    .from('products')
    .select(`
      id, name, description, price, stock, is_active,
      images, image_url, sku,
      categories!inner ( name )
    `)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('sort_order', { ascending: true })

  if (error) {
    return new NextResponse('Feed generation error', { status: 500 })
  }

  const items = (products ?? []).map((p: any) => {
    const slug = slugify(p.name)
    const categoryName = (p.categories?.name || 'others').toLowerCase()
    const brand = BRAND_MAP[categoryName] || 'EVC Mercato'
    const googleCategory = CATEGORY_MAP[categoryName] || 'Health & Beauty'
    const sku = p.sku || `EVC-${p.id.slice(0, 8).toUpperCase()}`
    const productUrl = `${BASE_URL}/katalog/${slug}`

    // Get images
    const imageList: string[] = []
    if (Array.isArray(p.images)) {
      p.images.filter(Boolean).forEach((img: string) => {
        imageList.push(img.startsWith('http') ? img : `${BASE_URL}${img}`)
      })
    } else if (p.image_url) {
      imageList.push(p.image_url.startsWith('http') ? p.image_url : `${BASE_URL}${p.image_url}`)
    }

    const mainImage = imageList[0] || ''
    const additionalImages = imageList.slice(1, 11)

    return `    <item>
      <g:id>${escapeXml(sku)}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
      ${additionalImages.map((img: string) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n      ')}
      <g:availability>in_stock</g:availability>
      <g:price>${p.price} IDR</g:price>
      <g:condition>new</g:condition>
      <g:brand><![CDATA[${brand}]]></g:brand>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>ID</g:country>
        <g:service>Reguler JNT</g:service>
        <g:price>10000 IDR</g:price>
      </g:shipping>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>EVC Mercato Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Mitra Usaha Resmi KKI Group sejak 2003</description>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
