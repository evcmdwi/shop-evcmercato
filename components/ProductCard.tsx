'use client'
import Image from 'next/image'
import Link from 'next/link'
import { formatRupiah, formatSoldCount, formatPriceRange, getTotalStock } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    stock: number
    has_variants: boolean
    images?: string[] | null
    image_url?: string | null
    initial_sold_count?: number
    total_sold?: number
    categories?: { name: string; slug: string } | null
  }
  variants?: { price: number; stock: number; is_active: boolean }[]
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function ProductCard({ product, variants }: ProductCardProps) {
  const slug = slugify(product.name)
  const detailUrl = `/katalog/${slug}`

  // Price display
  const displayPrice = product.has_variants && variants?.length
    ? formatPriceRange(variants)
    : formatRupiah(product.price)

  // Stock
  const totalStock = product.has_variants && variants?.length
    ? getTotalStock(variants)
    : product.stock
  const isLowStock = totalStock > 0 && totalStock <= 5
  const isOutOfStock = totalStock === 0

  // Sold count
  const soldCount = product.total_sold ?? product.initial_sold_count ?? 0

  // Image
  const imageSrc = product.images?.[0] || product.image_url || null

  return (
    <Link href={detailUrl} className="block group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98]">

        {/* Image 1:1 square */}
        <div className="relative aspect-square bg-gray-100">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">Stok Habis</span>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="p-2">
          {/* Product name - 2 lines max */}
          <p className="text-[15px] font-semibold text-gray-800 line-clamp-2 leading-tight mb-1.5 min-h-[2.2em]">
            {product.name}
          </p>

          {/* Price */}
          <p className="text-[15px] font-bold text-[#534AB7] leading-tight mb-1.5">
            {displayPrice}
          </p>

          {/* PROMO ONGKIR badge */}
          <div className="flex items-center gap-1 mb-1.5">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
              📦 PROMO ONGKIR
            </span>
          </div>

          {/* Stats: FAST badge + sold + low stock */}
          <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-1">
            {/* FAST badge - motion lines only */}
            <span className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full" style={{fontSize:'10px', letterSpacing:'0.5px'}}>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <rect className="fast-line-1" x="0" y="0.5" width="5" height="1.2" rx="0.6" fill="#16A34A" opacity="0.5"/>
                <rect className="fast-line-2" x="0" y="3.5" width="8" height="1.2" rx="0.6" fill="#16A34A" opacity="0.8"/>
                <rect className="fast-line-3" x="0" y="6.5" width="4" height="1.2" rx="0.6" fill="#16A34A" opacity="0.5"/>
                <style>{`
                  .fast-line-1 { animation: fastSlide 1.2s ease-in-out infinite; }
                  .fast-line-2 { animation: fastSlide 1.2s ease-in-out infinite 0.2s; }
                  .fast-line-3 { animation: fastSlide 1.2s ease-in-out infinite 0.4s; }
                  @keyframes fastSlide {
                    0%, 100% { transform: translateX(0); opacity: 0.3; }
                    50% { transform: translateX(2px); opacity: 0.9; }
                  }
                `}</style>
              </svg>
              FAST
            </span>
            <span className="text-gray-300">•</span>
            {isLowStock ? (
              <span className="text-orange-600 font-medium">Stok tersisa {totalStock}</span>
            ) : null}
            {soldCount > 0 ? (
              <span>⭐ 5.0 • {formatSoldCount(soldCount)}</span>
            ) : (
              <span className="text-gray-400">Baru</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
