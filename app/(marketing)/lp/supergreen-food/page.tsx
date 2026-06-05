import type { Metadata } from 'next'
import Script from 'next/script'
import Image from 'next/image'
import {
  Leaf,
  Coffee,
  Utensils,
  Cookie,
  Moon,
  Smartphone,
  Sunrise,
  Scale,
  HeartPulse,
  Clock,
  Repeat,
  Sprout,
  BadgeCheck,
  ShieldCheck,
  Wallet,
  Truck,
  MessageCircle,
  Gift,
  ChevronRight,
  X,
  Check,
  Star,
  Package,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  Plus,
  Info,
  ArrowDown,
  Briefcase,
  Users,
  TrendingDown,
  Flame,
  Salad,
  Zap,
  Hourglass,
} from 'lucide-react'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import { appendRef } from '@/lib/marketing/ref'
import AffiliateRefSetter from '@/components/marketing/AffiliateRefSetter'
import {
  cta,
  meta as lpMeta,
  hero,
  patternRecognition,
  fear,
  mindset,
  introduce,
  benefits,
  testimonials,
  decision,
  whyEvc,
  offer,
  faq,
  finalCta,
} from '@/content/lp/supergreen-food'

export const metadata: Metadata = {
  title: lpMeta.title,
  description: lpMeta.description,
  openGraph: {
    title: lpMeta.title,
    description: lpMeta.description,
    images: [lpMeta.ogImage],
    url: lpMeta.url,
  },
}

// Resolves the string icon names stored in the content file to lucide components.
const ICONS = {
  Coffee,
  Utensils,
  Cookie,
  Moon,
  Smartphone,
  Sunrise,
  Leaf,
  Scale,
  HeartPulse,
  Clock,
  Repeat,
  Sprout,
  BadgeCheck,
  ShieldCheck,
  Wallet,
  Truck,
  MessageCircle,
  Gift,
  Zap,
  Sparkles,
} as const

type IconName = keyof typeof ICONS

// Icons for the Section 3 consequence grid (positional — matches `fear.consequences` order).
const CONSEQUENCE_ICONS = [Briefcase, TrendingDown, Users, Wallet, Clock]
// Section 4 — positional icons for the "dianggap biasa" habits and the "mahal" costs.
const NORMALIZED_ICONS = [Clock, Coffee, Flame, Cookie, Salad, Moon]
const COST_ICONS = [Clock, Zap, Wallet, Briefcase, Hourglass]

// Shared button styles (light/cream sections).
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 w-full text-center bg-[#2F4A34] text-[#F6F4EC] py-4 rounded-2xl font-bold text-base hover:bg-[#22351F] transition-colors'
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 w-full text-center border-2 border-[#2F4A34] text-[#2F4A34] py-3.5 rounded-2xl font-semibold text-base hover:bg-[#EBEEE3] transition-colors'

// Recurring brand eyebrow pill (matches the outline pill at the top of each mockup section).
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9CFB6] bg-[#EFF1E6]/70 px-3.5 py-1.5 text-xs font-semibold text-[#3E5235] mb-5">
      <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
      {children}
    </div>
  )
}

// Logo WhatsApp (glyph resmi, path dari Simple Icons) — dipakai di semua CTA wa.me.
function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

// Subtle botanical ornament (evokes the leaf corners in the mockups without raster assets).
function LeafOrnament({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute select-none ${className}`}>
      <Leaf className="w-full h-full" />
    </div>
  )
}

// Highlights a phrase within a string (soft gold marker, matches the mockup emphasis).
function Highlight({ text, phrase }: { text: string; phrase: string }) {
  const idx = text.indexOf(phrase)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#EFE3B8] text-[#5A4A1A] rounded px-1.5 py-0.5">{phrase}</mark>
      {text.slice(idx + phrase.length)}
    </>
  )
}

export default async function SupergreenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const utm = extractUTM(
    new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, v]))
  )
  const ref = sp['ref'] ?? null

  // Configurable CTA links — built once from the content-file config, reused everywhere.
  // makeBuyLink juga dipakai untuk link CTA unik per paket (asumsi URL tanpa query string).
  const makeBuyLink = (url: string) =>
    appendRef(
      appendUTM(
        `${url}?utm_source=meta&utm_medium=paid_social&utm_campaign=supergreen_food&utm_content=lp_cta&utm_term=lp_organic`,
        utm
      ),
      ref
    )
  const buyLink = makeBuyLink(cta.buyUrl)
  const waLink = appendRef(cta.whatsappUrl, ref)

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {initPixelScript(pixelId)}
        </Script>
      )}
      {pixelId && (
        <Script id="meta-pixel-viewcontent" strategy="afterInteractive">{`
          (function() {
            function fireVC() {
              if (typeof fbq !== 'undefined') {
                fbq('track', 'ViewContent', {
                  content_name: 'Supergreen Food',
                  content_category: 'Obat Tradisional',
                  content_ids: ['supergreen'],
                  content_type: 'product_group'
                });
              } else {
                setTimeout(fireVC, 300);
              }
            }
            setTimeout(fireVC, 500);
          })();
        `}</Script>
      )}
      {pixelId && (
        <Script id="cta-tracking-supergreen-food" strategy="afterInteractive">{`
          (function() {
            function attachTracking() {
              document.querySelectorAll('.cta-buy-official').forEach(function(el) {
                el.addEventListener('click', function() {
                  if(typeof fbq === 'undefined') return;
                  fbq('trackCustom', 'ShopClick', {campaign: 'supergreen_food'});
                  fbq('track', 'Lead', {content_name: 'Supergreen Food Buy Official', lead_type: 'shop_click'});
                });
              });
              document.querySelectorAll('.cta-whatsapp').forEach(function(el) {
                el.addEventListener('click', function() {
                  if(typeof fbq === 'undefined') return;
                  fbq('track', 'Lead', {content_name: 'Supergreen Food WhatsApp', lead_type: 'whatsapp'});
                  fbq('trackCustom', 'WhatsAppClick', {campaign: 'supergreen_food'});
                });
              });
              document.querySelectorAll('.cta-evie-agent').forEach(function(el) {
                el.addEventListener('click', function() {
                  if(typeof fbq === 'undefined') return;
                  fbq('track', 'Lead', {content_name: 'Supergreen Food Evie Agent', lead_type: 'evie'});
                  fbq('trackCustom', 'EvieClick', {campaign: 'supergreen_food'});
                });
              });
            }
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', attachTracking);
            } else {
              attachTracking();
            }
          })();
        `}</Script>
      )}
      <AffiliateRefSetter refCode={ref} />

      {/* NAVBAR — centered EVC wordmark brand mark (no buy CTA in header, by design) */}
      <header className="bg-[#F6F4EC]/95 backdrop-blur-sm sticky top-0 z-50 border-b border-[#E3E0CE] py-3">
        <div className="max-w-lg mx-auto px-5 flex items-center justify-center">
          <div className="text-center leading-none">
            <p className="font-[family-name:var(--font-dm-serif)] text-2xl tracking-[0.15em] text-[#1F3A29]">
              EVC
            </p>
            <p className="text-[10px] font-semibold tracking-[0.45em] text-[#6B7A5E] mt-0.5">
              MERCATO
            </p>
          </div>
        </div>
      </header>

      <main className="bg-[#F6F4EC] text-[#1F3A29]">
        {/* ══ SECTION 1 — HERO (no buy CTA — hook + emotional copy + scroll cue) ══
            Layout: text LEFT column, photo bleeding to the RIGHT (mockup-01). */}
        <section className="relative overflow-hidden pt-8">
          {/* Hero image — same setup as Section 3: full-width (text width), big headline
              overlaid on top, sub-headline at 50% width below. Cream scrim for the light photo. */}
          <div className="max-w-lg mx-auto px-5">
            <div className="relative w-full aspect-[4/5] rounded-[20px] overflow-hidden ring-1 ring-[#DCE1CE]">
              <Image
                src="/assets/supergreen-hero.png"
                alt="Perempuan tampak lelah di meja kerja dengan kopi dan pekerjaan menumpuk"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover object-[center_45%]"
              />
              {/* Cream scrim — keeps the dark headline legible over the light photo */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#F6F4EC] via-[#F6F4EC]/75 via-48% to-transparent to-[88%]" />
              <div className="absolute inset-x-0 top-0 px-5 pt-6">
                <Eyebrow>Langkah kecil untuk tubuh yang lebih seimbang</Eyebrow>
                <h1 className="font-[family-name:var(--font-dm-serif)] text-[34px] sm:text-[44px] leading-[1.1] text-[#1F3A29]">
                  {hero.headlineLines.map((part, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {part}
                    </span>
                  ))}
                </h1>
                <p className="font-[family-name:var(--font-dm-serif)] text-[22px] sm:text-[24px] leading-snug text-[#5E7050] mt-7 max-w-[50%]">
                  {hero.subheadlineLines.map((part, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {part}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          {/* Body copy below the image */}
          <div className="max-w-lg mx-auto px-5 pt-8 pb-12">
            <div className="space-y-1.5 text-[17px] leading-relaxed text-[#42513C] mb-4">
              {hero.body.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <p className="text-[17px] leading-relaxed text-[#42513C] mb-4">{hero.beforeQuote}</p>

            <blockquote className="border-l-4 border-[#C7B463] pl-4 py-1 mb-4">
              <p className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#1F3A29] italic">
                “{hero.pullQuote}”
              </p>
            </blockquote>

            <p className="text-[17px] leading-relaxed text-[#42513C] mb-8">{hero.afterQuote}</p>

            {/* Microcopy — info card */}
            <div className="rounded-[20px] bg-white border border-[#DCE1CE] p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EBEEE3] text-[#2F4A34] flex-shrink-0">
                  <Info className="w-6 h-6" aria-hidden="true" />
                </span>
                <p className="text-[16px] leading-relaxed text-[#2F4A34] font-medium">{hero.microcopy}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Scroll cue — full-bleed dark band transitioning into Section 2 */}
        <div className="bg-[#1F3A29] text-[#E7E3D4] px-5 py-9">
          <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-4">
            <p className="font-[family-name:var(--font-dm-serif)] text-lg leading-snug">
              {hero.scrollCue.replace('↓', '').trim()}
            </p>
            <span className="flex items-center justify-center w-14 h-14 rounded-full border border-[#5A6B4D] text-[#C7B463] animate-bounce">
              <ArrowDown className="w-7 h-7" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* ══ SECTION 2 — PATTERN RECOGNITION (day-cycle timeline cards) ══ */}
        <section className="relative overflow-hidden px-5 py-14 bg-[#EBEEE3]">
          <LeafOrnament className="top-3 right-2 w-20 h-20 -rotate-12 text-[#6F8556]/20" />
          <div className="relative max-w-lg mx-auto">
            <Eyebrow>{patternRecognition.headlineLines[0]}</Eyebrow>
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[27px] sm:text-3xl leading-snug text-[#1F3A29] mb-8">
              {patternRecognition.headlineLines[1]}
            </h2>

            {/* Day-cycle timeline — one card per time of day */}
            <div className="space-y-3">
              {patternRecognition.timeline.map((item, i) => {
                const Icon = ICONS[item.icon as IconName] ?? Leaf
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-[20px] bg-white border border-[#DCE1CE] p-4 shadow-sm"
                  >
                    <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBEEE3] text-[#2F4A34] flex-shrink-0">
                      <Icon className="w-8 h-8" aria-hidden="true" />
                    </span>
                    <div className="flex-1 pt-0.5">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2F4A34] mb-1">
                        {item.time}
                      </p>
                      <p className="text-[16px] leading-relaxed text-[#42513C]">{item.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[17px] leading-relaxed text-[#42513C] mt-8 mb-6">
              {patternRecognition.transition}
            </p>

            {/* Closing card */}
            <div className="flex items-start gap-4 rounded-[22px] bg-[#E4EAD7] border border-[#CBD3B6] p-6">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                <Sprout className="w-8 h-8" aria-hidden="true" />
              </span>
              <p className="font-[family-name:var(--font-dm-serif)] text-xl leading-snug text-[#1F3A29]">
                {patternRecognition.closingCard}
              </p>
            </div>
          </div>
        </section>

        {/* ══ SECTION 3 — FEAR / CONSEQUENCE (intentionally dark & moody, mockup-03) ══ */}
        <section className="relative bg-[#152018] text-[#E7E3D4] pt-8">
          {/* Fear image — constrained to the same width as the text (max-w-lg + px-5).
              Big headline overlaid on the intentional dark space (top), sub-headline below it. */}
          <div className="max-w-lg mx-auto px-5">
            <div className="relative w-full aspect-[4/5] rounded-[20px] overflow-hidden">
              <Image
                src="/assets/supergreen-fear.png"
                alt="Perempuan kelelahan begadang di depan laptop pada malam hari"
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover object-center"
              />
              {/* Scrim — darkens the headline area at the top */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A100C]/80 via-transparent via-45% to-[#0F1812]/55" />
              <div className="absolute inset-x-0 top-0 px-5 pt-6">
                <h2 className="font-[family-name:var(--font-dm-serif)] text-[34px] sm:text-[44px] leading-[1.1] text-[#F4F0E2]">
                  {fear.headlineLines[0]}
                </h2>
                <p className="font-[family-name:var(--font-dm-serif)] text-[22px] sm:text-[24px] leading-snug text-[#C7B463] mt-7 max-w-[50%]">
                  {fear.headlineLines[1]}
                </p>
              </div>
            </div>
          </div>

          {/* Dark content continues below the image */}
          <div className="relative max-w-lg mx-auto px-5 pt-8 pb-16">
            <div className="space-y-4 text-[17px] leading-relaxed text-[#CDD2C0] mb-6">
              {fear.bodyTop.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Escalation of small signals */}
            <ul className="space-y-2.5 mb-6 border-l-2 border-[#3A4A30] pl-4">
              {fear.escalation.map((line, i) => (
                <li key={i} className="text-[17px] leading-relaxed text-[#DCDFCF]">
                  {line}
                </li>
              ))}
            </ul>

            <p className="text-[17px] leading-relaxed text-[#CDD2C0] mb-6">{fear.bodyMid[0]}</p>

            {/* "Yang bahaya" — light warning callout */}
            <div className="rounded-[20px] bg-[#EDEAD9] p-5 mb-9">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#C7B463] text-[#3A3411] flex-shrink-0">
                  <AlertTriangle className="w-8 h-8" aria-hidden="true" />
                </span>
                <div className="space-y-2 text-[16px] leading-relaxed text-[#3A3A2E]">
                  <p className="font-semibold text-[#22251C]">{fear.bodyMid[1]}</p>
                  <p>{fear.bodyMid[2]}</p>
                </div>
              </div>
            </div>

            {/* Punch headline */}
            <h3 className="font-[family-name:var(--font-dm-serif)] text-[22px] sm:text-2xl leading-snug text-[#F2EEDF] text-center mb-7">
              {fear.punch}
            </h3>

            {/* Consequence icon grid */}
            <div className="grid grid-cols-3 gap-3 mb-9">
              {fear.consequences.map((line, i) => {
                const Icon = CONSEQUENCE_ICONS[i] ?? AlertTriangle
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center rounded-[16px] border border-[#2C3826] bg-[#1B2820] px-2 py-4"
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#243020] text-[#C7B463] mb-2">
                      <Icon className="w-8 h-8" aria-hidden="true" />
                    </span>
                    <span className="text-xs leading-snug text-[#CDD2C0]">{line}</span>
                  </div>
                )
              })}
            </div>

            {/* Closing callout with alert accent */}
            <div className="flex items-start gap-3 rounded-[20px] border border-[#3A2E26] bg-[#21180F]/60 p-5">
              <AlertTriangle className="w-8 h-8 text-[#C2614D] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[17px] leading-relaxed text-[#E7E3D4]">{fear.closing}</p>
            </div>
          </div>
        </section>

        {/* ══ SECTION 4 — MINDSET SHIFT (mockup-04) ══ */}
        <section className="relative overflow-hidden px-5 py-16 bg-[#F6F4EC]">
          <LeafOrnament className="top-4 right-2 w-20 h-20 rotate-[18deg] text-[#6F8556]/20" />
          <div className="relative max-w-lg mx-auto">
            {/* VERIFIKASI: menyebut "maag" — pastikan cocok dengan klaim disetujui BPOM TI044511731 */}
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[26px] sm:text-[34px] leading-[1.22] text-[#1F3A29] mb-8">
              <Highlight text={mindset.headline} phrase="cuma maag" />
            </h2>

            {/* "dianggap biasa" — habit rows with icons */}
            <div className="space-y-2.5 mb-8">
              {mindset.normalized.map((line, i) => {
                const Icon = NORMALIZED_ICONS[i] ?? Leaf
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-[16px] bg-white/70 border border-[#E3E0CE] px-4 py-2.5"
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#EBEEE3] text-[#5E7050] flex-shrink-0">
                      <Icon className="w-7 h-7" aria-hidden="true" />
                    </span>
                    <span className="text-[17px] leading-snug text-[#42513C]">{line}</span>
                  </div>
                )
              })}
            </div>

            <p className="font-[family-name:var(--font-dm-serif)] text-xl text-[#2F4A34] mb-9">
              {mindset.afterNormalized}
            </p>

            <p className="text-[17px] leading-relaxed text-[#42513C] mb-5">{mindset.costIntro}</p>

            {/* "Mahal …" cost grid */}
            <div className="grid grid-cols-2 gap-3 mb-9">
              {mindset.costs.map((line, i) => {
                const Icon = COST_ICONS[i] ?? Wallet
                const wide = i === mindset.costs.length - 1
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-[16px] border border-[#E3E0CE] bg-[#EFEDE0] px-4 py-3 ${
                      wide ? 'col-span-2' : ''
                    }`}
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                      <Icon className="w-7 h-7" aria-hidden="true" />
                    </span>
                    <span className="text-[16px] leading-snug text-[#3A4A33] font-medium">{line}</span>
                  </div>
                )
              })}
            </div>

            {/* Bridge to product */}
            <div className="rounded-[22px] bg-[#E4EAD7] border border-[#CBD3B6] p-6">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                  <Sprout className="w-8 h-8" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[17px] leading-relaxed text-[#2F4A34] mb-3">{mindset.bridge[0]}</p>
                  <p className="font-[family-name:var(--font-dm-serif)] text-xl leading-snug text-[#1F3A29]">
                    <Highlight text={mindset.bridge[1]} phrase="perbaiki dukungan nutrisi harianmu." />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECTION 5 — INTRODUCE SUPERGREEN FOOD (mockup-05) ══ */}
        <section className="relative overflow-hidden px-5 py-16 bg-[#EBEEE3]">
          <LeafOrnament className="top-4 right-2 w-20 h-20 rotate-[20deg] text-[#6F8556]/20" />
          <div className="relative max-w-lg mx-auto">
            <Eyebrow>Langkah kecil untuk tubuh yang lebih seimbang</Eyebrow>
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[27px] sm:text-[34px] leading-[1.18] text-[#1F3A29] mb-6">
              {introduce.headline}
            </h2>

            {/* Foto produk asli — packshot bg #EBEEE3 (sama dengan bg section),
                menyatu tanpa kartu/border */}
            <div className="mb-6">
              <Image
                src="/assets/supergreen-packshot-2.png"
                alt="Supergreen Food — dus dan botol 600 tablet Bio Micro Algae, terdaftar BPOM"
                width={1000}
                height={786}
                sizes="(max-width: 640px) 100vw, 512px"
                className="w-full h-auto"
              />
            </div>

            {/* VERIFIKASI: klaim fungsi — pastikan cocok dengan klaim disetujui BPOM TI044511731 */}
            <div className="space-y-4 text-[17px] leading-relaxed text-[#42513C]">
              {introduce.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Positioning card */}
            <div className="mt-8 rounded-[22px] bg-[#E4EAD7] border border-[#CBD3B6] p-6">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                  <Leaf className="w-8 h-8" aria-hidden="true" />
                </span>
                <p className="font-[family-name:var(--font-dm-serif)] text-lg leading-snug text-[#1F3A29]">
                  {introduce.positioning}
                </p>
              </div>
            </div>

            {/* BPOM trust box */}
            {/* VERIFIKASI: nomor & kategori BPOM TI044511731 */}
            <div className="mt-5 rounded-[20px] bg-white border border-[#DCE1CE] p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                  <ShieldCheck className="w-8 h-8" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7A5E] mb-1">
                    Terdaftar BPOM RI
                  </p>
                  <p className="font-bold text-[16px] text-[#1F3A29] mb-1.5">
                    <Highlight text={introduce.trustTitle} phrase="TI044511731" />
                  </p>
                  <p className="text-[16px] leading-relaxed text-[#42513C]">{introduce.trustBody}</p>
                </div>
              </div>
            </div>

            {/* CTA — scroll ke section paket (in-page) */}
            <a href="#section-offer" className={`${BTN_PRIMARY} mt-7`}>
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              Mulai Hidup Sehat SGF
            </a>
          </div>
        </section>

        {/* ══ SECTION 6 — FUNGSI SGF YANG RELATE (benefit cards) ══ */}
        {/* VERIFIKASI: setiap klaim fungsi di kartu — cocokkan dengan klaim disetujui BPOM TI044511731 */}
        <section className="relative overflow-hidden px-5 py-16 bg-[#F6F4EC]">
          <div className="relative isolate max-w-lg mx-auto">
            {/* Dekorasi pojok kanan atas — foto ranting daun + mangkuk tablet hijau.
                Bg gambar = #F6F4EC (sama dengan bg section). Diposisikan di dalam container
                konten agar batas kanannya sejajar dengan batas kanan body text; -z-10 +
                isolate supaya duduk di belakang teks tapi tetap di atas bg section. */}
            <Image
              src="/assets/supergreen-leaves-bowl.png"
              alt=""
              aria-hidden="true"
              width={600}
              height={590}
              className="pointer-events-none select-none absolute top-0 right-0 w-40 h-auto -translate-y-2 -z-10"
            />
            <Eyebrow>Langkah kecil untuk tubuh yang lebih seimbang</Eyebrow>
            {/* Headline dibatasi max 70% lebar body agar terbaca sempurna dan
                dekorasi daun+mangkuk di kanan tetap terlihat utuh */}
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[24px] sm:text-[34px] leading-[1.22] text-[#1F3A29] mb-4 max-w-[70%]">
              {benefits.headline}
            </h2>
            <p className="text-[17px] leading-relaxed text-[#42513C] mb-9">
              {benefits.subheadline}
            </p>

            {/* Benefit rows — icon badge kiri, judul + deskripsi kanan (sesuai mockup 6) */}
            <div className="space-y-6">
              {benefits.items.map((item, i) => {
                const Icon = ICONS[item.icon as IconName] ?? Leaf
                return (
                  <div key={i} className="flex items-start gap-4">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2F4A34] text-[#F6F4EC] flex-shrink-0">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-bold text-[17px] text-[#1F3A29] leading-snug mb-1">
                        {item.title}
                      </p>
                      <p className="text-[16px] leading-relaxed text-[#42513C]">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Positioning card — "bukan alasan makan sembarangan" */}
            <div className="mt-10 rounded-[22px] bg-[#E4EAD7] border border-[#CBD3B6] p-6">
              <div className="flex items-start gap-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                  <Leaf className="w-6 h-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-[17px] text-[#1F3A29] leading-snug mb-1">
                    {benefits.positioning.title}
                  </p>
                  <p className="text-[16px] leading-relaxed text-[#42513C]">
                    {benefits.positioning.body}
                  </p>
                </div>
              </div>
            </div>

            {/* BPOM card — nomor registrasi + kategori TI */}
            {/* VERIFIKASI: nomor & kategori BPOM TI044511731 */}
            <div className="mt-5 rounded-[20px] bg-white border border-[#DCE1CE] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block rounded-md bg-[#EBEEE3] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#3E5235] mb-2.5">
                    {benefits.bpom.label}
                  </span>
                  <p className="font-bold text-[24px] text-[#1F3A29] leading-none mb-1.5">
                    {benefits.bpom.number}
                  </p>
                  <p className="font-bold text-[15px] text-[#1F3A29] mb-2">
                    {benefits.bpom.category}
                  </p>
                  <p className="text-[14px] leading-relaxed text-[#6B7A5E]">
                    {benefits.bpom.note}
                  </p>
                </div>
                {/* TODO ASSET: ganti ikon ini dengan logo resmi Badan POM (badan-pom.png,
                    bg transparan) — jangan AI-generate, pakai file logo asli. */}
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EBF2F8] text-[#1B5E9E] flex-shrink-0">
                  <ShieldCheck className="w-8 h-8" aria-hidden="true" />
                </span>
              </div>
            </div>

            {/* Closing band — hijau gelap, penutup section */}
            <div className="mt-8 rounded-[22px] bg-[#1E3D26] p-6 flex items-start gap-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-full border border-[#5A6B4D] text-[#C7B463] flex-shrink-0">
                <Leaf className="w-6 h-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[15px] leading-snug text-[#E7E3D4] mb-1.5">
                  {benefits.closingBand.line1}
                </p>
                <p className="font-bold text-[19px] leading-snug text-white">
                  {benefits.closingBand.line2}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECTION 7 — TESTIMONIALS ══ */}
        {/* PLACEHOLDER — SEMUA testimoni adalah placeholder. WAJIB diganti dengan testimoni
            pelanggan ASLI (produk Obat Tradisional terdaftar BPOM) sebelum publish.
            Tidak merender foto orang asli — pakai inisial/avatar sampai ada izin + testimoni real. */}
        <section className="section-testimonials px-5 py-16 bg-[#EBEEE3]">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[26px] sm:text-3xl leading-snug text-[#1F3A29] mb-4">
              {testimonials.headlineLines[0]}
              <br />
              <span className="text-[#2F4A34]">{testimonials.headlineLines[1]}</span>
            </h2>
            <p className="text-[17px] leading-relaxed text-[#42513C] mb-8">
              {testimonials.subheadline}
            </p>

            <div className="space-y-4">
              {testimonials.items.map((t, i) =>
                t.photo ? (
                  /* Varian berfoto — tanpa ikon kutip emas: foto di kiri kutipan,
                     nama di kiri bawah, badge "Verified Customer" di kanan bawah. */
                  <figure
                    key={i}
                    className="rounded-[22px] bg-white border border-[#DCE1CE] p-5 shadow-sm"
                  >
                    {/* Foto centered secara vertikal; nama + badge masuk kolom kanan
                        agar sejajar dengan body kutipan */}
                    <div className="flex items-center gap-4">
                      <Image
                        src={t.photo}
                        alt={`Foto ${t.name}`}
                        width={400}
                        height={400}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex gap-0.5 mb-2" aria-hidden="true">
                          {[0, 1, 2, 3, 4].map((s) => (
                            <Star key={s} className="w-4 h-4 text-[#C7B463] fill-[#C7B463]" />
                          ))}
                        </div>
                        <blockquote className="text-[17px] leading-relaxed text-[#42513C]">
                          “{t.quote}”
                        </blockquote>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <figcaption className="text-[16px]">
                            <span className="font-bold text-[#1F3A29]">{t.name}</span>
                            <span className="text-[#6B7A5E]"> — {t.label}</span>
                          </figcaption>
                          {t.verified && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF6EE] border border-[#CBE3CE] px-2.5 py-1 text-[11px] font-semibold text-[#2F4A34] flex-shrink-0">
                              <span
                                className="w-2 h-2 rounded-full bg-[#3FA456]"
                                aria-hidden="true"
                              />
                              Verified Customer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </figure>
                ) : (
                  <figure
                    key={i}
                    className="rounded-[22px] bg-white border border-[#DCE1CE] p-5 shadow-sm"
                  >
                    <div className="flex gap-0.5 mb-3" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <Star key={s} className="w-4 h-4 text-[#C7B463] fill-[#C7B463]" />
                      ))}
                    </div>
                    <blockquote className="text-[17px] leading-relaxed text-[#42513C] mb-4">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2F4A34] text-[#EBEEE3] text-[16px] font-bold flex-shrink-0">
                        {t.name.replace(/\W/g, '').charAt(0) || '•'}
                      </span>
                      <span className="text-[16px]">
                        <span className="font-bold text-[#1F3A29]">{t.name}</span>
                        <span className="text-[#6B7A5E]"> — {t.label}</span>
                      </span>
                    </figcaption>
                  </figure>
                )
              )}
            </div>

            <p className="text-xs text-[#6B7A5E] leading-relaxed text-center mt-6 mb-7">
              {testimonials.disclaimer}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Scroll ke section paket (in-page) — bukan link keluar */}
              <a href="#section-offer" className={BTN_PRIMARY}>
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                Mulai Hidup Sehat SGF
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={`cta-whatsapp ${BTN_SECONDARY}`}>
                <WhatsAppIcon className="w-5 h-5" />
                Chat CS
              </a>
            </div>
          </div>
        </section>

        {/* ══ SECTION 8 — DECISION PRESSURE (first CTA appears here) ══ */}
        <section className="px-5 py-16 bg-[#F6F4EC]">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[26px] sm:text-3xl leading-snug text-[#1F3A29] mb-7">
              {decision.headlineLines[0]}
              <br />
              <span className="text-[#2F4A34]">{decision.headlineLines[1]}</span>
            </h2>

            {/* Satu kalimat per paragraf dengan jeda lega — biar tiap kalimat
                sempat mengendap sebelum lanjut ke kalimat berikutnya */}
            <div className="space-y-6 text-[17px] leading-relaxed text-[#42513C] mb-10">
              {decision.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-9">
              <div className="rounded-[22px] bg-[#F3EFE3] border border-[#E3DCC8] p-5">
                <p className="font-bold text-[17px] text-[#7A6A3E] mb-4">{decision.cardWait.title}</p>
                <ul className="space-y-2.5">
                  {decision.cardWait.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <X className="w-4 h-4 mt-0.5 text-[#B0894A] flex-shrink-0" aria-hidden="true" />
                      <span className="text-[16px] leading-relaxed text-[#5C5740]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] bg-[#2F4A34] text-[#EBEEE3] p-5">
                <p className="font-bold text-[17px] mb-4">{decision.cardStart.title}</p>
                <ul className="space-y-2.5">
                  {decision.cardStart.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 mt-0.5 text-[#C7B463] flex-shrink-0" aria-hidden="true" />
                      <span className="text-[16px] leading-relaxed text-[#E7E3D4]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Primary here scrolls to the offer section (in-page nav) */}
              <a href="#section-offer" className={BTN_PRIMARY}>
                <Package className="w-5 h-5" aria-hidden="true" />
                {decision.ctaPrimary}
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={`cta-whatsapp ${BTN_SECONDARY}`}>
                <WhatsAppIcon className="w-5 h-5" />
                {decision.ctaSecondary}
              </a>
            </div>
          </div>
        </section>

        {/* ══ SECTION 9 — WHY BUY AT EVC ══ */}
        <section className="section-why-evc px-5 py-16 bg-white">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[26px] sm:text-3xl leading-snug text-[#1F3A29] mb-3">
              {whyEvc.headline}
            </h2>
            <p className="font-semibold text-[17px] text-[#2F4A34] mb-6 leading-relaxed">
              {whyEvc.subheadline}
            </p>

            <div className="space-y-4 text-[17px] leading-relaxed text-[#42513C] mb-7">
              {whyEvc.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="rounded-[20px] bg-[#EBEEE3] border border-[#DCE1CE] p-5 mb-8">
              <p className="font-[family-name:var(--font-dm-serif)] text-lg leading-snug text-[#1F3A29]">
                {whyEvc.positioning}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {whyEvc.benefits.map((b, i) => {
                const Icon = ICONS[b.icon as IconName] ?? BadgeCheck
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-[18px] bg-[#F6F4EC] border border-[#DCE1CE] p-4"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2F4A34] text-[#EBEEE3] flex-shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-bold text-[17px] text-[#1F3A29] mb-0.5">{b.title}</p>
                      <p className="text-[16px] leading-relaxed text-[#42513C]">{b.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[17px] leading-relaxed text-[#42513C] mb-3">{whyEvc.closingIntro}</p>
            <ul className="space-y-1.5 mb-5">
              {whyEvc.closingList.map((line, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#2F4A34] flex-shrink-0" aria-hidden="true" />
                  <span className="text-[17px] font-medium text-[#1F3A29]">{line}</span>
                </li>
              ))}
            </ul>
            <p className="font-[family-name:var(--font-dm-serif)] text-xl text-[#1F3A29] mb-7">
              {whyEvc.closingPunch}
            </p>

            <div className="flex flex-col gap-3">
              {/* Scroll ke section paket (in-page) — bukan link keluar */}
              <a href="#section-offer" className={BTN_PRIMARY}>
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                {whyEvc.ctaPrimary}
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={`cta-whatsapp ${BTN_SECONDARY}`}>
                <WhatsAppIcon className="w-5 h-5" />
                {whyEvc.ctaSecondary}
              </a>
            </div>
            <p className="text-center text-[16px] font-semibold text-[#6B7A5E] mt-4">
              {whyEvc.microcopy}
            </p>
          </div>
        </section>

        {/* ══ SECTION 10 — OFFER / PAKET ══ */}
        {/* HARGA BELUM FINAL → paket generik tanpa angka. Jangan mengarang harga.
            PLACEHOLDER — konfirmasi penawaran/bonus/nominal hemat real sebelum publish. */}
        <section id="section-offer" className="section-offer px-5 py-16 bg-[#EBEEE3] scroll-mt-20">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[28px] sm:text-3xl text-[#1F3A29] mb-3">
              {offer.headline}
            </h2>
            <p className="text-[17px] leading-relaxed text-[#42513C] mb-6">{offer.subheadline}</p>

            <div className="space-y-3 text-[17px] leading-relaxed text-[#42513C] mb-8">
              {offer.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Package cards — foto kecil, harga coret → promo, CTA unik per paket.
                PLACEHOLDER: harga & link masih dummy (lihat content file). */}
            <div className="space-y-4 mb-8">
              {offer.packages.map((pkg, i) => (
                <div
                  key={i}
                  className={`relative rounded-[22px] p-5 shadow-sm ${
                    pkg.recommended
                      ? 'bg-[#2F4A34] text-[#EBEEE3] border-2 border-[#C7B463]'
                      : 'bg-white text-[#1F3A29] border border-[#DCE1CE]'
                  }`}
                >
                  {/* Badge diskon merah — pojok kanan atas, mencolok sebagai daya tarik utama */}
                  {pkg.discountBadge && (
                    <span className="absolute -top-3.5 right-4 inline-flex items-center rounded-full bg-[#E02020] text-white text-[15px] font-extrabold tracking-wide px-4 py-1.5 shadow-lg shadow-[#E02020]/30">
                      {pkg.discountBadge}
                    </span>
                  )}
                  {pkg.badge && (
                    <span className="inline-flex items-center gap-1 bg-[#C7B463] text-[#1F3A29] text-xs font-bold px-3 py-1 rounded-full mb-3">
                      <Star className="w-3.5 h-3.5 fill-[#1F3A29]" aria-hidden="true" />
                      {pkg.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    {/* Foto paket kecil — placeholder ikon sampai asset diupload */}
                    {pkg.photo ? (
                      <Image
                        src={pkg.photo}
                        alt={pkg.name}
                        width={300}
                        height={300}
                        className="w-20 h-20 rounded-[14px] object-cover flex-shrink-0 bg-white"
                      />
                    ) : (
                      <span
                        className={`flex items-center justify-center w-20 h-20 rounded-[14px] flex-shrink-0 border border-dashed ${
                          pkg.recommended
                            ? 'bg-[#26402B] border-[#5A6B4D] text-[#9DB08A]'
                            : 'bg-[#F1F3E8] border-[#C9CFB6] text-[#8A9B6E]'
                        }`}
                      >
                        <Package className="w-7 h-7" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-lg leading-tight">{pkg.name}</p>
                      <p
                        className={`text-[15px] leading-snug mt-0.5 ${
                          pkg.recommended ? 'text-[#D8DCC8]' : 'text-[#6B7A5E]'
                        }`}
                      >
                        {pkg.tagline}
                      </p>
                      {/* Harga: asli dicoret → promo */}
                      <div className="flex items-baseline gap-2.5 mt-2 flex-wrap">
                        <span
                          className={`text-[14px] line-through decoration-[1.5px] ${
                            pkg.recommended ? 'text-[#A8B098]' : 'text-[#9AA38B]'
                          }`}
                        >
                          {pkg.priceOriginal}
                        </span>
                        <span
                          className={`font-bold text-[20px] leading-none ${
                            pkg.recommended ? 'text-[#C7B463]' : 'text-[#1F3A29]'
                          }`}
                        >
                          {pkg.pricePromo}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* CTA per paket — link unik (fallback ke katalog bila belum diisi) */}
                  <a
                    href={pkg.ctaUrl ? makeBuyLink(pkg.ctaUrl) : buyLink}
                    className={`cta-buy-official cta-package-${i + 1} mt-4 inline-flex items-center justify-center gap-2 w-full text-center py-3.5 rounded-2xl font-bold text-base transition-colors ${
                      pkg.recommended
                        ? 'bg-[#C7B463] text-[#1F3A29] hover:bg-[#B8A551]'
                        : 'bg-[#2F4A34] text-[#F6F4EC] hover:bg-[#22351F]'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                    {pkg.ctaLabel}
                  </a>
                </div>
              ))}
            </div>

            {/* Benefit box */}
            <div className="rounded-[22px] bg-white border border-[#DCE1CE] p-5 mb-8">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                {offer.benefitBox.map((b, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#2F4A34] flex-shrink-0" aria-hidden="true" />
                    <span className="text-[16px] text-[#1F3A29]">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA beli per paket sudah ada di tiap kartu — di sini cukup jalur konsultasi */}
            <a href={waLink} target="_blank" rel="noopener noreferrer" className={`cta-whatsapp ${BTN_SECONDARY}`}>
              <WhatsAppIcon className="w-5 h-5" />
              {offer.ctaSecondary}
            </a>
            <p className="text-center text-xs text-[#6B7A5E] mt-4">{offer.promoNote}</p>
          </div>
        </section>

        {/* ══ SECTION 11 — FAQ + CARA KONSUMSI ══ */}
        {/* VERIFIKASI: beberapa jawaban menyebut BPOM TI044511731, klaim fungsi, dan
            maag/asam lambung/GERD — lihat penanda di content/lp/supergreen-food.ts (faq) */}
        <section className="px-5 py-16 bg-[#F6F4EC]">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[26px] sm:text-3xl text-[#1F3A29] mb-7">
              Pertanyaan Umum &amp; Cara Konsumsi
            </h2>

            <div className="space-y-3">
              {faq.items.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-[18px] bg-white border border-[#DCE1CE] overflow-hidden"
                >
                  <summary className="cursor-pointer px-5 py-4 font-semibold text-[17px] text-[#1F3A29] flex justify-between items-center gap-3 list-none">
                    {item.q}
                    <Plus
                      className="w-5 h-5 text-[#2F4A34] flex-shrink-0 transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-5 pb-5 text-[16px] leading-relaxed text-[#42513C]">{item.a}</div>
                </details>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              {/* Scroll ke section paket (in-page) — bukan link keluar */}
              <a href="#section-offer" className={BTN_PRIMARY}>
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                Mulai Hidup Sehat SGF
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={`cta-whatsapp ${BTN_SECONDARY}`}>
                <WhatsAppIcon className="w-5 h-5" />
                Chat CS
              </a>
            </div>
          </div>
        </section>

        {/* ══ SECTION 12 — FINAL CTA + DISCLAIMER (deep green closing) ══ */}
        <section className="px-5 py-16 bg-[#152018] text-[#E7E3D4]">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-[27px] sm:text-3xl leading-snug text-[#F2EEDF] mb-6">
              {finalCta.headline}
            </h2>

            <div className="space-y-3 text-[17px] leading-relaxed text-[#CDD2C0] mb-8 text-left">
              {finalCta.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="flex flex-col gap-3 mb-7">
              {/* Scroll ke section paket (in-page) — bukan link keluar */}
              <a
                href="#section-offer"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#C7B463] text-[#1F3A29] py-4 rounded-2xl font-bold text-base hover:bg-[#B8A551] transition-colors"
              >
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                {finalCta.ctaPrimary}
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-whatsapp inline-flex items-center justify-center gap-2 w-full border-2 border-[#5A6B4D] text-[#E7E3D4] py-3.5 rounded-2xl font-semibold text-base hover:border-[#C7B463] transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
                {finalCta.ctaSecondary}
              </a>
            </div>

            <p className="font-[family-name:var(--font-dm-serif)] text-xl leading-snug text-[#C7B463] mb-9">
              {finalCta.emotionalLine}
            </p>

            {/* VERIFIKASI: disclaimer BPOM TI044511731 — pastikan kategori & nomor benar */}
            <p className="text-xs leading-relaxed text-[#9AA388] text-left border-t border-[#33402B] pt-6">
              {finalCta.disclaimer}
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER MINIMAL */}
      <footer className="bg-[#0F1812] text-[#9AA388] py-8 px-5 text-center">
        <p className="font-bold text-[#C7B463] mb-1">EVC Mercato</p>
        <p className="text-xs">Distributor Resmi KKI Group</p>
        <a
          href={buyLink}
          className="cta-buy-official text-xs text-[#9AA388] hover:text-[#E7E3D4] mt-2 inline-block"
        >
          evcmercato.com
        </a>
        <p className="text-xs text-[#5E6B52] mt-3">
          © 2026 EVC Mercato · Supergreen Food terdaftar BPOM TI044511731 (Obat Tradisional Impor).
        </p>
      </footer>
    </>
  )
}
