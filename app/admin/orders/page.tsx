'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  paid:      'bg-blue-100 text-blue-800',
  processed: 'bg-orange-100 text-orange-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  expired:   'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
  failed:    'bg-red-100 text-red-800',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Menunggu Bayar',
  paid:      'Lunas',
  processed: 'Diproses',
  shipped:   'Dikirim',
  delivered: 'Selesai',
  expired:   'Kedaluwarsa',
  cancelled: 'Dibatalkan',
  failed:    'Gagal',
}

interface Order {
  id: string
  short_id: string
  status: string
  total_amount: number
  created_at: string
  customer_name: string
  customer_email: string
  items_count: number
}

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const limit = 20

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      const json = await res.json()
      if (json.data) {
        setOrders(json.data.orders)
        setTotal(json.data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const totalPages = Math.ceil(total / limit)

  return (
    <AdminShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Manajemen Pesanan</h1>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-[#534AB7] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Cari Order ID atau nama customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setSearch(searchInput); setPage(1) }
            }}
            className="flex-1 max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]"
          />
          <button
            onClick={() => { setSearch(searchInput); setPage(1) }}
            className="px-4 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:bg-[#4238a0]"
          >
            Cari
          </button>
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Item</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Quick Aksi</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Belum ada pesanan</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-[#534AB7]">
                        #{order.short_id}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{order.customer_name}</div>
                        <div className="text-xs text-slate-400">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatRp(order.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] ?? 'bg-slate-100 text-slate-700'}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{order.items_count}</td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'paid' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`) }}
                            className="px-2.5 py-1 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600"
                          >
                            ▶ Proses
                          </button>
                        )}
                        {order.status === 'processed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`) }}
                            className="px-2.5 py-1 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
                          >
                            🚚 Kirim
                          </button>
                        )}
                        {!['paid', 'processed'].includes(order.status) && (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`) }}
                          className="text-[#534AB7] hover:text-[#4238a0] text-sm font-medium"
                        >
                          Detail →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total} pesanan
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
