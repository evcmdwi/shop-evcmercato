'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  orders: { pending: number; paid: number; shipped: number; delivered: number }
  inventory: { products: number; categories: number; users: number }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sambers/dashboard/stats')
      .then(r => r.json())
      .then(({ data }) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const orderCards = [
    {
      label: 'Menunggu Pembayaran',
      count: stats?.orders.pending ?? 0,
      icon: '⏳',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      countColor: 'text-yellow-600',
      subtext: 'perlu follow-up',
      href: '/sambers/pesanan?status=pending',
    },
    {
      label: 'Pesanan Baru',
      count: stats?.orders.paid ?? 0,
      icon: '📥',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      countColor: 'text-orange-600',
      subtext: 'perlu diproses',
      href: '/sambers/pesanan?status=paid',
    },
    {
      label: 'Pesanan Terkirim',
      count: stats?.orders.shipped ?? 0,
      icon: '🚚',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      countColor: 'text-blue-600',
      subtext: 'menuju customer',
      href: '/sambers/pesanan?status=shipped',
    },
    {
      label: 'Pesanan Selesai',
      count: stats?.orders.delivered ?? 0,
      icon: '✅',
      color: 'bg-green-50 border-green-200 text-green-800',
      countColor: 'text-green-600',
      subtext: 'all-time',
      href: '/sambers/pesanan?status=delivered',
    },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang di admin EVC Mercato</p>
      </div>

      {/* Order Status Cards */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">📦 Status Pesanan</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {orderCards.map(card => (
            <Link key={card.label} href={card.href}>
              <div className={`border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer ${card.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <p className={`text-3xl font-bold ${card.countColor}`}>
                  {loading ? <span className="animate-pulse">—</span> : card.count}
                </p>
                <p className="text-sm font-medium mt-1">{card.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{card.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Inventory Stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">📊 Inventori</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Produk', count: stats?.inventory.products ?? 0, href: '/sambers/produk' },
            { label: 'Kategori', count: stats?.inventory.categories ?? 0, href: '/sambers/kategori' },
            { label: 'Pengguna', count: stats?.inventory.users ?? 0, href: '#' },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <div className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 text-center">
                <p className="text-2xl font-bold text-[#534AB7]">
                  {loading ? '—' : item.count}
                </p>
                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
