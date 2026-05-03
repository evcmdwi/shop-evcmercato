'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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

export default function EditProdukPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [initialSoldCount, setInitialSoldCount] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    // Fetch product data — API returns flat JSON (no data wrapper)
    fetch(`/api/sambers/products/${id}`)
      .then(r => r.json())
      .then((product) => {
        if (product.error) return
        setName(product.name ?? '')
        setDescription(product.description ?? '')
        setCategoryId(product.category_id ?? '')
        const imgs: string[] = Array.isArray(product.images) && product.images.length > 0
          ? product.images.filter(Boolean)
          : product.image_url
          ? [product.image_url]
          : []
        setImages(imgs)
        const vars = product.product_variants ?? []
        setHasVariants(vars.length > 0 || !!product.has_variants)
        if (vars.length > 0) {
          setVariants(vars.map((v: { name: string; price: number; stock: number; image_url?: string | null }) => ({
            name: v.name ?? '',
            price: String(v.price ?? 0),
            stock: String(v.stock ?? 0),
            image_url: v.image_url ?? '',
          })))
        }
        setPrice(product.price ?? 0)
        setStock(product.stock ?? 0)
        setInitialSoldCount(product.initial_sold_count ?? 0)
        setIsActive(product.is_active ?? true)
      })
      .finally(() => setLoading(false))

    // Fetch categories
    fetch('/api/sambers/categories?limit=100')
      .then(r => r.json())
      .then(({ data }) => setCategories(data ?? []))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name,
        description,
        category_id: categoryId,
        images,
        image_url: images[0] || null,
        has_variants: hasVariants,
        price: hasVariants ? 0 : price,
        stock: hasVariants ? 0 : stock,
        initial_sold_count: initialSoldCount,
        is_active: isActive,
        variants: hasVariants
          ? variants.map((v, i) => ({
              name: v.name,
              price: Number(v.price),
              stock: Number(v.stock),
              image_url: v.image_url || null,
              sort_order: i,
              is_active: true,
            }))
          : [],
      }
      const res = await fetch(`/api/sambers/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) router.push('/sambers/produk')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-[#534AB7] hover:underline text-sm">
          ← Kembali
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Produk</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#534AB7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#534AB7] focus:outline-none"
          >
            <option value="">-- Pilih Kategori --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#534AB7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto Produk</label>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                  {i === 0 && (
                    <span className="absolute -top-1 -left-1 text-[9px] bg-[#534AB7] text-white px-1 rounded">
                      Utama
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="url"
            placeholder="Tambah URL gambar baru (Enter)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const v = (e.target as HTMLInputElement).value.trim()
                if (v && images.length < 5) {
                  setImages([...images, v])
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="hasVariants"
            checked={hasVariants}
            onChange={e => setHasVariants(e.target.checked)}
            className="w-4 h-4 accent-[#534AB7]"
          />
          <label htmlFor="hasVariants" className="text-sm font-medium text-gray-700">
            Produk Memiliki Varian (ukuran, rasa, dll)
          </label>
        </div>

        {hasVariants ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Daftar Varian</label>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={v.name}
                    onChange={e => {
                      const n = [...variants]
                      n[i] = { ...n[i], name: e.target.value }
                      setVariants(n)
                    }}
                    placeholder="Nama varian"
                    className="flex-1 border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#534AB7]"
                  />
                  <input
                    value={v.price}
                    onChange={e => {
                      const n = [...variants]
                      n[i] = { ...n[i], price: e.target.value }
                      setVariants(n)
                    }}
                    placeholder="Harga"
                    type="number"
                    className="w-28 border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#534AB7]"
                  />
                  <input
                    value={v.stock}
                    onChange={e => {
                      const n = [...variants]
                      n[i] = { ...n[i], stock: e.target.value }
                      setVariants(n)
                    }}
                    placeholder="Stok"
                    type="number"
                    className="w-20 border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#534AB7]"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 px-2 text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVariants([...variants, { name: '', price: '', stock: '', image_url: '' }])}
              className="mt-2 text-sm text-[#534AB7] hover:underline"
            >
              + Tambah Varian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
              <input
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                type="number"
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#534AB7] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
              <input
                value={stock}
                onChange={e => setStock(Number(e.target.value))}
                type="number"
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-[#534AB7] focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-[#534AB7]"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Produk Aktif (tampil di katalog)
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#534AB7] text-white py-3 rounded-xl font-semibold hover:bg-[#4238a0] disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
