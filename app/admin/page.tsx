'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalProducts: number
  totalCategories: number
  totalUsers: number
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, categoriesRes, usersRes] = await Promise.allSettled([
          fetch('/api/admin/products?limit=1'),
          fetch('/api/admin/categories?limit=1'),
          fetch('/api/admin/users?limit=1'),
        ])

        const products = productsRes.status === 'fulfilled' && productsRes.value.ok
          ? await productsRes.value.json()
          : { total: 0 }
        const categories = categoriesRes.status === 'fulfilled' && categoriesRes.value.ok
          ? await categoriesRes.value.json()
          : { total: 0 }
        const users = usersRes.status === 'fulfilled' && usersRes.value.ok
          ? await usersRes.value.json()
          : { total: 0 }

        setStats({
          totalProducts: products.total ?? 0,
          totalCategories: categories.total ?? 0,
          totalUsers: users.total ?? 0,
        })
      } catch {
        setStats({ totalProducts: 0, totalCategories: 0, totalUsers: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Selamat datang di Admin Panel EVC Mercato</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Produk"
            value={stats?.totalProducts ?? 0}
            color="bg-[#EEEDFE] text-[#534AB7]"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            title="Total Kategori"
            value={stats?.totalCategories ?? 0}
            color="bg-emerald-50 text-[#1D9E75]"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
          <StatCard
            title="Total Pengguna"
            value={stats?.totalUsers ?? 0}
            color="bg-blue-50 text-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  )
}
