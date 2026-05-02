'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface VariantImageUploaderProps {
  value: string
  onChange: (url: string) => void
}

export default function VariantImageUploader({ value, onChange }: VariantImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File terlalu besar. Maks 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPEG, PNG, atau WebP.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/sambers/upload', {
        method: 'POST',
        body: formData,
      })

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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    const urlToDelete = value
    onChange('')

    if (urlToDelete.includes('supabase.co')) {
      try {
        await fetch('/api/sambers/delete-image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToDelete }),
        })
      } catch {
        console.error('Failed to delete image from storage')
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      {value ? (
        <div className="relative group w-10 h-10 shrink-0">
          <Image
            src={value}
            alt="Foto varian"
            fill
            className="object-cover rounded border border-gray-200"
          />
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`variant-upload-${Math.random().toString(36).slice(2)}`}
          />
          <label
            htmlFor={fileInputRef.current?.id}
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-dashed text-xs cursor-pointer
              ${uploading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-[#534AB7] text-[#534AB7] hover:bg-[#EEEDFE]'
              }`}
          >
            {uploading ? '⏳' : '📷'}
          </label>
        </>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
