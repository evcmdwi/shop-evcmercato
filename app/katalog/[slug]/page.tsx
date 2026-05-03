import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import ProductDetailClient from './ProductDetailClient'
import { slugify } from '@/lib/utils'
import type { ProductWithCategory } from '@/types/product'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamicParams = true

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createClient(url, key)
  const { data: products } = await supabase
    .from('products')
    .select('name')
    .eq('is_active', true)

  return (products ?? []).map((p: { name: string }) => ({
    slug: slugify(p.name),
  }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: products } = await supabase
    .from('products')
    .select('name, description')
    .eq('is_active', true)

  const product = (products ?? []).find(
    (p: { name: string }) => slugify(p.name) === slug
  )
  if (!product) return { title: 'Produk tidak ditemukan' }

  return {
    title: `${product.name} — EVC Mercato`,
    description: product.description ?? `Beli ${product.name} di EVC Mercato.`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      categories(*),
      product_variants (*)
    `)
    .eq('is_active', true)

  const product = (products ?? []).find(
    (p: ProductWithCategory) => slugify(p.name) === slug
  ) as ProductWithCategory | undefined

  if (!product) notFound()

  // Sort variants by sort_order, filter active only
  if (product.product_variants) {
    product.product_variants = product.product_variants
      .filter((v) => v.is_active)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailClient product={product} />
    </div>
  )
}
