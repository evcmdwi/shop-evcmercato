'use client'
/**
 * useCart — thin wrapper around CartContext.
 * All components should use this hook; cart data is fetched once via CartProvider.
 */
import { useCartContext, type CartItem, type Cart } from '@/components/CartContext'

export type { CartItem, Cart }

export function useCart() {
  const { cart, loading, refreshCart, addItem, updateItem, removeItem } = useCartContext()
  return { cart, loading, fetchCart: refreshCart, addItem, updateItem, removeItem }
}
