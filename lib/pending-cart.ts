// Barang yang diklik "+ Keranjang" sebelum login. Disimpan di browser, lalu
// dimasukkan ke keranjang otomatis setelah pengunjung login/daftar (CartContext).
const KEY = 'evc_pending_cart'
const MAX_AGE_MS = 60 * 60 * 1000 // 1 jam

export interface PendingCartItem {
  product_id: string
  variant_id: string | null
  quantity: number
}

export function savePendingCartItem(item: PendingCartItem) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...item, at: Date.now() }))
  } catch {
    // storage diblokir (mode privat) — pengunjung cukup klik ulang setelah login
  }
}

/** Ambil sekali lalu hapus. null bila tidak ada / kedaluwarsa. */
export function takePendingCartItem(): PendingCartItem | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    localStorage.removeItem(KEY)
    const v = JSON.parse(raw) as PendingCartItem & { at?: number }
    if (!v.product_id || !v.at || Date.now() - v.at > MAX_AGE_MS) return null
    return { product_id: v.product_id, variant_id: v.variant_id ?? null, quantity: Math.max(1, Math.floor(v.quantity || 1)) }
  } catch {
    return null
  }
}

/** Simpan barang lalu arahkan ke login; setelahnya kembali ke `returnTo` (default: halaman ini). */
export function redirectToLoginWithItem(item: PendingCartItem, returnTo?: string) {
  savePendingCartItem(item)
  const back = returnTo ?? window.location.pathname + window.location.search
  window.location.href = `/login?redirect_to=${encodeURIComponent(back)}`
}
