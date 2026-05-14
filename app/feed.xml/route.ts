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

interface ProductCertification {
  authority: string
  cert_name: string
  cert_code: string
}

interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  sku: string
  affiliate_pv_value: number
  is_default: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  is_active: boolean
  has_variants: boolean
  images: string[] | null
  image_url: string | null
  sku: string | null
  gtin: string | null
  mpn: string | null
  identifier_exists: boolean | null
  google_category: string | null
  google_product_category_id: number | null
  google_product_category_path: string | null
  product_type: string | null
  material: string | null
  age_group: string | null
  gender: string | null
  categories: { name: string; slug: string } | null
  product_variants: ProductVariant[]
  product_certifications: ProductCertification[]
}

export async function GET() {
  const admin = getSupabaseAdmin()

  const { data: products, error } = await admin
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_variants(id, name, price, stock, sku, affiliate_pv_value, is_default),
      product_certifications(authority, cert_name, cert_code)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return new NextResponse('Feed generation error', { status: 500 })
  }

  const items = ((products ?? []) as unknown as Product[]).filter((p) => {
    const variantStock = (p.product_variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)
    return p.stock > 0 || variantStock > 0
  }).map((p) => {
    const slug = slugify(p.name)
    const categoryName = (p.categories?.name || 'others').toLowerCase()
    const brand = BRAND_MAP[categoryName] || 'EVC Mercato'
    const sku = p.sku || `EVC-${p.id.slice(0, 8).toUpperCase()}`
    const productUrl = `${BASE_URL}/katalog/${slug}`

    // Effective price
    const variantPrices = (p.product_variants || []).map((v) => v.price).filter((price) => price > 0)
    const effectivePrice = (p.has_variants && p.price === 0 && variantPrices.length > 0)
      ? Math.min(...variantPrices)
      : p.price

    // Images
    const imageList: string[] = []
    if (Array.isArray(p.images)) {
      p.images.filter(Boolean).forEach((img) => {
        imageList.push(img.startsWith('http') ? img : `${BASE_URL}${img}`)
      })
    } else if (p.image_url) {
      imageList.push(p.image_url.startsWith('http') ? p.image_url : `${BASE_URL}${p.image_url}`)
    }

    const mainImage = imageList[0] || ''
    const additionalImages = imageList
      .slice(1, 10) // max 9 additional (10 total)
      .map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
      .join('\n      ')

    // GTIN / identifier_exists
    const gtinFields = p.gtin
      ? `<g:gtin>${escapeXml(p.gtin)}</g:gtin>\n      <g:identifier_exists>yes</g:identifier_exists>`
      : p.mpn
      ? `<g:mpn>${escapeXml(p.mpn)}</g:mpn>\n      <g:identifier_exists>yes</g:identifier_exists>`
      : `<g:identifier_exists>no</g:identifier_exists>`

    // Google Product Category — prefer numeric ID
    const categoryField = p.google_product_category_id
      ? `<g:google_product_category>${p.google_product_category_id}</g:google_product_category>`
      : p.google_category
      ? `<g:google_product_category>${escapeXml(p.google_category)}</g:google_product_category>`
      : ''

    // Certifications
    const certFields = (p.product_certifications || []).map((cert) => `
      <g:certification>
        <g:certification_authority>${escapeXml(cert.authority)}</g:certification_authority>
        <g:certification_name>${escapeXml(cert.cert_name)}</g:certification_name>
        <g:certification_code>${escapeXml(cert.cert_code)}</g:certification_code>
      </g:certification>`).join('')

    // Optional fields
    const materialField = p.material ? `<g:material>${escapeXml(p.material)}</g:material>` : ''
    const productTypeField = p.product_type ? `<g:product_type>${escapeXml(p.product_type)}</g:product_type>` : ''
    const ageGroupField = `<g:age_group>${p.age_group || 'adult'}</g:age_group>`
    const genderField = `<g:gender>${p.gender || 'unisex'}</g:gender>`

    return `    <item>
      <g:id>${escapeXml(sku)}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
      ${additionalImages}
      <g:brand><![CDATA[${brand}]]></g:brand>
      ${gtinFields}
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${effectivePrice} IDR</g:price>
      ${categoryField}
      ${productTypeField}
      ${materialField}${certFields}
      ${ageGroupField}
      ${genderField}
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
