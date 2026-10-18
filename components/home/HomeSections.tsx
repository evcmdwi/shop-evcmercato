import Link from 'next/link'
import { MessageCircle, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { ProductWithCategory } from '@/types/product'
import {
  COMPARISON_ROWS,
  COURIERS,
  FIRST_ORDER_OFFER_TEXT,
  NEED_CARDS,
  PAYMENT_METHODS,
  PROMO_BANNER,
  SIGNUP_STEPS,
  WA_ADMIN_URL,
  type CompareCell,
} from '@/content/homepage'

const CARD = 'rounded-[16px] border border-evc-border bg-evc-surface'
const H2 = 'text-lg font-extrabold text-evc-ink md:text-2xl'

/** "**tebal**" → <strong>. */
function withBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  )
}

// 4.2 ─────────────────────────────────────────────────────────────────
export function TrustStrip() {
  return (
    <div className="bg-evc-green text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-1.5 px-4 py-2 text-center font-extrabold md:flex-row md:gap-5">
        <p className="flex flex-wrap items-center justify-center gap-x-1.5 whitespace-nowrap text-[10px] min-[400px]:text-[11px] min-[400px]:tracking-wide md:text-sm md:gap-x-4">
          {PROMO_BANNER.items.map((item, i) => (
            <span key={item} className="flex items-center gap-1.5 md:gap-4">
              {i > 0 && <span aria-hidden className="opacity-60">·</span>}
              {item}
            </span>
          ))}
        </p>
        <Link
          href={PROMO_BANNER.cta.href}
          prefetch={false}
          className="inline-flex min-h-[32px] items-center rounded-full bg-white px-3 text-[11px] font-extrabold text-evc-green hover:bg-evc-green-tint md:text-xs"
        >
          {PROMO_BANNER.cta.label} →
        </Link>
      </div>
    </div>
  )
}

// 4.3 ─────────────────────────────────────────────────────────────────
export function WelcomeCard() {
  return (
    <section className="rounded-[18px] border border-evc-accent/20 bg-evc-surface p-5 md:p-8">
      <span className="inline-block rounded-full bg-evc-accent-tint px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-evc-accent-dark">
        Khusus pelanggan Shopee &amp; Tokopedia
      </span>
      <h1 className="mt-3 text-[28px] font-extrabold leading-tight text-evc-ink md:max-w-2xl md:text-4xl">
        Produk yang sama, langsung dari distributornya.
      </h1>
      {FIRST_ORDER_OFFER_TEXT && (
        <p className="mt-3 text-[15px] leading-relaxed text-evc-muted md:max-w-xl">{withBold(FIRST_ORDER_OFFER_TEXT)}</p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 md:flex">
        <a
          href="#terlaris"
          className="flex min-h-[48px] items-center justify-center whitespace-nowrap rounded-[12px] bg-evc-accent px-3 md:px-5 text-sm font-bold text-white hover:bg-evc-accent-dark"
        >
          Pesan ulang favorit
        </a>
        <a
          href={WA_ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-evc-border bg-evc-surface px-3 md:px-5 text-sm font-bold text-evc-ink hover:bg-evc-ground"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
          Tanya admin
        </a>
      </div>
    </section>
  )
}

// 4.4 ─────────────────────────────────────────────────────────────────
function MarketplaceBadge({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {letter}
    </span>
  )
}

function Cell({ cell, strong }: { cell: CompareCell; strong?: boolean }) {
  return (
    <>
      <span className={strong ? 'font-bold text-evc-green' : 'text-evc-muted'}>{cell.main}</span>
      {cell.sub && (
        <span className={`block text-[11px] ${strong ? 'font-semibold text-evc-green' : 'text-evc-muted'}`}>{cell.sub}</span>
      )}
    </>
  )
}

export function ComparisonTable() {
  return (
    <section>
      <h2 className={H2}>Belanja langsung dari web resmi EVC</h2>
      <p className="mt-1 text-sm text-evc-muted">Produk yang sama, layanan lebih dekat dengan Anda.</p>
      <div className={`${CARD} mt-3 overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-evc-ground">
              <th scope="col" className="w-[34%] px-3 py-2.5 text-left"><span className="sr-only">Perbandingan</span></th>
              <th scope="col" className="px-2 py-2.5 text-center">
                <span className="inline-flex gap-1" role="img" aria-label="Marketplace: Shopee dan Tokopedia">
                  <MarketplaceBadge letter="S" color="#D9481F" />
                  <MarketplaceBadge letter="T" color="#237A32" />
                </span>
              </th>
              <th scope="col" className="bg-evc-green-tint px-2 py-2.5 text-center font-bold text-evc-green">Web EVC</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-t border-evc-border">
                <th scope="row" className="px-3 py-3 text-left font-semibold text-evc-ink">{row.label}</th>
                <td className="px-2 py-3 text-center"><Cell cell={row.marketplace} /></td>
                <td className="bg-evc-green-tint/50 px-2 py-3 text-center"><Cell cell={row.evc} strong /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-center gap-4 text-xs text-evc-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#D9481F]" aria-hidden />Shopee</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#237A32]" aria-hidden />Tokopedia</span>
      </p>
    </section>
  )
}

// 4.5 ─────────────────────────────────────────────────────────────────
export function FeaturedProducts({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) return null
  return (
    <section id="terlaris" className="scroll-mt-32">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={H2}>Paling sering dibeli ulang</h2>
        <Link href="/katalog" prefetch={false} className="shrink-0 text-sm font-semibold text-evc-green underline underline-offset-4">
          Lihat semua
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 2} chip={i < 2 ? 'Terlaris' : undefined} />
        ))}
      </div>
    </section>
  )
}

// 4.6 ─────────────────────────────────────────────────────────────────
export function NeedCards() {
  return (
    <section>
      <h2 className={H2}>Belanja sesuai kebutuhan</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {NEED_CARDS.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            prefetch={false}
            className={`${CARD} flex min-h-[88px] flex-col justify-between p-4 hover:border-evc-green`}
          >
            <span className="flex items-center justify-between font-bold text-evc-ink">
              {c.title}
              <ChevronRight className="h-4 w-4 text-evc-muted" aria-hidden />
            </span>
            <span className="mt-1 text-xs leading-snug text-evc-muted">{c.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

// 4.7 ─────────────────────────────────────────────────────────────────
export function SignupSteps() {
  return (
    <section>
      <h2 className={H2}>Daftar sekali, belanja lebih tenang</h2>
      <p className="mt-1 text-sm text-evc-muted">Akun EVC menyimpan alamat, status pesanan, dan poin Anda di satu tempat.</p>
      <ol className={`${CARD} mt-3 divide-y divide-evc-border md:grid md:grid-cols-3 md:divide-x md:divide-y-0`}>
        {SIGNUP_STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-evc-green-tint text-sm font-bold text-evc-green">
              {i + 1}
            </span>
            <span>
              <span className="block font-bold text-evc-ink">{s.title}</span>
              <span className="mt-0.5 block text-sm text-evc-muted">{s.desc}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

// 4.8 ─────────────────────────────────────────────────────────────────
export interface HomeReview {
  id: string
  customer_name: string | null
  customer_location: string | null
  body: string
  product_name: string | null
}

/** Hanya dirender bila ada ulasan asli (approved + featured). */
export function ReviewsSection({ reviews }: { reviews: HomeReview[] }) {
  if (reviews.length === 0) return null
  return (
    <section>
      <h2 className={H2}>Kata pembeli kami</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {reviews.map((r) => (
          <figure key={r.id} className={`${CARD} p-4`}>
            <blockquote className="text-sm leading-relaxed text-evc-ink">“{r.body}”</blockquote>
            <figcaption className="mt-2 text-xs text-evc-muted">
              {[r.customer_name?.split(' ')[0], r.customer_location].filter(Boolean).join(', ')}
              {r.product_name ? ` · ${r.product_name}` : ''}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

// 4.9 ─────────────────────────────────────────────────────────────────
function Chip({ label }: { label: string }) {
  return (
    <li className="rounded-full border border-evc-border bg-evc-ground px-3 py-1 text-xs font-semibold text-evc-ink">{label}</li>
  )
}

export function PaymentShipping() {
  return (
    <section className={`${CARD} p-4 md:p-6`}>
      <h2 className="text-sm font-bold text-evc-ink">Bayar dengan</h2>
      <ul className="mt-2 flex flex-wrap gap-2">{PAYMENT_METHODS.map((m) => <Chip key={m} label={m} />)}</ul>
      <h2 className="mt-4 text-sm font-bold text-evc-ink">Dikirim dengan</h2>
      <dl className="mt-2 space-y-2">
        {COURIERS.map((g) => (
          <div key={g.label} className="flex flex-wrap items-center gap-2">
            <dt className="w-32 shrink-0 text-xs font-semibold text-evc-muted">{g.label}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">{g.items.map((c) => <Chip key={c} label={c} />)}</ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// 4.10 ────────────────────────────────────────────────────────────────
export function WhatsAppCard() {
  return (
    <a
      href={WA_ADMIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-[16px] bg-evc-green p-4 text-white hover:bg-evc-green-dark md:p-6"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
        <MessageCircle className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-bold">Bingung pilih produk? Chat admin EVC</span>
        <span className="mt-0.5 block text-xs text-white/85">WhatsApp · Senin–Sabtu, 09.00–17.00 WITA · fast response</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
    </a>
  )
}

// 4.11 ────────────────────────────────────────────────────────────────
// URL halaman trust dipakai Google Merchant Center — jangan diganti.
const FOOTER_LINKS = [
  { href: '/about', label: 'Tentang Kami' },
  { href: '/faq', label: 'Cara Belanja & FAQ' },
  { href: '/shipping-policy', label: 'Pengiriman' },
  { href: '/refund-policy', label: 'Pengembalian' },
  { href: '/terms', label: 'Syarat & Ketentuan' },
  { href: '/privacy-policy', label: 'Kebijakan Privasi' },
  { href: '/contact', label: 'Hubungi Kami' },
]

export function HomeFooter() {
  return (
    <footer className="border-t border-evc-border bg-evc-surface font-jakarta">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <nav aria-label="Informasi toko">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:flex md:flex-wrap md:gap-x-6">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} prefetch={false} className="inline-flex min-h-[44px] items-center text-evc-muted hover:text-evc-green">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="https://instagram.com/evcmercato"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-evc-ink hover:text-evc-green"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
          </svg>
          @evcmercato
        </a>
        <p className="mt-4 text-xs leading-relaxed text-evc-muted">
          Dikelola CV EVC Nusantara Sukses, Mitra Usaha Resmi KKI Group (KKD 12081020) sejak 2003. Toko ini bukan official
          store KKI Group; pembelian di sini tidak termasuk fasilitas member KKI (PV/BV).{' '}
          <Link href="/terms" prefetch={false} className="font-semibold text-evc-green underline underline-offset-2">
            Selengkapnya
          </Link>
        </p>
        <p className="mt-3 text-xs text-evc-muted">© {new Date().getFullYear()} EVC Mercato</p>
      </div>
    </footer>
  )
}
