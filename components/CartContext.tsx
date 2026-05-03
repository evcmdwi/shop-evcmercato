'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth/auth-context'

export interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  pending?: boolean
  product: { id: string; name: string; price: number; has_variants: boolean; images: string[] }
  variant: { id: string; name: string; price: number; stock: number; image_url: string | null } | null
  display_price: number
  display_image: string | null
  subtotal: number
  is_out_of_stock: boolean
}

export interface Cart {
  id: string
  items: CartItem[]
  item_count: number
  subtotal: number
}

interface CartContextType {
  cart: Cart | null
  itemCount: number
  loading: boolean
  refreshCart: () => Promise<void>
  addItem: (product_id: string, variant_id: string | null, quantity: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
}

const CartContext = createContext<CartContextType>({
  cart: null,
  itemCount: 0,
  loading: false,
  refreshCart: async () => {},
  addItem: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  // Prevent duplicate fetches (React StrictMode double-mount, multiple consumers)
  const fetchingRef = useRef(false)
  const prevUserIdRef = useRef<string | undefined>(undefined)

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null)
      return
    }
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const { data } = await res.json()
        setCart(data ?? null)
      }
    } catch {
      /* network error — silently ignore */
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user])

  // Fetch cart on mount and when user changes
  useEffect(() => {
    if (user?.id !== prevUserIdRef.current) {
      prevUserIdRef.current = user?.id
      refreshCart()
    }
  }, [user?.id, refreshCart])

  const itemCount = cart?.item_count ?? 0

  const addItem = useCallback(
    async (product_id: string, variant_id: string | null, quantity: number) => {
      setLoading(true)
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, variant_id, quantity }),
      })
      const { data, error } = await res.json()
      if (res.ok) setCart(data)
      setLoading(false)
      if (!res.ok) throw new Error(error || 'Gagal menambahkan ke keranjang')
    },
    []
  )

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    const { data } = await res.json()
    if (res.ok) setCart(data)
  }, [])

  const removeItem = useCallback(
    async (itemId: string) => {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' })
      if (res.ok) refreshCart()
    },
    [refreshCart]
  )

  return (
    <CartContext.Provider
      value={{ cart, itemCount, loading, refreshCart, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCartContext = () => useContext(CartContext)
