'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CartContextType {
  itemCount: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType>({
  itemCount: 0,
  refreshCart: async () => {},
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0)

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const { data } = await res.json()
        setItemCount(data?.item_count ?? 0)
      }
    } catch {
      /* not logged in */
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ itemCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCartContext = () => useContext(CartContext)
