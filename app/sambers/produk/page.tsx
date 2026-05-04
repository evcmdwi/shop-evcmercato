'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { toast } from '@/components/admin/Toast'

interface Category {
  id: string
  name: string
}

interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  image_url: string | null
  category: Category | null
  categories: Category | null
  product_variants?: ProductVariant[]
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

function getDisplayPrice(product: Product): string {
  const variants = product.product_variants ?? []
  if (variants.length > 0) {
    const prices = variants.filter(v => v.is_active).map(v => v.price)
    if (prices.length === 0) return formatRupiah(product.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`
  }
  return formatRupiah(product.price)
}

function getDisplayStock(product: Product): number {
  const variants = product.product_variants ?? []
  if (variants.length > 0) {
    return variants.filter(v => v.is_active).reduce((sum, v) => sum + (v.stock || 0), 0)
  }
  return product.stock ?? 0
}

interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  totalPages: number
  meta?: { page: number; limit: number; total: number }
}

const PAGE_SIZE = 30

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
      setTotal(json.total ?? json.meta?.total ?? 0)
    } catch {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produk</h1>
          <p className="text-sm text-slate-500 mt-1">{total} produk ditemukan</p>
        </div>
        <Link
          href="/sambers/produk/baru"
          className="px-4 py-2 bg-[#7FB300] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] transition-colors flex items-center gap-2"
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
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#7FB300]"
        />
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#7FB300]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#7FB300]"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap w-16">Gambar</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Nama Produk</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Kategori</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Harga</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Stok</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada produk.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <>
                    {/* Main product row */}
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-middle w-16">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium text-slate-800">{product.name}</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">
                        {(product.category ?? product.categories)?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">
                        {getDisplayPrice(product)}
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">
                        {getDisplayStock(product)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.is_active
                              ? 'bg-emerald-50 text-[#1D9E75]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle w-24">
                        <div className="flex gap-2">
                          <Link
                            href={`/sambers/produk/${product.id}/edit`}
                            className="px-2 py-1 rounded text-xs bg-[#E8F4D1] text-[#7FB300] hover:bg-[#7FB300] hover:text-white transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="px-2 py-1 rounded text-xs bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Variant sub-rows */}
                    {(product.product_variants ?? []).map((variant) => (
                      <tr key={`variant-${variant.id}`} className="bg-gray-50 border-t border-gray-100">
                        <td className="px-4 py-2 align-middle"></td>
                        <td className="px-4 py-2 align-middle pl-10">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">↳</span>
                            <span className="text-sm text-gray-700">{variant.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 align-middle"></td>
                        <td className="px-4 py-2 align-middle text-sm text-gray-700">
                          {formatRupiah(variant.price)}
                        </td>
                        <td className="px-4 py-2 align-middle text-sm text-gray-700">
                          {variant.stock}
                        </td>
                        <td className="px-4 py-2 align-middle"></td>
                        <td className="px-4 py-2 align-middle"></td>
                      </tr>
                    ))}
                  </>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

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
