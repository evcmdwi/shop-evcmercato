'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/admin/AdminForm'
import { toast } from '@/components/admin/Toast'
import ImageUploader from '@/components/admin/ImageUploader'
import VariantImageUploader from '@/components/admin/VariantImageUploader'

interface Category {
  id: string
  name: string
}

interface VariantRow {
  name: string
  price: string
  stock: string
  image_url: string
}

interface FormErrors {
  name?: string
  price?: string
  stock?: string
  category_id?: string
  variants?: string
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
    is_active: true,
  })

  const [images, setImages] = useState<string[]>([])
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<VariantRow[]>([{ name: '', price: '', stock: '', image_url: '' }])
  const [dragVariantIdx, setDragVariantIdx] = useState<number | null>(null)
  const [initialSoldCount, setInitialSoldCount] = useState(0)

  useEffect(() => {
    fetch('/api/sambers/categories?limit=100')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
      .catch(() => {})
  }, [])

  function addVariant() {
    setVariants([...variants, { name: '', price: '', stock: '', image_url: '' }])
  }

  function removeVariant(index: number) {
    if (variants.length === 1) return
    setVariants(variants.filter((_, i) => i !== index))
  }

  function updateVariant(index: number, field: keyof VariantRow, value: string) {
    const next = [...variants]
    next[index] = { ...next[index], [field]: value }
    setVariants(next)
  }

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Nama produk wajib diisi'
    if (!form.category_id) errs.category_id = 'Kategori wajib dipilih'
    if (!hasVariants) {
      if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
        errs.price = 'Harga harus lebih dari 0'
      if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
        errs.stock = 'Stok tidak boleh negatif'
    } else {
      const invalid = variants.some((v) => !v.name.trim() || !v.price || Number(v.price) <= 0)
      if (invalid) errs.variants = 'Semua varian harus punya nama dan harga'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/sambers/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category_id: form.category_id,
          is_active: form.is_active,
          images: images.filter(Boolean),
          has_variants: hasVariants,
          price: hasVariants ? 0 : Number(form.price),
          stock: hasVariants ? 0 : Number(form.stock),
          initial_sold_count: initialSoldCount,
          variants: hasVariants
            ? variants.map((v) => ({ name: v.name, price: Number(v.price), stock: Number(v.stock), image_url: v.image_url || null }))
            : [],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Gagal menambah produk')
      }
      toast('Produk berhasil ditambahkan', 'success')
      router.push('/sambers/produk')
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

        <FormField label="Kategori" required error={errors.category_id}>
          <Select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            placeholder="Pilih kategori"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={!!errors.category_id}
          />
        </FormField>

        {/* Images */}
        <ImageUploader
          value={images}
          onChange={setImages}
          maxImages={5}
          label="Foto Produk"
        />

        {/* Has Variants */}
        <FormField label="Produk Memiliki Varian?">
          <Toggle
            checked={hasVariants}
            onChange={(v) => setHasVariants(v)}
            label={hasVariants ? 'Ya, produk ini punya varian' : 'Tidak, satu harga & stok'}
          />
        </FormField>

        {/* Price & Stock */}
        {!hasVariants && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Harga (Rp)" required error={errors.price}>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" error={!!errors.price} />
            </FormField>
            <FormField label="Stok" required error={errors.stock}>
              <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" error={!!errors.stock} />
            </FormField>
          </div>
        )}

        {/* Variants table */}
        {hasVariants && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Varian Produk</label>
            {errors.variants && <p className="text-xs text-red-500 mb-2">{errors.variants}</p>}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-8 px-2 py-2"></th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Nama Varian</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Harga (Rp)</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Stok</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Foto</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr
                      key={idx}
                      draggable
                      onDragStart={() => setDragVariantIdx(idx)}
                      onDragOver={(e) => { e.preventDefault() }}
                      onDrop={() => {
                        if (dragVariantIdx === null || dragVariantIdx === idx) return
                        const next = [...variants]
                        const [moved] = next.splice(dragVariantIdx, 1)
                        next.splice(idx, 0, moved)
                        setVariants(next)
                        setDragVariantIdx(null)
                      }}
                      onDragEnd={() => setDragVariantIdx(null)}
                      className={`border-t border-slate-100 transition-all ${dragVariantIdx === idx ? 'opacity-50 bg-slate-50' : ''}`}
                    >
                      <td className="cursor-grab px-2 text-gray-400 select-none text-lg text-center">⠿</td>
                      <td className="px-3 py-2">
                        <input value={v.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} placeholder="Contoh: 250ml" className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#7FB300]" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} placeholder="0" className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#7FB300]" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} placeholder="0" className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#7FB300]" />
                      </td>
                      <td className="px-3 py-2">
                        <VariantImageUploader
                          value={v.image_url}
                          onChange={(url) => updateVariant(idx, 'image_url', url)}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => removeVariant(idx)} disabled={variants.length === 1} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 disabled:opacity-30 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addVariant} className="mt-2 text-sm text-[#7FB300] hover:underline">+ Tambah Varian</button>
          </div>
        )}

        <FormField label="Sudah Terjual (awal)">
          <input
            type="number"
            min="0"
            value={initialSoldCount}
            onChange={(e) => setInitialSoldCount(Number(e.target.value))}
            placeholder="0"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#7FB300]"
          />
          <p className="text-xs text-gray-400 mt-1">Counter terjual sebelum penjualan via shop. Auto-bertambah saat ada order baru.</p>
        </FormField>

        <FormField label="Status">
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Batal</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#7FB300] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] disabled:opacity-50">
            {submitting ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </div>
      </form>
    </div>
  )
}
