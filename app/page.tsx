import Script from 'next/script'
import ReturningCustomer from '@/components/home/ReturningCustomer'
import HeroCarousel from '@/components/home/HeroCarousel'
import { getHeroData } from '@/lib/hero-banners'
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { FEATURED_LIMIT, FEATURED_SETTING_KEY, getFeaturedProducts, parseFeaturedIds } from '@/lib/catalog'
import {
  TrustStrip,
  WelcomeCard,
  ComparisonTable,
  FeaturedProducts,
  NeedCards,
  SignupSteps,
  ReviewsSection,
  PaymentShipping,
  WhatsAppCard,
  HomeFooter,
  type HomeReview,
} from '@/components/home/HomeSections'

// Data beranda di-cache 10 menit (urutan produk & ulasan tidak perlu real-time).
const getHomeData = unstable_cache(
  async () => {
    const admin = getSupabaseAdmin()
    const { data: setting } = await admin.from('site_settings').select('value').eq('key', FEATURED_SETTING_KEY).maybeSingle()
    const featured = await getFeaturedProducts(admin, FEATURED_LIMIT, parseFeaturedIds(setting?.value))

    // Ulasan asli saja; tabel belum ada / kosong → section tidak dirender.
    let reviews: HomeReview[] = []
    try {
      const { data, error } = await admin
        .from('product_reviews')
        .select('id, customer_name, customer_location, body, products(name)')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4)
      if (!error && data) {
        reviews = (data as unknown as (Omit<HomeReview, 'product_name'> & { products: { name: string } | null })[])
          .filter((r) => r.body)
          .map((r) => ({ ...r, product_name: r.products?.name ?? null }))
      }
    } catch {
      reviews = []
    }
    return { featured, reviews }
  },
  ['home-data-v1'],
  { revalidate: 600, tags: ['home-data'] }
)

// Banner hero: cache singkat agar jadwal tayang (WITA) berlaku tanpa deploy; disegarkan
// seketika saat admin menyimpan (revalidateTag 'hero-banners').
const getHero = unstable_cache(async () => getHeroData(getSupabaseAdmin()), ['hero-banners-v1'], {
  revalidate: 60,
  tags: ['hero-banners'],
})

export default async function HomePage() {
  const [{ featured, reviews }, hero] = await Promise.all([getHomeData(), getHero()])

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'EVC Mercato',
    url: 'https://shop.evcmercato.com',
    logo: 'https://shop.evcmercato.com/logo-evcmercato.jpg',
    description: 'Distributor resmi produk KKI Group — kesehatan, wellness, kecantikan, feminine care sejak 2003.',
    legalName: 'CV. EVC Nusantara Sukses',
    foundingDate: '2003',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-858-2085-2908',
      email: 'cs@evcmercato.com',
      contactType: 'customer service',
      availableLanguage: 'Indonesian',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '17:00',
      },
    },
    sameAs: ['https://shop.evcmercato.com'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plaza Aminta Lantai 5/504, Jalan Letnan Jendral TB Simatupang Kav 10',
      addressLocality: 'Jakarta Selatan',
      addressRegion: 'DKI Jakarta',
      postalCode: '12310',
      addressCountry: 'ID',
    },
  }

  return (
    <div className="min-h-screen bg-evc-ground font-jakarta text-evc-ink">
      <Script id="org-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <TrustStrip />
      <main className="mx-auto max-w-[1200px] space-y-8 px-4 py-5 md:space-y-12 md:py-8">
        <HeroCarousel
          slides={hero.slides}
          settings={hero.settings}
          fallback={<WelcomeCard />}
        />
        {/* Fase 2: pelanggan login — saldo poin & pesan lagi (dirender di klien, di bawah hero agar hero tidak bergeser). */}
        <ReturningCustomer />
        <ComparisonTable />
        <FeaturedProducts products={featured} />
        <NeedCards />
        <SignupSteps />
        <ReviewsSection reviews={reviews} />
        <PaymentShipping />
        <WhatsAppCard />
      </main>
      <HomeFooter />
    </div>
  )
}
