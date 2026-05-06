'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'

type RouteProps = { params: Promise<{ id: string }> }

interface RedemptionData {
  redemption: any
  user_eligible: boolean
  user_points_balance: number
  user_already_redeemed: number
  can_redeem: boolean
}

function RedeemForm({ id }: { id: string }) {
  const router = useRouter()
  const [data, setData] = useState<RedemptionData | null>(null)
  const [config, setConfig] = useState({ shipping_cost: 10000, admin_fee: 3000 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Gabung Order state
  const [gabungOrder, setGabungOrder] = useState(false)
  const [orderCode, setOrderCode] = useState('')
  const [orderCheck, setOrderCheck] = useState<{
    loading: boolean
    valid: boolean | null
    reason: string | null
    order_id: string | null
  }>({ loading: false, valid: null, reason: null, order_id: null })

  // Address form state
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [fullAddress, setFullAddress] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/redemptions/${id}`).then(r => r.json()),
      fetch('/api/sambers/redemptions/config').then(r => r.json()),
    ]).then(([redemptionData, configData]) => {
      setData(redemptionData)
      setConfig(configData.config ?? { shipping_cost: 10000, admin_fee: 3000 })
      setLoading(false)
    })
  }, [id])

  const isGabungValid = gabungOrder && orderCheck.valid === true
  const effectiveShipping = isGabungValid ? 0 : config.shipping_cost
  const effectiveAdmin = isGabungValid ? 0 : config.admin_fee
  const totalFee = effectiveShipping + effectiveAdmin

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  const handleCheckOrder = async () => {
    setOrderCheck({ loading: true, valid: null, reason: null, order_id: null })
    const res = await fetch(`/api/user/orders/check-for-redeem?order_code=${orderCode}`)
    const data = await res.json()
    setOrderCheck({ loading: false, valid: data.valid, reason: data.reason ?? null, order_id: data.order_id ?? null })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAddress || !recipientName || !phone || !fullAddress) {
      setError('Lengkapi semua data alamat'); return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/redemptions/${id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_address: {
            recipient_name: recipientName,
            shipping_phone: phone,
            shipping_full_address: fullAddress,
            shipping_district_name: selectedAddress.district_name,
            shipping_regency_name: selectedAddress.regency_name,
            shipping_province_name: selectedAddress.province_name,
          },
          delivery_note: deliveryNote || null,
          combined_order_id: (gabungOrder && orderCheck.valid && orderCheck.order_id) ? orderCheck.order_id : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Gagal'); return }
      window.location.href = json.payment_url
    } catch { setError('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#7FB300] border-t-transparent rounded-full animate-spin" /></div>

  if (!data?.redemption) return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <div><p className="text-4xl mb-3">❌</p><p className="text-gray-600">Promo tidak ditemukan</p><Link href="/poin" className="text-[#7FB300] mt-4 block">← Kembali</Link></div>
    </div>
  )

  const r = data.redemption
  const productImg = r.products?.image_url
  const pointsAfter = data.user_points_balance - r.points_required

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <Link href="/poin" prefetch={false} className="flex items-center gap-1 text-sm text-gray-500 mb-6 hover:text-[#7FB300]">
        ← Kembali ke EVC Points
      </Link>

      {/* Product Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex gap-4">
          {productImg && <img src={productImg} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt={r.title} />}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 line-clamp-2">{r.title}</p>
            {r.product_variants?.name && <p className="text-sm text-gray-500 mt-0.5">{r.product_variants.name}</p>}
            <p className="text-amber-600 font-bold mt-2">💎 {r.points_required} points</p>
            <p className="text-xs text-gray-400 mt-0.5">Sisa stok: {r.redeem_stock - r.redeemed_count}</p>
          </div>
        </div>
      </div>

      {/* User Points Status */}
      <div className={`rounded-2xl p-4 mb-4 ${data.user_eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Saldo kamu</span>
          <span className="font-bold">💎 {data.user_points_balance} pts</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Points dipakai</span>
          <span className="font-semibold text-amber-600">- {r.points_required} pts</span>
        </div>
        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm">
          <span className="text-gray-600">Sisa setelah tukar</span>
          <span className={`font-bold ${data.user_eligible ? 'text-[#7FB300]' : 'text-red-500'}`}>{pointsAfter} pts</span>
        </div>
        {!data.user_eligible && (
          <p className="text-xs text-red-600 mt-2">⚠️ Points tidak mencukupi. Butuh {r.points_required - data.user_points_balance} pts lagi.</p>
        )}
      </div>

      {data.can_redeem && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address Form */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Alamat Pengiriman</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima *</label>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} required type="tel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan *</label>
                <AddressAutocomplete value={selectedAddress} onChange={setSelectedAddress} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap *</label>
                <textarea value={fullAddress} onChange={e => setFullAddress(e.target.value)} required rows={3}
                  placeholder="Tulis alamat lengkap, gedung, nomor unit, kelurahan (Tidak perlu menulis kecamatan/kota/provinsi)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesan untuk Kurir <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)}
                  placeholder="Contoh: Titipkan di reception"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Biaya</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">{r.title}</span><span className="font-semibold text-green-600">GRATIS</span></div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span className="text-gray-600">Ongkos kirim</span>
                {isGabungValid ? (
                  <span><s className="text-gray-300">{formatRupiah(config.shipping_cost)}</s> <span className="text-green-600 font-semibold">Rp 0</span></span>
                ) : (
                  <span>{formatRupiah(config.shipping_cost)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span className="text-gray-600">Biaya admin</span>
                {isGabungValid ? (
                  <span><s className="text-gray-300">{formatRupiah(config.admin_fee)}</s> <span className="text-green-600 font-semibold">Rp 0</span></span>
                ) : (
                  <span>{formatRupiah(config.admin_fee)}</span>
                )}
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total Bayar</span>
                <span className="text-[#7FB300]">{formatRupiah(totalFee)}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">+ {r.points_required} EVC Points akan digunakan</p>
            </div>
          </div>

          {/* Opsi Gabung Order */}
          <div className="border border-gray-200 rounded-xl p-4 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gabungOrder}
                onChange={e => {
                  setGabungOrder(e.target.checked)
                  if (!e.target.checked) {
                    setOrderCode('')
                    setOrderCheck({ loading: false, valid: null, reason: null, order_id: null })
                  }
                }}
                className="mt-0.5 accent-[#7FB300]"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Dikirim bersamaan dengan order saya</p>
                <p className="text-xs text-gray-400 mt-0.5">Ongkir & biaya admin GRATIS jika digabung dengan pesanan aktif</p>
              </div>
            </label>

            {gabungOrder && (
              <div className="mt-3 pl-7">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderCode}
                    onChange={e => {
                      setOrderCode(e.target.value.toUpperCase())
                      setOrderCheck({ loading: false, valid: null, reason: null, order_id: null })
                    }}
                    placeholder="Masukkan 8 digit kode pesanan (contoh: AB12CD34)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7FB300]"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleCheckOrder}
                    disabled={orderCode.length < 4 || orderCheck.loading}
                    className="bg-[#7FB300] text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#6B9700]"
                  >
                    {orderCheck.loading ? '...' : 'Cek'}
                  </button>
                </div>

                {orderCheck.valid === true && (
                  <p className="text-xs text-green-600 mt-2">✅ Order ditemukan! Ongkir & admin jadi Rp 0.</p>
                )}
                {orderCheck.valid === false && (
                  <p className="text-xs text-red-500 mt-2">
                    {orderCheck.reason === 'sudah_dikirim' && '❌ Pesanan ini sudah dikirim, tidak bisa digabung.'}
                    {orderCheck.reason === 'belum_dibayar' && '❌ Pesanan belum dibayar. Selesaikan pembayaran dulu.'}
                    {orderCheck.reason === 'tidak_ditemukan' && '❌ Kode pesanan tidak ditemukan.'}
                    {orderCheck.reason === 'bukan_milik_kamu' && '❌ Pesanan ini bukan milikmu.'}
                    {orderCheck.reason === 'order_tidak_aktif' && '❌ Pesanan ini sudah dibatalkan atau kadaluarsa.'}
                    {!['sudah_dikirim','belum_dibayar','tidak_ditemukan','bukan_milik_kamu','order_tidak_aktif'].includes(orderCheck.reason || '') && '❌ Tidak valid. Coba lagi.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={submitting || !selectedAddress || !recipientName || !phone || !fullAddress}
            className="w-full bg-[#7FB300] text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 hover:bg-[#6B9700] transition-colors">
            {submitting ? 'Memproses...' : `Konfirmasi & Bayar ${formatRupiah(totalFee)}`}
          </button>
        </form>
      )}

      {!data.can_redeem && !data.user_eligible && (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">Kumpulkan lebih banyak points untuk redeem promo ini.</p>
          <Link href="/katalog" prefetch={false} className="bg-[#7FB300] text-white px-6 py-3 rounded-xl font-semibold text-sm">
            Belanja Sekarang
          </Link>
        </div>
      )}
    </div>
  )
}

export default function RedeemPage({ params }: RouteProps) {
  const [id, setId] = useState('')
  useEffect(() => { params.then(p => setId(p.id)) }, [params])
  if (!id) return null
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#7FB300] border-t-transparent rounded-full animate-spin" /></div>}><RedeemForm id={id} /></Suspense>
}
