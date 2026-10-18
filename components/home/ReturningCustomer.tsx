'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useCartContext } from '@/components/CartContext'
import { toast } from '@/components/Toast'
import { formatRupiah } from '@/lib/utils'

interface ReorderProduct {
  product_id: string
  variant_id: string | null
  name: string
  variant_name: string | null
  price: number
  image: string | null
  in_stock: boolean
  last_quantity: number
}

interface HomeData {
  name: string | null
  total_points: number
  next_reward: { id: string; title: string; points_required: number } | null
  last_order_id: string | null
  products: ReorderProduct[]
}

const CARD = 'rounded-[16px] border border-evc-border bg-evc-surface'

/**
 * Beranda Fase 2 — hanya untuk pelanggan login: saldo EVC Points + progres hadiah,
 * dan "Pesan lagi produk Anda" dari riwayat pesanan lunas. Dirender di klien agar
 * halaman beranda tetap ter-cache untuk pengunjung.
 */
export default function ReturningCustomer() {
  const { user } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch('/api/user/home')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user])

  if (!user || !data) return null

  const firstName = (data.name ?? '').trim().split(/\s+/)[0]

  return (
    <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <PointsCard firstName={firstName} points={data.total_points} reward={data.next_reward} />
      <ReorderCard products={data.products} lastOrderId={data.last_order_id} />
    </section>
  )
}

function PointsCard({ firstName, points, reward }: { firstName: string; points: number; reward: HomeData['next_reward'] }) {
  const pct = reward ? Math.min(100, Math.round((points / reward.points_required) * 100)) : 0
  const remaining = reward ? Math.max(0, reward.points_required - points) : 0

  return (
    <div className={`${CARD} flex flex-col p-5`}>
      <p className="text-sm text-evc-muted">Halo{firstName ? `, ${firstName}` : ''} 👋</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-evc-muted">Saldo EVC Points</p>
      <p className="text-3xl font-extrabold text-evc-green">
        {points.toLocaleString('id-ID')} <span className="text-base font-bold">poin</span>
      </p>

      {reward ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-evc-ground" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-evc-green" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-evc-muted">
            {remaining > 0 ? (
              <>Kurang <strong className="text-evc-ink">{remaining.toLocaleString('id-ID')} poin</strong> lagi untuk {reward.title} gratis</>
            ) : (
              <>Poin Anda cukup untuk <strong className="text-evc-ink">{reward.title}</strong> gratis 🎉</>
            )}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-evc-muted">Setiap belanja Rp1.000 = 1 poin. Kumpulkan untuk ditukar produk gratis.</p>
      )}

      <Link
        href="/poin"
        prefetch={false}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-evc-green px-4 text-sm font-bold text-evc-green hover:bg-evc-green-tint md:mt-auto"
      >
        {reward && remaining === 0 ? 'Tukar poin sekarang' : 'Lihat poin & hadiah'}
      </Link>
    </div>
  )
}

function ReorderCard({ products, lastOrderId }: { products: ReorderProduct[]; lastOrderId: string | null }) {
  const router = useRouter()
  const { addItem } = useCartContext()
  const [busy, setBusy] = useState<string | null>(null)

  if (products.length === 0) {
    return (
      <div className={`${CARD} flex flex-col justify-center p-5`}>
        <h2 className="text-lg font-extrabold text-evc-ink">Pesan lagi produk Anda</h2>
        <p className="mt-1 text-sm text-evc-muted">Produk yang pernah Anda beli akan muncul di sini, supaya pesan ulang cukup sekali klik.</p>
        <a href="#terlaris" className="mt-3 text-sm font-semibold text-evc-green underline underline-offset-4">Lihat produk terlaris</a>
      </div>
    )
  }

  const add = async (p: ReorderProduct) => {
    const key = `${p.product_id}:${p.variant_id ?? ''}`
    setBusy(key)
    try {
      await addItem(p.product_id, p.variant_id, 1)
      toast.show({
        type: 'success',
        message: 'Ditambahkan ke keranjang ✓',
        action: { label: 'Lihat Keranjang →', href: '/keranjang' },
        duration: 4000,
      })
    } catch (err: unknown) {
      toast.show({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang' })
    } finally {
      setBusy(null)
    }
  }

  const reorderAll = async () => {
    if (!lastOrderId) return
    setBusy('all')
    try {
      const res = await fetch('/api/cart/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: lastOrderId }),
      })
      if (res.ok) {
        router.push('/keranjang')
        return
      }
      const json = await res.json().catch(() => ({}))
      toast.show({ type: 'error', message: json.error ?? 'Gagal memesan ulang' })
    } catch {
      toast.show({ type: 'error', message: 'Terjadi kesalahan. Coba lagi.' })
    }
    setBusy(null)
  }

  return (
    <div className={`${CARD} min-w-0 p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-extrabold text-evc-ink">Pesan lagi produk Anda</h2>
        {lastOrderId && (
          <button
            type="button"
            onClick={reorderAll}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-evc-green underline underline-offset-4 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {busy === 'all' ? 'Memproses…' : 'Ulangi pesanan terakhir'}
          </button>
        )}
      </div>

      <ul className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
        {products.map((p) => {
          const key = `${p.product_id}:${p.variant_id ?? ''}`
          return (
            <li key={key} className="w-[148px] shrink-0 snap-start rounded-[12px] border border-evc-border p-2">
              <div className="relative aspect-square overflow-hidden rounded-[8px] bg-evc-ground">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="148px" className="object-cover" />}
              </div>
              <p className="mt-2 line-clamp-2 min-h-[2.5em] text-xs font-semibold leading-tight text-evc-ink">{p.name}</p>
              <p className="truncate text-[11px] text-evc-muted">{p.variant_name ?? ' '}</p>
              <p className="text-sm font-bold text-evc-ink">{formatRupiah(p.price)}</p>
              <button
                type="button"
                onClick={() => add(p)}
                disabled={!p.in_stock || busy !== null}
                className="mt-1.5 flex min-h-[40px] w-full items-center justify-center rounded-[10px] bg-evc-green text-xs font-bold text-white hover:bg-evc-green-dark disabled:bg-evc-ground disabled:text-evc-muted"
              >
                {!p.in_stock ? 'Stok habis' : busy === key ? 'Menambahkan…' : 'Pesan lagi'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
