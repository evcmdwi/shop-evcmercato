import ProductCard from './ProductCard'
import type { ProductWithCategory } from '@/types/product'
import { Package } from 'lucide-react'

interface ProductGridProps {
  products: ProductWithCategory[]
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-6 bg-gray-100 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
          <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#EEEDFE' }}>
          <Package className="w-10 h-10" style={{ color: '#534AB7' }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Produk tidak ditemukan</h3>
        <p className="text-sm text-gray-400">Coba kata kunci atau kategori yang berbeda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
