'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FEATURED_LIMIT } from '@/lib/catalog'

interface Item {
  id: string
  name: string
  image_url: string | null
  category: string | null
  price: number
}

/** Data yang dibawa saat drag: kartu di slot (index) atau produk dari daftar (id). */
type DragData = { from: 'slot'; index: number } | { from: 'list'; id: string }

// Produk tanpa foto → kotak abu-abu (latar bg-gray-100).
const EMPTY_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')

export default function SusunProdukUnggulanPage() {
  const [products, setProducts] = useState<Item[]>([])
  const [ids, setIds] = useState<string[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [query, setQuery] = useState('')
  const [dragOver, setDragOver] = useState<number | null>(null)
  const drag = useRef<DragData | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/sambers/featured-products')
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMessage({ ok: false, text: d.error ?? 'Gagal memuat produk' })
    } else {
      const list: Item[] = d.products ?? []
      const active = new Set(list.map((p) => p.id))
      setProducts(list)
      // Produk pilihan yang sudah nonaktif/dihapus langsung dikeluarkan (tersimpan saat Simpan).
      setIds((d.ids ?? []).filter((id: string) => active.has(id)))
      setSavedIds(d.ids ?? [])
    }
    setLoading(false)
  }, [])

  // Muat pertama kali — setState hanya di dalam callback async (aturan react-hooks).
  const loadRef = useRef(load)
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) loadRef.current() })
    return () => { cancelled = true }
  }, [])

  const dirty = ids.join() !== savedIds.join()
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  // Produk pilihan yang masih aktif, lalu sisa slot diisi urutan otomatis (sama dengan beranda).
  const manual = ids.map((id) => byId.get(id)).filter((p): p is Item => !!p)
  const auto = products.filter((p) => !ids.includes(p.id)).slice(0, FEATURED_LIMIT - manual.length)
  const autoRank = useMemo(() => new Map(products.map((p, i) => [p.id, i + 1])), [products])

  const change = (next: string[]) => {
    setIds(next)
    setMessage(null)
  }
  const add = (id: string, at = ids.length) => {
    if (ids.includes(id)) return
    const next = [...ids]
    if (next.length >= FEATURED_LIMIT) next.splice(Math.min(at, FEATURED_LIMIT - 1), 1, id)
    else next.splice(Math.min(at, next.length), 0, id)
    change(next)
  }
  const move = (from: number, to: number) => {
    const t = Math.max(0, Math.min(to, ids.length - 1))
    if (from === t) return
    const next = [...ids]
    const [x] = next.splice(from, 1)
    next.splice(t, 0, x)
    change(next)
  }
  const remove = (i: number) => change(ids.filter((_, j) => j !== i))

  const onDrop = (slot: number) => {
    const d = drag.current
    drag.current = null
    setDragOver(null)
    if (!d) return
    if (d.from === 'slot') move(d.index, slot)
    else add(d.id, slot)
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/sambers/featured-products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setMessage({ ok: false, text: d.error ?? 'Gagal menyimpan' })
      return
    }
    setSavedIds(ids)
    setMessage({ ok: true, text: 'Tersimpan. Beranda sudah memakai urutan baru.' })
  }

  const q = query.trim().toLowerCase()
  const list = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tampilan Toko</p>
          <h1 className="text-2xl font-bold text-slate-800">⭐ Susun Produk Unggulan</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            {FEATURED_LIMIT} produk di bagian &ldquo;Paling sering dibeli ulang&rdquo; beranda, urut dari kiri.
            Seret kartu untuk mengubah urutan, atau seret produk dari daftar di bawah ke slot. Slot kosong
            diisi otomatis dari produk yang paling sering dibeli ulang.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/#terlaris"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#7FB300] text-[#7FB300] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E8F4D1]"
          >
            Lihat beranda
          </a>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#6B9700] disabled:opacity-40"
          >
            {saving ? 'Menyimpan...' : 'Simpan urutan'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl p-3 text-sm ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat...</div>
      ) : (
        <>
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold text-slate-700">
                Tampil di beranda {dirty && <span className="ml-1 text-xs font-medium text-amber-600">• belum disimpan</span>}
              </h2>
              {ids.length > 0 && (
                <button
                  onClick={() => confirm('Kosongkan semua slot? Beranda akan memakai urutan otomatis.') && change([])}
                  className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-red-500"
                >
                  Kosongkan (pakai otomatis)
                </button>
              )}
            </div>
            <ol className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {Array.from({ length: FEATURED_LIMIT }, (_, slot) => {
                const isManual = slot < manual.length
                const p = isManual ? manual[slot] : auto[slot - manual.length]
                return (
                  <li
                    key={slot}
                    draggable={isManual}
                    onDragStart={(e) => {
                      drag.current = { from: 'slot', index: slot }
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => { drag.current = null; setDragOver(null) }}
                    onDragOver={(e) => { if (drag.current) { e.preventDefault(); setDragOver(slot) } }}
                    onDragLeave={() => setDragOver((s) => (s === slot ? null : s))}
                    onDrop={(e) => { e.preventDefault(); onDrop(slot) }}
                    className={`relative flex flex-col rounded-xl border-2 p-2 transition ${
                      dragOver === slot
                        ? 'border-[#7FB300] bg-[#F4FAE8]'
                        : isManual
                          ? 'border-gray-200 bg-white cursor-grab active:cursor-grabbing'
                          : 'border-dashed border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span
                      className={`absolute left-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isManual ? 'bg-[#7FB300] text-white' : 'bg-white text-slate-400 border border-gray-200'
                      }`}
                    >
                      {slot + 1}
                    </span>
                    {p ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image_url || EMPTY_IMG}
                          alt=""
                          draggable={false}
                          className={`aspect-square w-full rounded-lg object-cover bg-gray-100 ${isManual ? '' : 'opacity-50'}`}
                        />
                        <div className={`mt-2 line-clamp-2 text-xs font-medium leading-snug ${isManual ? 'text-slate-800' : 'text-slate-400'}`}>
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{rupiah(p.price)}</div>
                        {isManual ? (
                          <div className="mt-auto flex items-center gap-1 pt-2">
                            <button
                              onClick={() => move(slot, slot - 1)}
                              disabled={slot === 0}
                              aria-label="Geser ke kiri"
                              className="h-7 flex-1 rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-100"
                            >◀</button>
                            <button
                              onClick={() => move(slot, slot + 1)}
                              disabled={slot === manual.length - 1}
                              aria-label="Geser ke kanan"
                              className="h-7 flex-1 rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-100"
                            >▶</button>
                            <button
                              onClick={() => remove(slot)}
                              aria-label={`Keluarkan ${p.name}`}
                              className="h-7 flex-1 rounded-lg border border-red-100 text-xs text-red-500 hover:bg-red-50"
                            >✕</button>
                          </div>
                        ) : (
                          <div className="mt-auto pt-2">
                            <div className="text-[11px] font-semibold text-slate-400">Otomatis</div>
                            <button
                              onClick={() => add(p.id)}
                              className="mt-1 h-7 w-full rounded-lg border border-[#7FB300] text-xs font-semibold text-[#7FB300] hover:bg-[#E8F4D1]"
                            >
                              Kunci di sini
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-center text-xs text-slate-400">
                        Seret produk ke sini
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
            <p className="mt-3 text-xs text-slate-400">
              Kartu hijau = pilihan Anda. Kartu pudar = diisi otomatis (bisa berubah sesuai penjualan); klik
              &ldquo;Kunci di sini&rdquo; agar tetap.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold text-slate-700">Semua produk aktif ({products.length})</h2>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau kategori..."
                className="w-full sm:w-64 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#7FB300] focus:outline-none"
              />
            </div>
            {list.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Tidak ada produk yang cocok.</div>
            ) : (
              <ul className="max-h-[55vh] overflow-y-auto divide-y divide-gray-100 pr-1">
                {list.map((p) => {
                  const pos = ids.indexOf(p.id)
                  return (
                    <li
                      key={p.id}
                      draggable={pos < 0}
                      onDragStart={(e) => {
                        drag.current = { from: 'list', id: p.id }
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => { drag.current = null; setDragOver(null) }}
                      className={`flex items-center gap-3 py-2 ${pos < 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url || EMPTY_IMG}
                        alt=""
                        draggable={false}
                        className="h-11 w-11 shrink-0 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">
                          {p.category ?? 'Tanpa kategori'} · {rupiah(p.price)} · peringkat otomatis #{autoRank.get(p.id)}
                        </div>
                      </div>
                      {pos >= 0 ? (
                        <span className="shrink-0 rounded-full bg-[#E8F4D1] px-2.5 py-1 text-xs font-semibold text-[#5E8500]">
                          Slot {pos + 1}
                        </span>
                      ) : (
                        <button
                          onClick={() => add(p.id)}
                          disabled={ids.length >= FEATURED_LIMIT}
                          title={ids.length >= FEATURED_LIMIT ? 'Slot penuh — keluarkan satu produk dulu, atau seret ke slot untuk mengganti' : undefined}
                          className="shrink-0 rounded-lg border border-[#7FB300] px-3 py-1.5 text-xs font-semibold text-[#7FB300] hover:bg-[#E8F4D1] disabled:opacity-30"
                        >
                          + Tambah
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
