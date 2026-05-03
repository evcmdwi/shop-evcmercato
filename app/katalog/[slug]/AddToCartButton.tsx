'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import type { Product } from '@/types/product'

interface Props {
  product: Product
}

export default function AddToCartButton({ product }: Props) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (product.stock === 0) return
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (product.stock === 0) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        style={{ backgroundColor: '#7FB300' }}
      >
        <ShoppingCart className="w-4 h-4" />
        Stok Habis
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      style={{ backgroundColor: added ? '#1D9E75' : '#7FB300' }}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          Ditambahkan ke Keranjang
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          Tambah ke Keranjang
        </>
      )}
    </button>
  )
}
