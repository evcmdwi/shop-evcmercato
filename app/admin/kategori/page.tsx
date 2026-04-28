'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminTable from '@/components/admin/AdminTable'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { toast } from '@/components/admin/Toast'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  product_count?: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function AdminKategoriPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', slug: '', description: '' })
  const [addErrors, setAddErrors] = useState<{ name?: string }>({})
  const [addLoading, setAddLoading] = useState(false)

  // Edit inline
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' })
  const [editLoading, setEditLoading] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories?limit=100')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setCategories(json.data ?? [])
    } catch {
      toast('Gagal memuat kategori', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Auto slug on name change
  useEffect(() => {
    setAddForm((f) => ({ ...f, slug: slugify(f.name) }))
  }, [addForm.name])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const errs: { name?: string } = {}
    if (!addForm.name.trim()) errs.name = 'Nama kategori wajib diisi'
    setAddErrors(errs)
    if (Object.keys(errs).length > 0) return

    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Gagal menambah kategori')
      }
      toast('Kategori berhasil ditambahkan', 'success')
      setAddForm({ name: '', slug: '', description: '' })
      setShowAddForm(false)
      fetchCategories()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Gagal menambah kategori', 'error')
    } finally {
      setAddLoading(false)
    }
  }

  function startEdit(cat: Category) {
    setEditId(cat.id)
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '' })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      toast('Kategori berhasil diperbarui', 'success')
      setEditId(null)
      fetchCategories()
    } catch {
      toast('Gagal memperbarui kategori', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/categories/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast('Kategori berhasil dihapus', 'success')
      setDeleteId(null)
      fetchCategories()
    } catch {
      toast('Gagal menghapus kategori', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Nama' },
    { key: 'slug', header: 'Slug' },
    {
      key: 'description',
      header: 'Deskripsi',
      render: (row: Category) => row.description || '-',
    },
    {
      key: 'product_count',
      header: 'Produk',
      render: (row: Category) => row.product_count ?? 0,
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'w-24',
      render: (row: Category) => (
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(row)}
            className="px-2 py-1 rounded text-xs bg-[#EEEDFE] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-colors"
          >
            Edit
          </button>
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
          <h1 className="text-2xl font-bold text-slate-800">Kategori</h1>
          <p className="text-sm text-slate-500 mt-1">{categories.length} kategori</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kategori
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-[#EEEDFE] rounded-xl border border-[#534AB7]/20 p-5 mb-5 space-y-4"
        >
          <h3 className="font-semibold text-[#534AB7] text-sm">Tambah Kategori Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Nama kategori"
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#534AB7] ${
                  addErrors.name ? 'border-red-400' : 'border-slate-200 bg-white'
                }`}
              />
              {addErrors.name && <p className="text-xs text-red-500 mt-1">{addErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Slug</label>
              <input
                value={addForm.slug}
                onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
                placeholder="slug-otomatis"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#534AB7]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Deskripsi</label>
              <input
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="Opsional"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#534AB7]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="px-5 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] disabled:opacity-50"
            >
              {addLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {/* Edit inline form */}
      {editId && (
        <form
          onSubmit={handleEdit}
          className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-5 space-y-4"
        >
          <h3 className="font-semibold text-amber-700 text-sm">Edit Kategori</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Nama</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value, slug: slugify(e.target.value) })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Slug</label>
              <input
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Deskripsi</label>
              <input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditId(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {editLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      <AdminTable
        columns={columns}
        data={categories}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="Belum ada kategori."
      />

      <ConfirmDialog
        open={!!deleteId}
        message="Yakin ingin menghapus kategori ini? Produk yang terkait tidak akan terhapus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
