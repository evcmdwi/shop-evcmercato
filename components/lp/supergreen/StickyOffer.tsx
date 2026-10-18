'use client'
import { useEffect, useState } from 'react'
import { trackCustomPixelEvent, trackPixelEvent } from '@/lib/marketing/pixel'
import TrackedLink from './TrackedLink'
import { WhatsAppIcon } from './icons'

/** fbq dimuat afterInteractive dari layout root — tunggu sebentar sebelum mengirim. */
function whenPixelReady(fn: () => void, tries = 20) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).fbq) return fn()
  if (tries > 0) setTimeout(() => whenPixelReady(fn, tries - 1), 300)
}

/**
 * Event halaman (ViewContent, ScrollToOffer) + bar melayang di HP: muncul setelah hero
 * terlewati, hilang saat #paket terlihat.
 */
export default function StickyOffer({
  label,
  price,
  waHref,
}: {
  label: string | null
  price: string | null
  waHref: string
}) {
  const [pastHero, setPastHero] = useState(false)
  const [offerVisible, setOfferVisible] = useState(false)

  useEffect(() => {
    whenPixelReady(() =>
      trackPixelEvent('ViewContent', {
        content_name: 'Supergreen Food',
        content_category: 'Obat Tradisional',
        content_ids: ['supergreen'],
        content_type: 'product_group',
      })
    )

    const hero = document.getElementById('hero')
    const offer = document.getElementById('paket')
    let offerTracked = false
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0)
        if (e.target === offer) {
          setOfferVisible(e.isIntersecting)
          if (e.isIntersecting && !offerTracked) {
            offerTracked = true
            whenPixelReady(() => trackCustomPixelEvent('ScrollToOffer', { campaign: 'supergreen_food' }))
          }
        }
      }
    })
    if (hero) obs.observe(hero)
    if (offer) obs.observe(offer)
    return () => obs.disconnect()
  }, [])

  const show = pastHero && !offerVisible
  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#1F4A33]/15 bg-[#F5F2EA]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur transition-transform duration-300 md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <div className="min-w-0 flex-1 leading-tight">
          {label && <p className="truncate text-xs text-[#1D2A22]/75">{label}</p>}
          {price && <p className="text-base font-extrabold text-[#1D2A22]">{price}</p>}
        </div>
        <TrackedLink
          href={waHref}
          event={{ type: 'contact', context: 'sticky' }}
          aria-label="Tanya admin via WhatsApp"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#1F4A33] text-[#1F4A33]"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </TrackedLink>
        <a
          href="#paket"
          className="flex h-11 shrink-0 items-center rounded-xl bg-[#B9531A] px-5 text-sm font-bold text-white"
        >
          Lihat paket
        </a>
      </div>
    </div>
  )
}
