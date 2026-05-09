'use client'
import { trackPixelEvent } from '@/lib/marketing/pixel'
import type { LandingCTA } from '@/lib/marketing/types'

interface LandingHeroProps {
  headline: string
  subheadline: string
  ctaPrimary: LandingCTA
  ctaSecondary?: LandingCTA
  backgroundColor?: string
}

export default function LandingHero({ headline, subheadline, ctaPrimary, ctaSecondary, backgroundColor }: LandingHeroProps) {
  return (
    <section className="relative py-16 px-4 text-center" style={{ backgroundColor: backgroundColor ?? '#f8fce8' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">{headline}</h1>
        <p className="text-lg text-gray-600 mb-8">{subheadline}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={ctaPrimary.link}
            onClick={() => trackPixelEvent('InitiateCheckout', { content_name: headline })}
            className="bg-[#7FB300] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#6B9700] transition-colors"
          >
            {ctaPrimary.text}
          </a>
          {ctaSecondary && (
            <a
              href={ctaSecondary.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackPixelEvent('Lead', { content_name: headline })}
              className="border-2 border-[#7FB300] text-[#7FB300] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#f8fce8] transition-colors"
            >
              {ctaSecondary.text}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
