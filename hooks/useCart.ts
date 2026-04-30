'use client'
import { useState, useEffect, useCallback } from 'react'

export interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
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

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.ok) {
      const { data } = await res.json()
      setCart(data)
    }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addItem = async (product_id: string, variant_id: string | null, quantity: number) => {
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
  }

  const updateItem = async (itemId: string, quantity: number) => {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    const { data } = await res.json()
    if (res.ok) setCart(data)
  }

  const removeItem = async (itemId: string) => {
    const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' })
    if (res.ok) fetchCart()
  }

  return { cart, loading, fetchCart, addItem, updateItem, removeItem }
}
