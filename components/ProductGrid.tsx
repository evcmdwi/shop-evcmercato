import ProductCard from './ProductCard'
import type { ProductWithCategory } from '@/types/product'
import { Package } from 'lucide-react'

interface ProductGridProps {
  products: ProductWithCategory[]
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {Array(8).fill(0).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-2 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E8F4D1' }}>
          <Package className="w-10 h-10" style={{ color: '#7FB300' }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Produk tidak ditemukan</h3>
        <p className="text-sm text-gray-400">Coba kata kunci atau kategori yang berbeda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variants={product.product_variants}
        />
      ))}
    </div>
  )
}
