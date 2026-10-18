import type { Metadata } from 'next'
import Image from 'next/image'
import { Check, ChevronDown, Coins, Headset, MessageCircle, Moon, Sun, Sunrise, Sunset, Truck } from 'lucide-react'
import { appendRef } from '@/lib/marketing/ref'
import AffiliateRefSetter from '@/components/marketing/AffiliateRefSetter'
import TrackedLink from '@/components/lp/supergreen/TrackedLink'
import StickyOffer from '@/components/lp/supergreen/StickyOffer'
import Testimonials from '@/components/lp/supergreen/Testimonials'
import { WhatsAppIcon } from '@/components/lp/supergreen/icons'
import { getSgfData, rp } from '@/lib/lp/supergreen'
import {
  WA_NUMBER,
  closing,
  consult,
  dosage,
  footer,
  hero,
  meta as lpMeta,
  offer,
  pattern,
  step,
  testimonials,
  waGeneralText,
  waPackageText,
  type WaContext,
} from '@/content/lp/supergreen-food'

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

const SHOP = 'https://shop.evcmercato.com/katalog/'
const FORWARD_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as const
const DEFAULT_UTM = { utm_source: 'evcmercato', utm_medium: 'lp', utm_campaign: 'supergreen_food' }

const waHref = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`

// Gaya bersama.
const WRAP = 'mx-auto w-full max-w-5xl px-4 md:px-6'
const H2 = 'font-display text-[26px] leading-tight text-[#1D2A22] md:text-[34px]'
const BTN_ACCENT =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#B9531A] px-5 text-base font-bold text-white hover:bg-[#9E4615]'
const BTN_OUTLINE =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1F4A33] px-5 text-base font-bold text-[#1F4A33] hover:bg-[#E3ECE3]'

const PATTERN_ICONS = [Sunrise, Sun, Sunset, Moon]

/** "**tebal**" → <strong>. */
function withBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  )
}

export default async function SupergreenV2Page({
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
  const data = await getSgfData()

  // UTM: nilai asli dari iklan diteruskan apa adanya; tanpa UTM/fbclid → nilai bawaan LP.
  // utm_content = posisi tombol, kecuali iklan sudah membawa utm_content sendiri.
  const incoming = Object.fromEntries(FORWARD_KEYS.map((k) => [k, one(k)]).filter(([, v]) => v))
  const fromAd = Object.keys(incoming).length > 0
  const shopHref = (slug: string, position: string) => {
    const url = new URL(SHOP + slug)
    const params: Record<string, string> = fromAd ? { ...incoming } : { ...DEFAULT_UTM }
    if (!params.utm_content) params.utm_content = position
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    return appendRef(url.toString(), ref)
  }
  const wa = (ctx: WaContext) => waHref(waGeneralText(ctx))

  const perDayText = data.minPerDay ? `± ${rp(data.minPerDay)}` : null
  const first = testimonials.firstNames
    .map((n) => testimonials.items.find((t) => t.name === n))
    .filter((t): t is (typeof testimonials.items)[number] => !!t)
  const rest = testimonials.items.filter((t) => !testimonials.firstNames.includes(t.name))

  return (
    <div className="min-h-screen bg-[#F5F2EA] pb-24 font-jakarta text-[#1D2A22] md:pb-0">
      <AffiliateRefSetter refCode={ref} />

      {/* 3.1 Header */}
      <header className="sticky top-0 z-50 border-b border-[#1F4A33]/10 bg-[#F5F2EA]/95 backdrop-blur">
        <div className={`${WRAP} flex h-14 items-center justify-between`}>
          <span className="font-display text-lg tracking-[0.14em] text-[#1F4A33]">EVC MERCATO</span>
          <TrackedLink
            href={wa('header')}
            event={{ type: 'contact', context: 'header' }}
            className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-[#1F4A33] px-3 text-sm font-bold text-[#1F4A33] hover:bg-[#E3ECE3]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat admin
          </TrackedLink>
        </div>
      </header>

      <main>
        {/* 3.2 Hero */}
        <section id="hero" className={`${WRAP} grid items-center gap-4 pb-8 pt-4 md:grid-cols-2 md:gap-10 md:py-14`}>
          <div>
            <p className="inline-block rounded-full bg-[#E3ECE3] px-3 py-1 text-[11px] font-bold text-[#1F4A33] md:text-xs">
              {hero.chip}
            </p>
            <h1 className="mt-3 font-display text-[30px] leading-[1.12] text-[#1D2A22] md:text-5xl">{hero.headline}</h1>
            <p className="mt-2 text-[15px] leading-snug text-[#1D2A22]/80 md:mt-4 md:text-lg">{hero.sub}</p>
          </div>
          <div className="md:row-span-2">
            <div className="relative overflow-hidden rounded-2xl bg-[#EBEEE3]">
              <Image
                src="/assets/supergreen-packshot-2.png"
                alt="Supergreen Food — dus dan botol tablet, terdaftar BPOM TI044511731"
                width={1000}
                height={786}
                preload
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 480px"
                className="mx-auto h-[230px] w-auto object-contain md:h-auto md:w-full"
              />
              {perDayText && (
                <div className="absolute bottom-3 right-3 rounded-xl bg-[#B9531A] px-3 py-1.5 text-right text-white shadow-md">
                  <span className="block text-[11px] font-semibold leading-none">Mulai</span>
                  <span className="block text-lg font-extrabold leading-tight">{perDayText}/hari</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1F4A33]">{hero.compare}</p>
            <div className="mt-3 grid gap-2.5">
              <a href="#paket" className={BTN_ACCENT}>{hero.ctaPrimary}</a>
              <TrackedLink href={wa('hero')} event={{ type: 'contact', context: 'hero' }} className={BTN_OUTLINE}>
                <WhatsAppIcon className="h-5 w-5" />
                {hero.ctaWa}
              </TrackedLink>
            </div>
            {perDayText && <p className="mt-2 text-xs text-[#1D2A22]/75">{hero.note}</p>}
          </div>
        </section>

        {/* 3.3 Kenal pola ini? */}
        <section className="bg-white/60 py-10 md:py-14">
          <div className={WRAP}>
            <h2 className={H2}>{pattern.headline}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {pattern.cards.map((c, i) => {
                const Icon = PATTERN_ICONS[i]
                return (
                  <div key={c.time} className="rounded-2xl border border-[#1F4A33]/10 bg-[#F5F2EA] p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#9A4413]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {c.time}
                    </p>
                    <p className="mt-1.5 text-sm leading-snug">{c.text}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-5 text-[15px] leading-relaxed md:max-w-3xl md:text-base">{withBold(pattern.closing)}</p>
          </div>
        </section>

        {/* 3.4 Langkah kecil */}
        <section className="py-10 md:py-14">
          <div className={`${WRAP} md:grid md:grid-cols-[1fr_1.4fr] md:items-center md:gap-10`}>
            <Image
              src="/assets/supergreen-leaves-bowl.png"
              alt="Tablet Supergreen Food di mangkuk dengan daun hijau"
              width={600}
              height={590}
              sizes="(max-width: 768px) 160px, 300px"
              className="mb-4 h-auto w-36 md:mb-0 md:w-full md:max-w-[300px] md:justify-self-center"
            />
            <div>
              <h2 className={H2}>{step.headline}</h2>
              <p className="mt-2 text-[15px] leading-relaxed md:text-base">{step.body}</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {step.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[15px] leading-snug">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F4A33] text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 3.5 Cara minum */}
        <section className="bg-[#E3ECE3] py-10 md:py-12">
          <div className={WRAP}>
            <h2 className={H2}>{dosage.headline}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:max-w-xl">
              {dosage.cards.map((c) => (
                <div key={c.who} className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1F4A33]">{c.who}</p>
                  <p className="mt-1 font-display text-2xl leading-tight">{c.dose}</p>
                  <p className="text-sm text-[#1D2A22]/70">{c.unit}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[15px] leading-relaxed md:max-w-2xl">{dosage.note}</p>
          </div>
        </section>

        {/* 3.6 Paket */}
        <section id="paket" className="scroll-mt-16 py-10 md:py-14">
          <div className={WRAP}>
            <h2 className={H2}>{offer.headline}</h2>
            <p className="mt-1.5 text-[15px] text-[#1D2A22]/75">{offer.sub}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3 md:items-stretch">
              {data.packages.map((p) => (
                <article
                  key={p.key}
                  className={`relative flex flex-col rounded-2xl bg-white p-4 ${
                    p.highlight ? 'border-2 border-[#B9531A] shadow-lg' : 'border border-[#1F4A33]/15'
                  }`}
                >
                  <span
                    className={`absolute -top-3 left-4 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wider ${
                      p.highlight ? 'bg-[#B9531A] text-white' : 'bg-[#1F4A33] text-white'
                    }`}
                  >
                    {p.badge}
                  </span>
                  <div className="flex gap-3 pt-2">
                    <Image
                      src={p.photo}
                      alt={`Supergreen Food ${p.name}`}
                      width={96}
                      height={96}
                      sizes="96px"
                      className="h-24 w-24 shrink-0 rounded-xl bg-[#F5F2EA] object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold leading-snug">{p.name}</h3>
                      <p className="mt-0.5 text-[13px] leading-snug text-[#1D2A22]/70">{p.detail}</p>
                      <p className="mt-1.5 text-xl font-extrabold">{rp(p.price)}</p>
                      <p className="text-[13px] font-semibold text-[#1F4A33]">± {rp(p.perDay)}/hari</p>
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
                    <li className="inline-flex items-center gap-1 rounded-full bg-[#E3ECE3] px-2.5 py-1 text-[#1F4A33]">
                      <Coins className="h-3.5 w-3.5" aria-hidden="true" />+{p.points.toLocaleString('id-ID')} EVC Points
                    </li>
                    <li className="inline-flex items-center gap-1 rounded-full bg-[#E3ECE3] px-2.5 py-1 text-[#1F4A33]">
                      <Truck className="h-3.5 w-3.5" aria-hidden="true" />{offer.perks[0]}
                    </li>
                    <li className="inline-flex items-center gap-1 rounded-full bg-[#E3ECE3] px-2.5 py-1 text-[#1F4A33]">
                      <Headset className="h-3.5 w-3.5" aria-hidden="true" />{offer.perks[1]}
                    </li>
                  </ul>
                  <div className="mt-auto flex gap-2 pt-4">
                    <TrackedLink
                      href={shopHref(p.slug, `paket-${p.key}`)}
                      event={{ type: 'checkout', value: p.price, slug: p.slug, position: `paket-${p.key}` }}
                      className={
                        p.highlight
                          ? `${BTN_ACCENT} flex-1`
                          : 'flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-[#B9531A] px-4 text-base font-bold text-[#B9531A] hover:bg-[#B9531A]/5'
                      }
                    >
                      {offer.cta}
                    </TrackedLink>
                    <TrackedLink
                      href={waHref(waPackageText(p.name, rp(p.price), p.key))}
                      event={{ type: 'contact', context: `paket-${p.key}` }}
                      aria-label="Tanya admin soal paket ini via WhatsApp"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#1F4A33] text-[#1F4A33] hover:bg-[#E3ECE3]"
                    >
                      <WhatsAppIcon className="h-5 w-5" />
                    </TrackedLink>
                  </div>
                </article>
              ))}
            </div>
            {data.packages.length === 0 && (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm">
                Paket sedang diperbarui. Chat admin untuk info harga terbaru.
              </p>
            )}
          </div>
        </section>

        {/* 3.7 Blok WA besar */}
        <section className={`${WRAP} pb-10 md:pb-14`}>
          <TrackedLink
            href={wa('konsultasi')}
            event={{ type: 'contact', context: 'konsultasi' }}
            className="block rounded-3xl bg-[#1F4A33] p-6 text-white hover:bg-[#1A3F2B] md:flex md:items-center md:justify-between md:gap-8 md:p-8"
          >
            <span className="block">
              <MessageCircle className="h-8 w-8 text-[#E3ECE3]" aria-hidden="true" />
              <span className="mt-2 block font-display text-2xl leading-tight md:text-3xl">{consult.headline}</span>
              <span className="mt-2 block text-[15px] leading-relaxed text-white/85">{consult.body}</span>
            </span>
            <span className="mt-5 block shrink-0 md:mt-0">
              <span className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-bold text-[#1F4A33]">
                <WhatsAppIcon className="h-5 w-5" />
                {consult.cta}
              </span>
              <span className="mt-2 block text-center text-xs text-white/70 md:max-w-[260px]">{consult.hours}</span>
            </span>
          </TrackedLink>
        </section>

        {/* 3.8 Kata mereka */}
        <section className="bg-white/60 py-10 md:py-14">
          <div className={WRAP}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className={H2}>{testimonials.headline}</h2>
              {data.soldRounded > 0 && (
                <p className="shrink-0 text-sm font-bold text-[#1F4A33]">
                  {data.soldRounded.toLocaleString('id-ID')}+ paket terjual
                </p>
              )}
            </div>
            <Testimonials first={first} rest={rest} />
            <p className="mt-3 text-xs text-[#1D2A22]/75">{testimonials.disclaimer}</p>
          </div>
        </section>

        {/* 3.9 FAQ — hanya pertanyaan yang sudah punya jawaban */}
        {data.faq.length > 0 && (
          <section className="py-10 md:py-14">
            <div className={`${WRAP} md:max-w-3xl`}>
              <h2 className={H2}>Pertanyaan yang sering ditanya</h2>
              <div className="mt-4 divide-y divide-[#1F4A33]/10 rounded-2xl border border-[#1F4A33]/10 bg-white">
                {data.faq.map((f) => (
                  <details key={f.id} className="group px-4">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#1F4A33] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="whitespace-pre-line pb-4 text-[15px] leading-relaxed text-[#1D2A22]/85">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3.10 Penutup */}
        <section className="bg-[#E3ECE3] py-10 md:py-14">
          <div className={`${WRAP} text-center md:max-w-2xl`}>
            <h2 className={H2}>{closing.headline}</h2>
            {perDayText && (
              <p className="mt-2 text-[15px] md:text-base">{closing.body.replace('{perDay}', perDayText)}</p>
            )}
            <div className="mt-5 grid gap-2.5 md:grid-cols-2">
              <a href="#paket" className={BTN_ACCENT}>{closing.ctaPrimary}</a>
              <TrackedLink href={wa('penutup')} event={{ type: 'contact', context: 'penutup' }} className={BTN_OUTLINE}>
                <WhatsAppIcon className="h-5 w-5" />
                {closing.ctaWa}
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>

      {/* 3.11 Footer */}
      <footer className={`${WRAP} space-y-1.5 py-8 text-xs leading-relaxed text-[#1D2A22]/75`}>
        <p>{footer.bpom}</p>
        <p>{footer.company}</p>
        <p>
          <a href={footer.privacyUrl} className="underline underline-offset-2">Kebijakan Privasi</a>
        </p>
      </footer>

      {/* 3.12 Bar melayang (HP) + event ViewContent / ScrollToOffer */}
      <StickyOffer
        label={data.trial?.name ?? null}
        price={data.trial ? rp(data.trial.price) : null}
        waHref={wa('sticky')}
      />
    </div>
  )
}
