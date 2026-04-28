import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import AddToCartButton from './AddToCartButton'
import { formatRupiah, slugify } from '@/lib/utils'
import { Tag, Package, ArrowLeft, Gift } from 'lucide-react'
import type { ProductWithCategory } from '@/types/product'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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
    description: product.description ?? `Beli ${product.name} di EVC Mercato Balikpapan.`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('is_active', true)

  const product = (products ?? []).find(
    (p: ProductWithCategory) => slugify(p.name) === slug
  ) as ProductWithCategory | undefined

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/katalog" className="flex items-center gap-1 hover:text-[#534AB7] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Katalog
          </Link>
          <span>/</span>
          <span className="text-gray-700 truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#EEEDFE' }}>
                <Package className="w-20 h-20 opacity-30" style={{ color: '#534AB7' }} />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            {/* Category */}
            {product.categories && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" style={{ color: '#534AB7' }} />
                <span className="text-sm font-medium" style={{ color: '#534AB7' }}>
                  {product.categories.name}
                </span>
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

            <p className="text-3xl font-bold" style={{ color: '#534AB7' }}>
              {formatRupiah(product.price)}
            </p>

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Stok:</span>
              {product.stock > 5 ? (
                <span className="font-medium text-green-600">{product.stock} tersedia</span>
              ) : product.stock > 0 ? (
                <span className="font-medium text-orange-500">Tersisa {product.stock}</span>
              ) : (
                <span className="font-medium text-red-500">Habis</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-2">
              <AddToCartButton product={product} />
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-colors cursor-not-allowed opacity-60"
                style={{ borderColor: '#1D9E75', color: '#1D9E75' }}
              >
                <Gift className="w-4 h-4" />
                Tukar dengan Points
              </button>
            </div>

            {/* EVC Points info */}
            <div className="mt-2 p-3 rounded-xl text-sm" style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
              💎 Kumpulkan <strong>{Math.floor(product.price / 1000)} EVC Points</strong> dari pembelian ini
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
