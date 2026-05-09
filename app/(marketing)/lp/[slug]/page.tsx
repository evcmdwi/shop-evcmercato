import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LandingHero from '@/components/marketing/LandingHero'
import LandingTrust from '@/components/marketing/LandingTrust'
import LandingFAQ from '@/components/marketing/LandingFAQ'
import LandingCTABanner from '@/components/marketing/LandingCTA'
import Script from 'next/script'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import type { LandingPageContent } from '@/lib/marketing/types'

// Load content from /content/lp/*.ts
async function getContent(slug: string): Promise<LandingPageContent | null> {
  try {
    const mod = await import(`@/content/lp/${slug}`)
    return mod.default as LandingPageContent
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const content = await getContent(slug)
  if (!content) return { title: 'Not Found' }
  return {
    title: content.meta.title,
    description: content.meta.description,
    openGraph: content.meta.og_image ? { images: [content.meta.og_image] } : undefined,
  }
}

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const content = await getContent(slug)
  if (!content) notFound()

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const utm = extractUTM(new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, v])))

  // Inject UTM ke CTA links
  const ctaPrimary = {
    ...content.hero.cta_primary,
    link: appendUTM(content.hero.cta_primary.link, utm),
  }
  const ctaSecondary = content.hero.cta_secondary

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {initPixelScript(pixelId)}
        </Script>
      )}

      {/* Navbar minimal */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <a href="https://shop.evcmercato.com" className="font-bold text-[#7FB300] text-lg">EVC Mercato</a>
        <a href={ctaPrimary.link} className="text-sm bg-[#7FB300] text-white px-4 py-2 rounded-xl font-semibold">
          Belanja
        </a>
      </header>

      <main>
        <LandingHero
          headline={content.hero.headline}
          subheadline={content.hero.subheadline}
          ctaPrimary={ctaPrimary}
          ctaSecondary={ctaSecondary}
          backgroundColor={content.hero.background_color}
        />

        {content.trust_elements && content.trust_elements.length > 0 && (
          <LandingTrust elements={content.trust_elements} />
        )}

        {content.faq && content.faq.length > 0 && (
          <LandingFAQ items={content.faq} />
        )}

        <LandingCTABanner
          cta={ctaPrimary}
          headline="Siap mulai hidup lebih sehat?"
        />
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        © {new Date().getFullYear()} EVC Mercato · Mitra Resmi KKI Group
      </footer>
    </>
  )
}
