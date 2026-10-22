'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

/** Grid 2×2 screenshot ulasan; klik → tampil besar. */
export default function Screenshots({ urls, alt }: { urls: string[]; alt: string }) {
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {urls.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setOpen(u)}
            aria-label={`Lihat besar screenshot ulasan ${i + 1}`}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#E6E4DD] bg-white"
          >
            <Image src={u} alt={`${alt} ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover object-top" />
          </button>
        ))}
      </div>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Tutup"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#1D2A22]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-md">
            <Image src={open} alt={alt} fill sizes="(max-width: 768px) 100vw, 448px" className="object-contain" />
          </div>
        </div>
      )}
    </>
  )
}
