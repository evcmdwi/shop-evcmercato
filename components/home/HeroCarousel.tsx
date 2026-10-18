'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { getImageProps } from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HERO_BANNER_SIZES, type HeroSettings, type HeroSlide } from '@/lib/hero-banners'

interface HeroCarouselProps {
  slides: HeroSlide[]
  settings: HeroSettings
  /** Tampil bila tidak ada banner aktif (kartu sambutan seperti sebelumnya). */
  fallback: ReactNode
}

const SIZES = '(min-width: 1232px) 1168px, calc(100vw - 32px)'

/**
 * Hero beranda: banner gambar dari Sambers › Tampilan Toko › Banner Hero.
 * Geser memakai CSS scroll-snap (tanpa library) — swipe di HP bawaan browser.
 * `?preview_banners=1` (admin login) → memakai data draf dari API admin.
 */
export default function HeroCarousel({ slides: liveSlides, settings: liveSettings, fallback }: HeroCarouselProps) {
  const [preview, setPreview] = useState<{ slides: HeroSlide[]; settings: HeroSettings; start: number } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview_banners') !== '1') return
    const q = new URLSearchParams({ preview: '1' })
    const focus = params.get('banner')
    if (focus) q.set('banner', focus)
    fetch(`/api/sambers/banners?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.slides) setPreview({ slides: d.slides, settings: d.settings, start: d.start ?? 0 }) })
      .catch(() => {})
  }, [])

  const banners = preview?.slides ?? liveSlides
  const settings = preview?.settings ?? liveSettings
  if (banners.length === 0) return <>{fallback}</>

  return (
    <Carousel
      key={preview ? 'preview' : 'live'}
      slides={banners}
      intervalSeconds={settings.intervalSeconds}
      isPreview={!!preview}
      startIndex={preview?.start ?? 0}
    />
  )
}

function Carousel({
  slides,
  intervalSeconds,
  isPreview,
  startIndex,
}: {
  slides: HeroSlide[]
  intervalSeconds: number
  isPreview: boolean
  startIndex: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false) // disentuh → auto geser berhenti sampai halaman dimuat ulang
  const [hidden, setHidden] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [warm, setWarm] = useState(false) // setelah halaman selesai dimuat, gambar slide lain diunduh lebih awal
  const n = slides.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMq = () => setReducedMotion(mq.matches)
    const onVis = () => setHidden(document.hidden)
    onMq()
    onVis()
    mq.addEventListener('change', onMq)
    document.addEventListener('visibilitychange', onVis)
    const onLoad = () => setTimeout(() => setWarm(true), 1500)
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => {
      mq.removeEventListener('change', onMq)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const track = trackRef.current
      if (!track) return
      const target = ((i % n) + n) % n
      track.scrollTo({ left: target * track.clientWidth, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' })
    },
    [n, reducedMotion]
  )

  useEffect(() => {
    if (startIndex > 0) goTo(startIndex, false)
  }, [startIndex, goTo])

  // Indeks aktif mengikuti posisi gulir (swipe, panah, maupun auto).
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (track.clientWidth > 0) setIndex(Math.round(track.scrollLeft / track.clientWidth))
      })
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const paused = hovered || focused || touched || hidden || reducedMotion
  useEffect(() => {
    if (paused || n < 2) return
    const t = setTimeout(() => goTo(index + 1), intervalSeconds * 1000)
    return () => clearTimeout(t)
  }, [paused, index, n, intervalSeconds, goTo])

  const trackClick = (id: string) => {
    if (isPreview) return
    try {
      navigator.sendBeacon?.(`/api/banners/${id}/click`)
    } catch {
      /* analitik tidak boleh mengganggu klik */
    }
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promo EVC Mercato"
      className="relative"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true) }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(false) }}
      onTouchStart={() => setTouched(true)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false) }}
    >
      <h1 className="sr-only">EVC Mercato — produk KKI Group langsung dari distributornya</h1>
      {isPreview && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow">
          Mode pratinjau
        </span>
      )}

      <div className="relative">
        <div
          ref={trackRef}
          className="flex aspect-[3/2] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[18px] [scrollbar-width:none] md:aspect-[3/1] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${n}`}
              inert={i !== index}
              className="relative h-full w-full shrink-0 snap-start snap-always"
            >
              <BannerSlide
                slide={s}
                loading={warm || i === 0 ? 'eager' : 'lazy'}
                highPriority={i === 0}
                onClick={() => trackClick(s.id)}
              />
            </div>
          ))}
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Slide sebelumnya"
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-evc-ink shadow-md hover:bg-white md:flex"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Slide berikutnya"
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-evc-ink shadow-md hover:bg-white md:flex"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="mt-1 flex justify-center">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1} dari ${n}`}
              aria-current={i === index ? 'true' : undefined}
              className="flex h-7 w-7 items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all ${i === index ? 'w-5 bg-evc-green' : 'w-2 bg-evc-border'}`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function BannerSlide({
  slide,
  loading,
  highPriority,
  onClick,
}: {
  slide: HeroSlide
  loading: 'eager' | 'lazy'
  highPriority: boolean
  onClick: () => void
}) {
  const common = { alt: slide.alt_text, sizes: SIZES }
  const desktop = slide.image_desktop_url
    ? getImageProps({ ...common, src: slide.image_desktop_url, ...HERO_BANNER_SIZES.desktop }).props.srcSet
    : null
  const { props: img } = getImageProps({
    ...common,
    src: slide.image_mobile_url,
    ...HERO_BANNER_SIZES.mobile,
    loading,
    fetchPriority: highPriority ? 'high' : undefined,
  })

  const picture = (
    <picture>
      {desktop && <source media="(min-width: 768px)" srcSet={desktop} />}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt ada di props getImageProps */}
      <img
        {...img}
        style={undefined}
        className={`h-full w-full object-cover ${desktop ? '' : 'md:object-contain'}`}
      />
    </picture>
  )

  const cls = 'block h-full w-full overflow-hidden rounded-[18px]'
  const style = { backgroundColor: slide.bg_color || 'var(--evc-green-tint)' }

  return slide.href.startsWith('https://wa.me/') ? (
    <a href={slide.href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls} style={style}>
      {picture}
    </a>
  ) : (
    <Link href={slide.href} prefetch={false} onClick={onClick} className={cls} style={style}>
      {picture}
    </Link>
  )
}
