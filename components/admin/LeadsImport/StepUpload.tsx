'use client'

import { useRef, useState } from 'react'

interface StepUploadProps {
  onColumnsReady: (columns: { name: string; samples: string[] }[]) => void
}

export default function StepUpload({ onColumnsReady }: StepUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const processFile = async (file: File) => {
    setError('')

    // Validate type
    if (!file.name.endsWith('.xlsx') && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setError('Hanya file .xlsx yang diizinkan.')
      return
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5 MB.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/sambers/leads/preview-columns', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error ${res.status}`)
      }

      const data = await res.json()
      if (!data.columns || !Array.isArray(data.columns)) {
        throw new Error('Format respons tidak valid dari server.')
      }

      onColumnsReady(data.columns)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses file. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Langkah 1 — Upload File</h2>
      <p className="text-sm text-slate-500 mb-6">Upload file Excel (.xlsx) berisi database leads. Maks 5 MB.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors select-none
          ${dragging ? 'border-[#7FB300] bg-green-50' : 'border-slate-200 hover:border-[#7FB300] hover:bg-slate-50'}
          ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#7FB300] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Membaca file & menganalisis kolom...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">📊</div>
            <div>
              <p className="font-semibold text-slate-700">Drag & drop file di sini</p>
              <p className="text-sm text-slate-400 mt-1">atau klik untuk pilih file .xlsx</p>
            </div>
            <span className="mt-2 inline-block px-4 py-2 bg-[#7FB300] text-white text-sm font-semibold rounded-xl hover:bg-[#6B9700] transition-colors">
              Pilih File
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700 mb-2">📋 Tips format file:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-500">
          <li>Baris pertama harus berisi nama kolom (header)</li>
          <li>Minimal harus ada kolom untuk No HP/WA</li>
          <li>Format HP: 08xxxx atau 62xxxx</li>
          <li>Kolom lain (nama, kota) opsional tapi direkomendasikan</li>
        </ul>
      </div>
    </div>
  )
}
