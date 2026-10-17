'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { compressProductImage } from '@/lib/utils/image-compression'

interface VariantImageUploaderProps {
  value: string
  onChange: (url: string) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/** Foto varian: klik atau tarik-lepas (drag & drop) file; foto lama bisa langsung ditimpa. */
export default function VariantImageUploader({ value, onChange }: VariantImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPEG, PNG, atau WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File terlalu besar. Maks 5 MB.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      // Kompres seperti foto produk (WebP, maks 1200px) — gagal kompres → file asli.
      const upload = await compressProductImage(file).then((r) => r.compressedFile).catch(() => file)
      const formData = new FormData()
      formData.append('file', upload)

      const res = await fetch('/api/sambers/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload gagal')
        return
      }
      onChange(data.url)
    } catch {
      setError('Gagal upload gambar. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  // stopPropagation: baris varian juga draggable (ubah urutan) — jangan ikut bereaksi.
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploading) setDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (uploading) return
    const file = Array.from(e.dataTransfer.files)[0]
    if (file) uploadFile(file)
  }

  // Hanya lepas dari form. File di storage TIDAK dihapus: bila form batal disimpan
  // atau foto dipakai di tempat lain, menghapusnya membuat foto rusak di toko.
  const handleDelete = () => {
    onChange('')
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative group shrink-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploading}
          title={value ? 'Klik atau tarik foto baru ke sini untuk mengganti' : 'Klik atau tarik foto ke sini'}
          className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 text-center text-[10px] leading-tight transition-colors ${
            dragging
              ? 'border-[#7FB300] bg-[#E8F4D1] text-[#5B8400]'
              : value
              ? 'border-gray-200'
              : 'border-dashed border-[#7FB300] text-[#7FB300] hover:bg-[#E8F4D1]'
          } ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
        >
          {value && <Image src={value} alt="Foto varian" fill sizes="56px" className="object-cover" />}
          {uploading ? (
            <span className="relative rounded bg-white/80 px-1 text-gray-600">Upload…</span>
          ) : dragging ? (
            <span className="relative rounded bg-white/80 px-1">Lepas</span>
          ) : (
            !value && <span>Tarik / klik foto</span>
          )}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Lepas foto varian"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            ×
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
