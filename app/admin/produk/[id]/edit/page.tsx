'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FormField, Input, Textarea, Select, Toggle } from '@/components/admin/AdminForm'
import { toast } from '@/components/admin/Toast'

interface Category {
  id: string
  name: string
}

interface VariantRow {
  name: string
  price: string
  stock: string
}

interface FormErrors {
  name?: string
  price?: string
  stock?: string
  category_id?: string
  variants?: string
}

export default function EditProdukPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
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

  const [images, setImages] = useState<string[]>([''])
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<VariantRow[]>([{ name: '', price: '', stock: '' }])

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch('/api/admin/categories?limit=100').then((r) => r.json()),
    ])
      .then(([product, cats]) => {
        if (product.error) throw new Error(product.error)
        setForm({
          name: product.name ?? '',
          description: product.description ?? '',
          price: String(product.price ?? ''),
          stock: String(product.stock ?? ''),
          category_id: product.category_id ?? '',
          is_active: product.is_active ?? true,
        })
        const imgs: string[] =
          Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.image_url
            ? [product.image_url]
            : ['']
        setImages(imgs)
        setHasVariants(product.has_variants ?? false)
        if (product.product_variants && product.product_variants.length > 0) {
          setVariants(
            product.product_variants.map((v: { name: string; price: number; stock: number }) => ({
              name: v.name,
              price: String(v.price),
              stock: String(v.stock),
            }))
          )
        }
        setCategories(cats.data ?? [])
      })
      .catch(() => toast('Gagal memuat data produk', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  function addImage() {
    if (images.length < 5) setImages([...images, ''])
  }

  function removeImage(index: number) {
    if (index === 0) return
    setImages(images.filter((_, i) => i !== index))
  }

  function updateImage(index: number, value: string) {
    const next = [...images]
    next[index] = value
    setImages(next)
  }

  function addVariant() {
    setVariants([...variants, { name: '', price: '', stock: '' }])
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
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
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
          variants: hasVariants
            ? variants.map((v) => ({ name: v.name, price: Number(v.price), stock: Number(v.stock) }))
            : [],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Gagal memperbarui produk')
      }
      toast('Produk berhasil diperbarui', 'success')
      router.push('/admin/produk')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Gagal memperbarui produk', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Edit Produk</h1>
        <p className="text-sm text-slate-500 mt-1">Perbarui detail produk</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <FormField label="Nama Produk" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Masukkan nama produk" error={!!errors.name} />
        </FormField>

        <FormField label="Deskripsi">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk (opsional)" />
        </FormField>

        <FormField label="Kategori" required error={errors.category_id}>
          <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} placeholder="Pilih kategori" options={categories.map((c) => ({ value: c.id, label: c.name }))} error={!!errors.category_id} />
        </FormField>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Gambar Produk</label>
          <div className="space-y-2">
            {images.map((img, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input value={img} onChange={(e) => updateImage(idx, e.target.value)} placeholder={idx === 0 ? 'URL gambar utama (https://...)' : `URL gambar ${idx + 1} (opsional)`} />
                {idx > 0 && (
                  <button type="button" onClick={() => removeImage(idx)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
          {images.length < 5 && (
            <button type="button" onClick={addImage} className="mt-2 text-sm text-[#534AB7] hover:underline">+ Tambah Gambar</button>
          )}
          <p className="text-xs text-slate-400 mt-1">Gambar pertama adalah gambar utama. Maks 5 gambar.</p>
        </div>

        {/* Has Variants */}
        <FormField label="Produk Memiliki Varian?">
          <Toggle checked={hasVariants} onChange={(v) => setHasVariants(v)} label={hasVariants ? 'Ya, produk ini punya varian' : 'Tidak, satu harga & stok'} />
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
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Nama Varian</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Harga (Rp)</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Stok</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <input value={v.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} placeholder="Contoh: 250ml" className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#534AB7]" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} placeholder="0" className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#534AB7]" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} placeholder="0" className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#534AB7]" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => removeVariant(idx)} disabled={variants.length === 1} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 disabled:opacity-30 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addVariant} className="mt-2 text-sm text-[#534AB7] hover:underline">+ Tambah Varian</button>
          </div>
        )}

        <FormField label="Status">
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Batal</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-lg hover:bg-[#4238a3] disabled:opacity-50">
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
