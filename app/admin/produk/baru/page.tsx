'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/admin/AdminForm'
import { toast } from '@/components/admin/Toast'

interface Category {
  id: string
  name: string
}

interface FormErrors {
  name?: string
  price?: string
  stock?: string
  category_id?: string
}

export default function TambahProdukPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: '',
    is_active: true,
  })

  useEffect(() => {
    fetch('/api/admin/categories?limit=100')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
      .catch(() => {})
  }, [])

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Nama produk wajib diisi'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = 'Harga harus lebih dari 0'
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errs.stock = 'Stok tidak boleh negatif'
    if (!form.category_id) errs.category_id = 'Kategori wajib dipilih'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          category_id: form.category_id,
          image_url: form.image_url || null,
          is_active: form.is_active,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Gagal menambah produk')
      }
      toast('Produk berhasil ditambahkan', 'success')
      router.push('/admin/produk')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Gagal menambah produk', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tambah Produk</h1>
        <p className="text-sm text-slate-500 mt-1">Isi detail produk baru</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <FormField label="Nama Produk" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Masukkan nama produk"
            error={!!errors.name}
          />
        </FormField>

        <FormField label="Deskripsi">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi produk (opsional)"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Harga (Rp)" required error={errors.price}>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0"
              error={!!errors.price}
            />
          </FormField>

          <FormField label="Stok" required error={errors.stock}>
            <Input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="0"
              error={!!errors.stock}
            />
          </FormField>
        </div>

        <FormField label="Kategori" required error={errors.category_id}>
          <Select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            placeholder="Pilih kategori"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={!!errors.category_id}
          />
        </FormField>

        <FormField label="URL Gambar">
          <Input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
            label={form.is_active ? 'Aktif' : 'Nonaktif'}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </div>
      </form>
    </div>
  )
}
