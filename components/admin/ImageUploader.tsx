'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { compressProductImage, formatBytes, type CompressionResult } from '@/lib/utils/image-compression'

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  label?: string
}

export default function ImageUploader({ value, onChange, maxImages = 5, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = async (files: File[]) => {
    if (!files.length) return

    // Validate file type
    const validFiles = files.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
    if (validFiles.length === 0) {
      setError('Format tidak didukung. Gunakan JPEG, PNG, atau WebP.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Reject files over 20MB
    const oversized = validFiles.filter(f => f.size > 20 * 1024 * 1024)
    if (oversized.length > 0) {
      setError('Ukuran file maksimal 20 MB per foto.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const remaining = maxImages - value.length
    const filesToProcess = validFiles.slice(0, remaining)

    setError(null)
    setCompressionResults([])
    setIsCompressing(true)

    let compressedFiles: File[] = []
    try {
      const results: CompressionResult[] = []

      for (const file of filesToProcess) {
        const result = await compressProductImage(file)
        results.push(result)
        compressedFiles.push(result.compressedFile)
      }

      setCompressionResults(results)
    } catch {
      // If compression pipeline itself fails, fall back to originals
      compressedFiles = filesToProcess
    } finally {
      setIsCompressing(false)
    }

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of compressedFiles) {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await handleFilesSelected(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )
    if (files.length > 0) {
      await handleFilesSelected(files)
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

  const isBusy = isCompressing || uploading

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

      {/* Upload zone */}
      {value.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={isBusy}
            className="hidden"
          />
          <div
            onDragOver={isBusy ? undefined : handleDragOver}
            onDragLeave={isBusy ? undefined : handleDragLeave}
            onDrop={isBusy ? undefined : handleDrop}
            onClick={() => !isBusy && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isBusy
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : isDragging
                ? 'border-[#7FB300] bg-[#E8F4D1] scale-[1.02] cursor-copy'
                : 'border-gray-300 hover:border-[#7FB300] hover:bg-gray-50 cursor-pointer'
            }`}
          >
            {isCompressing ? (
              <>
                <div className="text-4xl mb-2">🔄</div>
                <p className="text-sm font-medium text-gray-500">Mengoptimalkan gambar...</p>
              </>
            ) : uploading ? (
              <>
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-sm font-medium text-gray-500">Mengupload...</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">{isDragging ? '📂' : '📸'}</div>
                <p className="text-sm font-medium text-gray-700">
                  {isDragging ? 'Lepaskan untuk upload' : 'Drag & drop foto di sini'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  atau <span className="text-[#7FB300] font-medium">klik untuk pilih file</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG, WebP • Maks 20 MB per file • ({value.length}/{maxImages})
                </p>
              </>
            )}
          </div>

          {/* Compression loading state (below drop zone) */}
          {isCompressing && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-[#7FB300] border-t-transparent rounded-full animate-spin" />
              <span>Mengoptimalkan gambar...</span>
            </div>
          )}

          {/* Compression results */}
          {compressionResults.length > 0 && !isCompressing && (
            <div className="mt-2 space-y-1">
              {compressionResults.map((r, i) => (
                <div key={i} className="text-xs text-gray-500">
                  {r.reductionPercent > 0
                    ? `✓ Dioptimalkan: ${formatBytes(r.originalSize)} → ${formatBytes(r.compressedSize)} (hemat ${r.reductionPercent}%)`
                    : `✓ Sudah optimal (${formatBytes(r.compressedSize)})`
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
