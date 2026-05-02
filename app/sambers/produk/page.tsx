'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminTable from '@/components/admin/AdminTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { toast } from '@/components/admin/Toast'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  image_url: string | null
  category: Category | null
}

interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  totalPages: number
}

const PAGE_SIZE = 10

export default function AdminProdukPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(search && { search }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStatus && { status: filterStatus }),
      })
      const res = await fetch(`/api/sambers/products?${params}`)
      if (!res.ok) throw new Error('Gagal memuat produk')
      const json: ProductsResponse = await res.json()
      setProducts(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (e) {
      toast('Gagal memuat produk', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterCategory, filterStatus])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetch('/api/sambers/categories?limit=100')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
      .catch(() => {})
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/sambers/products/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast('Produk berhasil dihapus', 'success')
      setDeleteId(null)
      fetchProducts()
    } catch {
      toast('Gagal menghapus produk', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const columns = [
    {
      key: 'image_url',
      header: 'Gambar',
      className: 'w-16',
      render: (row: Product) =>
        row.image_url ? (
          <Image
            src={row.image_url}
            alt={row.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
            N/A
          </div>
        ),
    },
    { key: 'name', header: 'Nama Produk' },
    {
      key: 'category',
      header: 'Kategori',
      render: (row: Product) => row.category?.name ?? '-',
    },
    {
      key: 'price',
      header: 'Harga',
      render: (row: Product) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.price),
    },
    { key: 'stock', header: 'Stok' },
    {
      key: 'is_active',
      header: 'Status',
      render: (row: Product) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            row.is_active
              ? 'bg-emerald-50 text-[#1D9E75]'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'w-24',
      render: (row: Product) => (
        <div className="flex gap-2">
          <Link
            href={`/sambers/produk/${row.id}/edit`}
            className="px-2 py-1 rounded text-xs bg-[#EEEDFE] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => setDeleteId(row.id)}
            className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produk</h1>
          <p className="text-sm text-slate-500 mt-1">{total} produk ditemukan</p>
        </div>
        <Link
          href="/sambers/produk/baru"
          className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#534AB7]"
        />
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#534AB7]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#534AB7]"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={products}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="Tidak ada produk."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              ← Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        message="Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
