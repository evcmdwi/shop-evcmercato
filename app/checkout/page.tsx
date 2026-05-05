'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Plus, CheckCircle2, Loader2 } from 'lucide-react'
import Modal from '@/components/Modal'
import AddressForm from '@/components/AddressForm'
import { toast } from '@/components/Toast'
import type { Address } from '@/types/address'
import type { Cart } from '@/hooks/useCart'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function CheckoutPage() {
  const router = useRouter()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [loadingCart, setLoadingCart] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [paying, setPaying] = useState(false)
  const [deliveryNote, setDeliveryNote] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('checkout_delivery_note') ?? ''
    return ''
  })
  const deliveryNoteRef = useRef<HTMLInputElement>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsExpanded, setTermsExpanded] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<'reguler' | 'instan' | 'sameday'>('reguler')
  const [shippingRates, setShippingRates] = useState<{
    available_methods: { method: string; label: string; base_rate: number; available: boolean; reason?: string }[]
  } | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<string[]>([])

  const fetchAddresses = useCallback(async () => {
    const res = await fetch('/api/addresses')
    if (res.status === 401) {
      router.push('/login?redirect_to=/checkout')
      return
    }
    if (res.ok) {
      const { data } = await res.json()
      setAddresses(data ?? [])
      const def = (data ?? []).find((a: Address) => a.is_default)
      if (def) setSelectedAddressId(def.id)
      else if (data?.length > 0) setSelectedAddressId(data[0].id)
    }
    setLoadingAddresses(false)
  }, [router])

  const fetchCart = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.status === 401) {
      router.push('/login?redirect_to=/checkout')
      return
    }
    if (res.ok) {
      const { data } = await res.json()
      setCart(data)
    }
    setLoadingCart(false)
  }, [router])

  useEffect(() => {
    fetchAddresses()
    fetchCart()
    // Read selected item IDs from sessionStorage (set by keranjang page)
    const stored = sessionStorage.getItem('checkout_selected_ids')
    if (stored) {
      try { setSelectedCartItemIds(JSON.parse(stored)) } catch {}
    }
  }, [fetchAddresses, fetchCart])

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null

  useEffect(() => {
    if (!selectedAddress?.district_id) {
      setShippingRates(null)
      setShippingMethod('reguler')
      return
    }
    setLoadingRates(true)
    fetch(`/api/shipping-rates/${selectedAddress.district_id}`)
      .then(r => r.json())
      .then(d => { setShippingRates(d); setShippingMethod('reguler') })
      .catch(() => setShippingRates(null))
      .finally(() => setLoadingRates(false))
  }, [selectedAddress?.district_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter to only selected items (if selection was passed from cart page)
  const checkoutItems = selectedCartItemIds.length > 0
    ? cart?.items?.filter((item) => selectedCartItemIds.includes(item.id)) ?? []
    : cart?.items ?? []

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.subtotal, 0)
  const itemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0)
  const serviceFee = 3000
  const shippingDiscount = subtotal >= 50000 ? 10000 : 0
  const selectedMethodData = shippingRates?.available_methods?.find((m) => m.method === shippingMethod)
  const baseRate = selectedMethodData?.base_rate ?? 10000
  const shippingCost = Math.max(0, baseRate - shippingDiscount)
  const freeShipping = shippingCost === 0
  const qualifiesForFreeShipping = subtotal >= 50000
  const remaining = Math.max(0, 50000 - subtotal)
  // Service fee always free (Phase 1)
  const totalSaved = (qualifiesForFreeShipping ? baseRate : 0) + serviceFee
  const totalAmount = subtotal + shippingCost
  const evcPoints = Math.floor(subtotal / 1000)
  // Keep backward compat vars
  const ongkir = baseRate
  const promo = qualifiesForFreeShipping ? -(ongkir + serviceFee) : -serviceFee
  const totalBayar = totalAmount

  const handlePay = async () => {
    if (!selectedAddressId) {
      toast.show({ message: 'Pilih alamat pengiriman terlebih dahulu', type: 'error' })
      return
    }
    setPaying(true)
    try {
      // Baca langsung dari DOM - paling reliable, tidak terpengaruh React state
      const domNote = (document.getElementById('checkout-delivery-note') as HTMLInputElement)?.value?.trim() || null
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_id: selectedAddressId,
          delivery_note: domNote,
          terms_accepted: true,
          selected_item_ids: selectedCartItemIds.length > 0 ? selectedCartItemIds : null,
          shipping_method: shippingMethod,
          shipping_base_rate: selectedMethodData?.base_rate ?? 10000,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data?.xendit_invoice_url) {
        sessionStorage.removeItem('checkout_delivery_note')
        window.location.href = json.data.xendit_invoice_url
      } else if (json.error?.includes('stok') || json.error?.includes('stock')) {
        toast.show({ message: 'Beberapa item stok habis. Silakan perbarui keranjang kamu.', type: 'error' })
      } else {
        toast.show({ message: json.error ?? 'Terjadi kesalahan. Coba lagi.', type: 'error' })
      }
    } catch {
      toast.show({ message: 'Gagal terhubung ke server.', type: 'error' })
    } finally {
      setPaying(false)
    }
  }

  const loading = loadingAddresses || loadingCart

  return (
    <div className="min-h-screen bg-gray-50 pb-32 sm:pb-0">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-4">

            {/* Alamat Pengiriman */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Alamat Pengiriman</h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-1 text-sm text-[#7FB300] font-medium hover:opacity-80"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Alamat Baru
                </button>
              </div>

              {loadingAddresses ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ) : addresses.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-500 mb-3">Belum ada alamat. Tambahkan alamat pengiriman kamu.</p>
                  <AddressForm
                    onSuccess={() => { fetchAddresses(); }}
                    onCancel={() => {}}
                  />
                </div>
              ) : (
                <>
                  {addresses.length > 1 && (
                    <div className="relative mb-3">
                      <select
                        value={selectedAddressId ?? ''}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                      >
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.recipient_name} — {addr.city}
                            {addr.is_default ? ' (Utama)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {selectedAddress && (
                    <div className="border border-[#7FB300] bg-[#E8F4D1] rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#7FB300] mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">{selectedAddress.recipient_name}</p>
                          <p className="text-gray-600">{selectedAddress.phone}</p>
                          <p className="text-gray-600 mt-1">{selectedAddress.full_address}</p>
                          <p className="text-gray-600">{selectedAddress.city}, {selectedAddress.province} {selectedAddress.postal_code}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Metode Pengiriman */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Metode Pengiriman</h2>
              {loadingRates ? (
                <div className="text-sm text-gray-400">Memuat opsi pengiriman...</div>
              ) : (
                <div className="space-y-2">
                  {(shippingRates?.available_methods ?? [
                    { method: 'reguler', label: 'Reguler (JNT) — 1-3 hari', base_rate: 10000, available: true },
                  ]).map((m) => {
                    const rate = m.base_rate ?? 10000
                    const cost = Math.max(0, rate - shippingDiscount)
                    const isFree = cost === 0
                    return (
                      <label key={m.method}
                        className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                          !m.available ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' :
                          shippingMethod === m.method ? 'border-[#7FB300] bg-[#E8F4D1]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shipping_method" value={m.method}
                            checked={shippingMethod === m.method}
                            disabled={!m.available}
                            onChange={() => m.available && setShippingMethod(m.method as 'reguler' | 'instan' | 'sameday')}
                            className="accent-[#7FB300]"
                          />
                          <div>
                            <p className={`text-sm font-medium ${!m.available ? 'text-gray-400' : 'text-gray-900'}`}>
                              {m.label}
                            </p>
                            {!m.available && m.reason && (
                              <p className="text-xs text-gray-400">🔒 {m.reason}</p>
                            )}
                          </div>
                        </div>
                        {m.available && (
                          <div className="text-sm font-medium text-right">
                            {isFree ? (
                              <span className="text-[#1D9E75] font-bold">GRATIS 💚</span>
                            ) : (
                              <>
                                {subtotal >= 50000 && (
                                  <span className="line-through text-gray-400 text-xs mr-1">{formatRupiah(rate)}</span>
                                )}
                                <span>{formatRupiah(cost)}</span>
                              </>
                            )}
                          </div>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pesan untuk Kurir */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pesan untuk Kurir</h2>
              <input
                type="text"
                id="checkout-delivery-note"
                ref={deliveryNoteRef}
                defaultValue=""
                onChange={(e) => {
                  setDeliveryNote(e.target.value)
                }}
                placeholder="Contoh: Titipkan di reception. (Opsional)"
                maxLength={150}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] text-gray-700 placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-2">Kosongkan jika tidak ada pesan khusus.</p>
            </div>

            {/* Item Pesanan */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Item Pesanan</h2>
              {loadingCart ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cart?.items?.length === 0 ? (
                <p className="text-sm text-gray-500">Keranjang kamu kosong.</p>
              ) : (
                <div className="space-y-3">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        {item.display_image ? (
                          <Image
                            src={item.display_image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#E8F4D1] flex items-center justify-center text-[#7FB300] text-xs font-bold">
                            {item.product.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-500">{item.variant.name}</p>
                        )}
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Ringkasan Pembayaran */}
          <div className="lg:w-80">
            <div className="bg-white rounded-2xl p-5 shadow-sm lg:sticky lg:top-20">
              <h2 className="font-semibold text-gray-900 mb-4">Ringkasan Pembayaran</h2>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-2/5" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Harga ({itemCount} item)</span>
                      <span className="font-medium">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ongkos Kirim</span>
                      <span>
                        {qualifiesForFreeShipping ? (
                          <span>
                            <s className="text-gray-400 mr-1">{formatRupiah(selectedMethodData?.base_rate ?? 10000)}</s>
                            <span className="text-[#1D9E75] font-bold">GRATIS</span>
                          </span>
                        ) : (
                          <span className="font-medium">{formatRupiah(shippingCost)}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya Layanan</span>
                      <span>
                        <s className="text-gray-400 mr-1">{formatRupiah(serviceFee)}</s>
                        <span className="text-[#1D9E75] font-bold">GRATIS</span>
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                      <span>Total Bayar</span>
                      <span style={{ color: '#7FB300' }}>{formatRupiah(totalAmount)}</span>
                    </div>
                    {!qualifiesForFreeShipping && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🛒</span>
                          <div>
                            <p className="text-sm font-medium text-amber-800">
                              Tambah belanja <strong>{formatRupiah(remaining)}</strong> untuk <strong>GRATIS ongkir!</strong>
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">Hemat Rp 10.000 ongkos kirim</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {qualifiesForFreeShipping && totalSaved > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-green-700 font-medium text-center">
                          💚 Hemat {formatRupiah(totalSaved)}{' '}dari ongkir &amp; biaya layanan!
                        </p>
                      </div>
                    )}
                    {evcPoints > 0 && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Kamu akan mendapat{' '}
                        <span className="font-semibold text-[#7FB300]">💎 {evcPoints} EVC Points</span>{' '}
                        dari pembelian ini
                      </p>
                    )}
                  </div>

                  {!qualifiesForFreeShipping && (
                    <Link
                      href="/keranjang"
                      className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors mt-4"
                    >
                      ← Kembali ke Keranjang
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Total Bayar</span>
          <span className="font-bold text-[#7FB300]">{formatRupiah(totalAmount)}</span>
        </div>
        {/* Layer 4: Terms consent */}
        <div className="flex items-start gap-2 mb-3">
          <input
            type="checkbox"
            id="checkout-terms"
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#7FB300] cursor-pointer flex-shrink-0"
          />
          <div className="flex-1">
            <label htmlFor="checkout-terms" className={`text-[11px] text-gray-400 cursor-pointer leading-relaxed block ${!termsExpanded ? 'line-clamp-2' : ''}`}>
              Saya memahami bahwa shop.evcmercato.com dikelola oleh mitra usaha KKI Group secara independen, BUKAN official store KKI.
              Saya menyetujui{' '}
              <a href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer" className="text-[#7FB300] hover:underline" onClick={e => e.stopPropagation()}>
                Syarat &amp; Ketentuan
              </a>{' '}
              dan memahami pembelian ini tidak memberikan fasilitas member KKI (PV, BV, PR, komisi).
            </label>
            <button type="button" onClick={() => setTermsExpanded(p => !p)} className="text-[10px] text-gray-400 hover:text-gray-600 mt-0.5">
              {termsExpanded ? 'Sembunyikan ▲' : 'Selengkapnya ▼'}
            </button>
          </div>
        </div>
        <button
          onClick={handlePay}
          disabled={paying || !selectedAddressId || !termsAccepted}
          className="w-full bg-[#7FB300] text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : (
            'Bayar Sekarang'
          )}
        </button>
      </div>

      {/* Modal AddressForm */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Tambah Alamat Baru">
        <AddressForm
          onSuccess={() => {
            setShowAddressModal(false)
            fetchAddresses()
          }}
          onCancel={() => setShowAddressModal(false)}
        />
      </Modal>
    </div>
  )
}
