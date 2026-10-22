'use client'
import { useEffect, useState } from 'react'
import { trackCustomPixelEvent, trackPixelEvent } from '@/lib/marketing/pixel'
import { WhatsAppIcon } from '@/components/lp/supergreen/icons'
import TrackedLink from './TrackedLink'

/** fbq dimuat afterInteractive dari layout root — tunggu sebentar sebelum mengirim. */
function whenPixelReady(fn: () => void, tries = 20) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).fbq) return fn()
  if (tries > 0) setTimeout(() => whenPixelReady(fn, tries - 1), 300)
}

/**
 * Event halaman (ViewContent, ScrollToProducts) + bar melayang di HP: muncul setelah hero
 * terlewati, hilang saat #produk terlihat.
 */
export default function StickyBar({ waHref, ctaText }: { waHref: string; ctaText: string }) {
  const [pastHero, setPastHero] = useState(false)
  const [productsVisible, setProductsVisible] = useState(false)

  useEffect(() => {
    whenPixelReady(() => trackPixelEvent('ViewContent', { content_name: 'EVC Resmi', content_ids: ['evc-resmi'] }))

    const hero = document.getElementById('hero')
    const produk = document.getElementById('produk')
    let tracked = false
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0)
        if (e.target === produk) {
          setProductsVisible(e.isIntersecting)
          if (e.isIntersecting && !tracked) {
            tracked = true
            whenPixelReady(() => trackCustomPixelEvent('ScrollToProducts', { campaign: 'evc_resmi' }))
          }
        }
      }
    })
    if (hero) obs.observe(hero)
    if (produk) obs.observe(produk)
    return () => obs.disconnect()
  }, [])

  const show = pastHero && !productsVisible
  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#E6E4DD] bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur md:hidden ${
        show ? 'visible' : 'invisible'
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <TrackedLink
          href={waHref}
          event={{ type: 'contact', context: 'sticky' }}
          aria-label="Chat admin via WhatsApp"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </TrackedLink>
        <a
          href="#produk"
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#B9531A] px-5 text-base font-bold text-white"
        >
          {ctaText}
        </a>
      </div>
    </div>
  )
}
