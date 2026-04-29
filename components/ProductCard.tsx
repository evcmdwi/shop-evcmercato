'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Gift } from 'lucide-react'
import { formatRupiah, formatPriceRange, getTotalStock, formatSoldCount, slugify } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    has_variants: boolean
    images: string[] | null
    image_url?: string | null
    categories?: { name: string; slug: string } | null
    initial_sold_count?: number
    total_sold?: number
  }
  variants?: { price: number; stock: number; is_active: boolean }[]
}

export default function ProductCard({ product, variants }: ProductCardProps) {
  const slug = slugify(product.name)

  const displayPrice = product.has_variants && variants?.length
    ? formatPriceRange(variants)
    : formatRupiah(product.price)

  const totalStock = product.has_variants && variants?.length
    ? getTotalStock(variants)
    : product.stock

  const isOutOfStock = totalStock === 0

  const soldCount = product.total_sold ?? product.initial_sold_count ?? 0

  return (
    <Link
      href={`/katalog/${slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#EEEDFE' }}>
            <ShoppingCart className="w-12 h-12 opacity-30" style={{ color: '#534AB7' }} />
          </div>
        )}
        {/* Category badge */}
        {product.categories && (
          <span
            className="absolute top-2 left-2 text-xs font-medium px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: '#534AB7' }}
          >
            {product.categories.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 group-hover:text-[#534AB7] transition-colors">
          {product.name}
        </h3>

        <p className="text-lg font-bold mt-auto" style={{ color: '#534AB7' }}>
          {displayPrice}
        </p>

        <span className="text-xs text-gray-500">{formatSoldCount(soldCount)}</span>

        {!isOutOfStock && totalStock <= 5 && (
          <p className="text-xs text-orange-500">Stok tersisa {totalStock}</p>
        )}
        {isOutOfStock && (
          <p className="text-xs text-red-500">Stok habis</p>
        )}

        <div className="flex gap-2 mt-1">
          <button
            onClick={(e) => e.preventDefault()}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#534AB7' }}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isOutOfStock ? 'Stok Habis' : 'Beli'}
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-emerald-50"
            style={{ borderColor: '#1D9E75', color: '#1D9E75' }}
          >
            <Gift className="w-3.5 h-3.5" />
            Tukar Points
          </button>
        </div>
      </div>
    </Link>
  )
}
