'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  orders: { pending: number; paid: number; processed: number; shipped: number; delivered: number }
  inventory: { products: number; categories: number; users: number }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sambers/dashboard/stats')
      .then(r => r.json())
      .then(({ data }) => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const orderCards = [
    { label: 'Menunggu Pembayaran', count: stats?.orders.pending ?? 0, icon: '⏳', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', num: 'text-yellow-600', sub: 'perlu follow-up', href: '/sambers/pesanan?status=pending' },
    { label: 'Pesanan Baru', count: stats?.orders.paid ?? 0, icon: '📥', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', num: 'text-orange-600', sub: 'perlu diproses', href: '/sambers/pesanan?status=paid' },
    { label: 'Pesanan Diproses', count: stats?.orders.processed ?? 0, icon: '📦', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', num: 'text-purple-600', sub: 'perlu input resi', href: '/sambers/pesanan?status=processed' },
    { label: 'Pesanan Terkirim', count: stats?.orders.shipped ?? 0, icon: '🚚', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', num: 'text-blue-600', sub: 'menuju customer', href: '/sambers/pesanan?status=shipped' },
    { label: 'Pesanan Selesai', count: stats?.orders.delivered ?? 0, icon: '✅', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', num: 'text-green-600', sub: 'all-time', href: '/sambers/pesanan?status=delivered' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Selamat datang di Admin Panel EVC Mercato</p>
      </div>

      {/* Status Pesanan */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">📦 Status Pesanan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {orderCards.map(card => (
            <Link key={card.label} href={card.href} className={`${card.bg} ${card.border} border rounded-xl p-4 hover:shadow-md transition-shadow block`}>
              <span className="text-2xl">{card.icon}</span>
              <p className={`text-3xl font-bold mt-2 ${card.num}`}>
                {loading ? <span className="animate-pulse text-slate-300">—</span> : card.count}
              </p>
              <p className={`text-sm font-medium mt-1 ${card.text}`}>{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Inventori */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">📊 Inventori</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Produk', count: stats?.inventory.products ?? 0, href: '/sambers/produk' },
            { label: 'Kategori', count: stats?.inventory.categories ?? 0, href: '/sambers/kategori' },
            { label: 'Pengguna', count: stats?.inventory.users ?? 0, href: '#' },
          ].map(item => (
            <Link key={item.label} href={item.href} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 text-center block">
              <p className="text-2xl font-bold text-[#7FB300]">
                {loading ? '—' : item.count}
              </p>
              <p className="text-sm text-slate-500 mt-1">{item.label}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
