'use client'
import { trackPixelEvent } from '@/lib/marketing/pixel'
import type { LandingCTA as CTAType } from '@/lib/marketing/types'

export default function LandingCTABanner({ cta, headline }: { cta: CTAType; headline: string }) {
  return (
    <section className="py-12 px-4 bg-[#7FB300] text-white text-center">
      <h2 className="text-2xl font-bold mb-2">{headline}</h2>
      <a
        href={cta.link}
        onClick={() => trackPixelEvent('InitiateCheckout')}
        className="inline-block mt-4 bg-white text-[#7FB300] px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
      >
        {cta.text}
      </a>
    </section>
  )
}
