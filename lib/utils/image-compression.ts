import imageCompression from 'browser-image-compression'

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  reductionPercent: number
  format: string
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export async function compressProductImage(file: File): Promise<CompressionResult> {
  // Skip jika sudah kecil
  if (file.size < 100 * 1024) {
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      reductionPercent: 0,
      format: file.type,
    }
  }

  const opts = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.75,
  }

  try {
    const compressed = await imageCompression(file, opts)
    return {
      compressedFile: compressed,
      originalSize: file.size,
      compressedSize: compressed.size,
      reductionPercent: Math.round(((file.size - compressed.size) / file.size) * 100),
      format: compressed.type,
    }
  } catch {
    // Fallback ke JPEG
    try {
      const compressed = await imageCompression(file, { ...opts, fileType: 'image/jpeg' as const })
      return {
        compressedFile: compressed,
        originalSize: file.size,
        compressedSize: compressed.size,
        reductionPercent: Math.round(((file.size - compressed.size) / file.size) * 100),
        format: compressed.type,
      }
    } catch {
      // Upload original kalau semua gagal
      return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        reductionPercent: 0,
        format: file.type,
      }
    }
  }
}
