'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartContext } from '@/components/CartContext'
import type { Cart, CartItem } from '@/hooks/useCart'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

// Skeleton row
function CartItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function KeranjangPage() {
  const router = useRouter()
  const { refreshCart } = useCartContext()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.status === 401) {
      router.push('/login?redirect_to=/keranjang')
      return
    }
    if (res.ok) {
      const { data } = await res.json()
      setCart(data)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleQuantityChange = (item: CartItem, newQty: number) => {
    if (newQty < 1) return

    // Optimistic update
    setCart((prev) => {
      if (!prev) return prev
      const items = prev.items.map((i) =>
        i.id === item.id
          ? { ...i, quantity: newQty, subtotal: i.display_price * newQty }
          : i
      )
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)
      const item_count = items.reduce((sum, i) => sum + i.quantity, 0)
      return { ...prev, items, subtotal, item_count }
    })

    // Debounce API call
    if (debounceRef.current[item.id]) clearTimeout(debounceRef.current[item.id])
    debounceRef.current[item.id] = setTimeout(async () => {
      setUpdating((u) => ({ ...u, [item.id]: true }))
      await fetch(`/api/cart/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      })
      setUpdating((u) => ({ ...u, [item.id]: false }))
      fetchCart()
      refreshCart()
    }, 500)
  }

  const handleRemove = async (itemId: string) => {
    // Optimistic remove
    setCart((prev) => {
      if (!prev) return prev
      const items = prev.items.filter((i) => i.id !== itemId)
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)
      const item_count = items.reduce((sum, i) => sum + i.quantity, 0)
      return { ...prev, items, subtotal, item_count }
    })
    await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' })
    refreshCart()
  }

  const hasOutOfStock = cart?.items.some((i) => i.is_out_of_stock) ?? false
  const itemCount = cart?.item_count ?? 0

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Keranjang Saya
        {itemCount > 0 && (
          <span className="ml-2 text-base font-normal text-gray-500">({itemCount} item)</span>
        )}
      </h1>

      {/* Empty state */}
      {(!cart || cart.items.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <ShoppingCart className="w-16 h-16 text-gray-200" />
          <p className="text-lg font-semibold text-gray-500">Keranjang masih kosong</p>
          <p className="text-sm text-gray-400">Yuk, temukan produk yang kamu butuhkan</p>
          <Link
            href="/katalog"
            className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#534AB7' }}
          >
            Jelajahi Produk
          </Link>
        </div>
      )}

      {/* Cart items */}
      {cart && cart.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 p-4 transition-colors ${item.is_out_of_stock ? 'bg-red-50' : ''}`}
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {item.display_image ? (
                  <Image
                    src={item.display_image}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                {item.variant && (
                  <p className="text-xs text-gray-500">{item.variant.name}</p>
                )}
                <p className="text-sm font-medium" style={{ color: '#534AB7' }}>
                  {formatRupiah(item.display_price)}
                </p>

                {item.is_out_of_stock && (
                  <p className="text-xs font-semibold text-red-500">⚠ Stok tidak tersedia</p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  {/* Quantity stepper */}
                  {!item.is_out_of_stock && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updating[item.id]}
                        className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Kurangi"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-7 text-center text-sm font-semibold ${updating[item.id] ? 'opacity-50' : ''}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          const maxQty = item.variant?.stock ?? Infinity
                          handleQuantityChange(item, item.quantity + 1)
                          if (item.quantity >= maxQty) return
                        }}
                        disabled={updating[item.id]}
                        className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Tambah"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Subtotal */}
                  <span className="text-xs text-gray-500 ml-1">
                    = {formatRupiah(item.subtotal)}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky bottom bar */}
      {cart && cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40 px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Subtotal ({itemCount} item)
              </span>
              <span className="text-lg font-bold" style={{ color: '#534AB7' }}>
                {formatRupiah(cart.subtotal)}
              </span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              disabled={hasOutOfStock}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#534AB7' }}
            >
              Lanjut ke Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
            {hasOutOfStock && (
              <p className="text-xs text-center text-red-500">
                Hapus item yang stoknya habis untuk melanjutkan
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
