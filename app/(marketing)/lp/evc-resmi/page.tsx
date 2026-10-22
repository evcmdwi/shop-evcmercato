import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { appendRef } from '@/lib/marketing/ref'
import AffiliateRefSetter from '@/components/marketing/AffiliateRefSetter'
import TrackedLink from '@/components/lp/evc-resmi/TrackedLink'
import StickyBar from '@/components/lp/evc-resmi/StickyBar'
import Screenshots from '@/components/lp/evc-resmi/Screenshots'
import { WhatsAppIcon } from '@/components/lp/supergreen/icons'
import { getEvcResmiData } from '@/lib/lp/evc-resmi'
import { rp } from '@/lib/lp/supergreen'
import {
  WA_NUMBER,
  about,
  closing,
  faq,
  footer,
  hero,
  howTo,
  meta as lpMeta,
  productSection,
  safety,
  stores,
  vip,
  waGeneralText,
  waVipText,
  why,
  type WaContext,
} from '@/content/lp/evc-resmi'

export const metadata: Metadata = {
  title: lpMeta.title,
  description: lpMeta.description,
  alternates: { canonical: lpMeta.url },
  openGraph: {
    title: lpMeta.title,
    description: lpMeta.description,
    images: [lpMeta.ogImage],
    url: lpMeta.url,
  },
}

const SHOP = 'https://shop.evcmercato.com/katalog'
const FORWARD_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as const
const DEFAULT_UTM = { utm_source: 'evcmercato', utm_medium: 'lp', utm_campaign: 'evc_resmi' }

const waHref = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`

// Gaya bersama (mengikuti homepage shop).
const WRAP = 'mx-auto w-full max-w-5xl px-4 md:px-6'
const H2 = 'text-[22px] font-extrabold leading-tight tracking-tight text-[#1D2A22] md:text-[30px]'
const CARD = 'rounded-2xl border border-[#E6E4DD] bg-white'
const BTN_ACCENT =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B9531A] px-5 text-base font-bold text-white hover:bg-[#9E4615]'
const BTN_OUTLINE =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1E5B45] bg-white px-5 text-base font-bold text-[#1E5B45] hover:bg-[#EAF1EC]'

/** "**tebal**" → <strong>. */
function withBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  )
}

/** Bulatan huruf marketplace (bukan logo resmi). */
function StoreDot({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white ring-2 ring-white"
      style={{ backgroundColor: color }}
    >
      {letter}
    </span>
  )
}

export default async function EvcResmiV2Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const one = (k: string) => {
    const v = sp[k]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }
  const ref = one('ref') || null
  const data = await getEvcResmiData()
  const { stats } = data

  // UTM: nilai asli dari iklan diteruskan apa adanya; tanpa UTM/fbclid → nilai bawaan LP.
  // utm_content = posisi tombol, kecuali iklan sudah membawa utm_content sendiri.
  const incoming = Object.fromEntries(FORWARD_KEYS.map((k) => [k, one(k)]).filter(([, v]) => v))
  const fromAd = Object.keys(incoming).length > 0
  const shopHref = (path: string, position: string) => {
    const url = new URL(SHOP + path)
    const params: Record<string, string> = fromAd ? { ...incoming } : { ...DEFAULT_UTM }
    if (!params.utm_content) params.utm_content = position
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return appendRef(url.toString(), ref)
  }
  const wa = (ctx: WaContext) => waHref(waGeneralText(ctx))
  const fill = (s: string) => s.replace('{shopeeYears}', stats.shopeeYears).replace('{shopeeChat}', stats.shopeeChat)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }

  return (
    <div className="min-h-screen bg-[#F6F5F1] pb-24 font-jakarta text-[#1D2A22] md:pb-0">
      <AffiliateRefSetter refCode={ref} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 3.1 Header */}
      <header className="sticky top-0 z-50 border-b border-[#E6E4DD] bg-[#F6F5F1]/95 backdrop-blur">
        <div className={`${WRAP} flex h-14 items-center justify-between`}>
          <span className="flex items-center gap-2">
            <Image src="/logo-evcmercato.jpg" alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
            <span className="text-base font-extrabold tracking-tight text-[#1E5B45]">EVC Mercato</span>
          </span>
          <TrackedLink
            href={wa('header')}
            event={{ type: 'contact', context: 'header' }}
            className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#1E5B45] bg-white px-3 text-sm font-bold text-[#1E5B45] hover:bg-[#EAF1EC]"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            Chat admin
          </TrackedLink>
        </div>
      </header>

      <main>
        {/* 3.2 Hero */}
        <section id="hero" className={`${WRAP} grid gap-5 pb-8 pt-4 md:grid-cols-2 md:items-center md:gap-10 md:py-14`}>
          <div>
            <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-tight md:text-[42px]">{hero.headline}</h1>
            <p className="mt-2.5 text-[15px] leading-snug text-[#1D2A22]/80 md:text-lg">{hero.sub}</p>

            <div className={`${CARD} mt-3.5 flex items-center gap-3 p-3`}>
              <span className="flex -space-x-2">
                <StoreDot letter="S" color="#D9481F" />
                <StoreDot letter="T" color="#237A32" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[15px] font-extrabold">
                  <span className="text-[#E8A317]">★</span> {stats.rating} dari {stats.totalReviews} ulasan
                </span>
                <span className="block text-xs text-[#1D2A22]/70">{hero.proofSub}</span>
              </span>
            </div>

            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              <a href="#produk" className={BTN_ACCENT}>{hero.ctaPrimary}</a>
              <TrackedLink href={wa('hero')} event={{ type: 'contact', context: 'hero' }} className={BTN_OUTLINE}>
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {hero.ctaWa}
              </TrackedLink>
            </div>
          </div>
          <div className={`${CARD} overflow-hidden p-2 md:p-0`}>
            <Image
              src="/assets/evc-resmi-hero-produk.webp"
              alt={hero.imageAlt}
              width={1200}
              height={900}
              preload
              fetchPriority="high"
              sizes="(max-width: 768px) 240px, 480px"
              className="mx-auto h-[150px] w-auto md:h-auto md:w-full"
            />
          </div>
        </section>

        {/* 3.3 Kenapa hilang dari marketplace */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <div className={`${CARD} p-5 md:p-7`}>
            <h2 className={H2}>{why.headline}</h2>
            {why.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-[15px] leading-relaxed md:text-base">{withBold(p)}</p>
            ))}
            <a
              href={why.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-[#1E5B45] underline underline-offset-4"
            >
              {why.linkText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* 3.4 Siapa kami */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <h2 className={H2}>{about.headline}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {about.facts.map((f) => (
              <div key={f.label} className={`${CARD} p-3.5`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#B9531A]">{f.label}</p>
                <p className="mt-1.5 text-[15px] font-extrabold leading-snug">{fill(f.title)}</p>
                <p className="mt-0.5 text-[13px] text-[#1D2A22]/70">{fill(f.note)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3.5 Toko kami di marketplace */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <h2 className={H2}>{stores.headline}</h2>
          <p className="mt-1.5 text-[15px] text-[#1D2A22]/75">{stores.sub}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              {
                ...stores.shopee,
                dot: <StoreDot letter="S" color="#D9481F" />,
                line: `Star+ · ★ ${stats.rating} · ${stats.shopeeRatings} penilaian · ${stats.shopeeFollowers} pengikut`,
              },
              {
                ...stores.tokopedia,
                dot: <StoreDot letter="T" color="#237A32" />,
                line: `★ ${stats.rating} · ${stats.tokopediaReviews} ulasan · ${stats.tokopediaSold} terjual`,
              },
            ].map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CARD} flex min-h-16 items-center gap-3 p-3.5 hover:border-[#1E5B45]/40`}
              >
                {s.dot}
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[15px] font-extrabold">{s.name}</span>
                  <span className="mt-0.5 block text-[13px] text-[#1D2A22]/70">{s.line}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[#1E5B45]">Cek →</span>
              </a>
            ))}
          </div>
          {data.screenshots.length > 0 && <Screenshots urls={data.screenshots} alt={stores.screenshotsAlt} />}
        </section>

        {/* 3.6 VIP */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <div className="rounded-2xl bg-[#1E5B45] p-5 text-white md:flex md:items-center md:gap-8 md:p-8">
            <div className="md:flex-1">
              <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                {vip.chip}
              </p>
              <h2 className="mt-3 text-[21px] font-extrabold leading-snug md:text-[26px]">{vip.headline}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/85">{vip.body}</p>
            </div>
            <div className="mt-5 md:mt-0 md:w-[300px] md:shrink-0">
              <TrackedLink
                href={waHref(waVipText)}
                event={{ type: 'vip' }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-center text-[15px] font-bold leading-tight text-[#1E5B45]"
              >
                <WhatsAppIcon className="h-5 w-5 shrink-0 text-[#25D366]" />
                {vip.cta}
              </TrackedLink>
              <p className="mt-2 text-xs leading-relaxed text-white/75">{vip.note}</p>
            </div>
          </div>
        </section>

        {/* 3.7 Produk */}
        <section id="produk" className={`${WRAP} scroll-mt-16 pb-10 md:pb-14`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className={H2}>{productSection.headline}</h2>
            <a
              href={shopHref('', 'semua-produk')}
              className="shrink-0 py-2 text-sm font-bold text-[#1E5B45] underline underline-offset-4"
            >
              {productSection.allLink}
            </a>
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#1D2A22]/75">{productSection.body}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.products.map((p) => {
              const href = shopHref(`/${p.slug}`, `produk-${p.slug}`)
              const event = { type: 'checkout' as const, value: p.price, slug: p.slug, position: `produk-${p.slug}` }
              const photo = p.image && (
                <Image
                  src={p.image}
                  alt={p.label}
                  width={320}
                  height={320}
                  sizes={p.wide ? '(max-width: 768px) 40vw, 240px' : '(max-width: 768px) 50vw, 240px'}
                  className="aspect-square w-full rounded-xl bg-[#F6F5F1] object-cover"
                />
              )
              const price = (
                <p className="mt-1 leading-tight">
                  {p.from && <span className="block text-xs text-[#1D2A22]/65">Mulai</span>}
                  <span className="text-[17px] font-extrabold">{rp(p.price)}</span>
                </p>
              )
              const buy = (
                <TrackedLink href={href} event={event} className={`${BTN_ACCENT} mt-3 !min-h-11 !text-[15px]`}>
                  {productSection.cta}
                </TrackedLink>
              )
              if (p.wide) {
                return (
                  <article key={p.id} className={`${CARD} col-span-2 flex gap-3 p-3 md:col-span-4 md:max-w-xl`}>
                    <div className="w-2/5 shrink-0">{photo}</div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <h3 className="text-[15px] font-bold leading-snug">{p.label}</h3>
                      {price}
                      {buy}
                    </div>
                  </article>
                )
              }
              return (
                <article key={p.id} className={`${CARD} flex flex-col p-3`}>
                  {photo}
                  {p.popular && (
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#B9531A]">
                      {productSection.popularLabel}
                    </p>
                  )}
                  <h3 className={`${p.popular ? 'mt-0.5' : 'mt-2'} text-[15px] font-bold leading-snug`}>{p.label}</h3>
                  <div className="mt-auto">
                    {price}
                    {buy}
                  </div>
                </article>
              )
            })}
          </div>
          {data.products.length === 0 && (
            <p className={`${CARD} mt-4 p-4 text-sm`}>Produk sedang diperbarui. Chat admin untuk info harga terbaru.</p>
          )}
        </section>

        {/* 3.8 Belanja aman */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <h2 className={H2}>{safety.headline}</h2>
          <ul className={`${CARD} mt-4 divide-y divide-[#E6E4DD]`}>
            {safety.items.map((s) => (
              <li key={s.title} className="flex gap-3 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E5B45] text-white">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="leading-snug">
                  <span className="block text-[15px] font-bold">{s.title}</span>
                  <span className="mt-0.5 block text-sm text-[#1D2A22]/75">{s.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3.9 Cara belanja */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <h2 className={H2}>{howTo.headline}</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {howTo.steps.map((s, i) => (
              <li key={s} className={`${CARD} flex items-center gap-3 p-4`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1EC] text-base font-extrabold text-[#1E5B45]">
                  {i + 1}
                </span>
                <span className="text-[15px] font-bold leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 3.10 FAQ — item pertama terbuka */}
        <section className={`${WRAP} pb-10 md:max-w-3xl md:pb-14`}>
          <h2 className={H2}>Pertanyaan yang sering ditanya</h2>
          <div className={`${CARD} mt-4 divide-y divide-[#E6E4DD]`}>
            {faq.map((f, i) => (
              <details key={f.q} open={i === 0} className="group px-4">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#1E5B45] group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-4 text-[15px] leading-relaxed text-[#1D2A22]/85">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 3.11 Penutup */}
        <section className="border-t border-[#E6E4DD] bg-white py-10 md:py-14">
          <div className={`${WRAP} text-center md:max-w-2xl`}>
            <h2 className={H2}>{closing.headline}</h2>
            <div className="mt-5 grid gap-2.5 md:grid-cols-2">
              <a href="#produk" className={BTN_ACCENT}>{closing.ctaPrimary}</a>
              <TrackedLink href={wa('penutup')} event={{ type: 'contact', context: 'penutup' }} className={BTN_OUTLINE}>
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {closing.ctaWa}
              </TrackedLink>
            </div>
            <p className="mt-3 text-xs text-[#1D2A22]/70">{closing.hours}</p>
          </div>
        </section>
      </main>

      {/* 3.12 Footer */}
      <footer className={`${WRAP} space-y-2 py-8 text-xs leading-relaxed text-[#1D2A22]/75`}>
        <p>{footer.text}</p>
        <p className="flex gap-4">
          <a href={footer.termsUrl} className="underline underline-offset-2">Syarat &amp; Ketentuan</a>
          <a href={footer.privacyUrl} className="underline underline-offset-2">Kebijakan Privasi</a>
        </p>
      </footer>

      {/* 3.13 Bar melayang (HP) + event ViewContent / ScrollToProducts */}
      <StickyBar waHref={wa('sticky')} ctaText={hero.ctaPrimary} />
    </div>
  )
}
