'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  label?: string
}

export default function ImageUploader({ value, onChange, maxImages = 5, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Validate file size and type
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" terlalu besar. Maks 5 MB per file.`)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`File "${file.name}" format tidak didukung. Gunakan JPEG, PNG, atau WebP.`)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
    }

    const remaining = maxImages - value.length
    const filesToUpload = files.slice(0, remaining)

    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/sambers/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Upload gagal')
          break
        }

        uploadedUrls.push(data.url)
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls])
      }
    } catch {
      setError('Gagal upload gambar. Coba lagi.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (urlToDelete: string, index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)

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
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {value.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Gambar ${index + 1}`}
                fill
                className="object-cover rounded-lg border border-gray-200"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 text-xs bg-[#7FB300] text-white px-1 rounded">
                  Utama
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(url, index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer
              ${uploading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-[#7FB300] text-[#7FB300] hover:bg-[#E8F4D1]'
              }`}
          >
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span>
                Mengupload...
              </>
            ) : (
              <>
                📷 {value.length === 0 ? 'Upload Gambar' : '+ Tambah Gambar'}
                <span className="text-xs text-gray-400">({value.length}/{maxImages})</span>
              </>
            )}
          </label>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP • Maks 5 MB per file</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
