import type { Metadata } from 'next'
import Script from 'next/script'
import Image from 'next/image'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import { appendRef } from '@/lib/marketing/ref'
import AffiliateRefSetter from '@/components/marketing/AffiliateRefSetter'
import content from '@/content/lp/pearl-nourish-cream'

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    images: content.meta.og_image ? [content.meta.og_image] : [],
    url: 'https://evcmercato.com/lp/pearl-nourish-cream',
  },
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SHOP_LINK_BASE =
  'https://shop.evcmercato.com/katalog/pearl-cream-kristine-ko-kool-made-in-taiwan'
const WA_LINK =
  'https://wa.me/6285820852908?text=Halo%20Admin%20EVC%2C%20saya%20ingin%20bertanya%20tentang%20Pearl%20Nourish%20Cream'

// ── Static data ───────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: '/assets/pearl-icon-moisturizing.png',
    title: 'Moisturizing',
    desc: 'Membantu menjaga kelembapan kulit sepanjang hari.',
  },
  {
    icon: '/assets/pearl-icon-brightening.png',
    title: 'Brightening Look',
    desc: 'Membantu tampilan kulit terlihat lebih cerah alami.',
  },
  {
    icon: '/assets/pearl-icon-soft-finish.png',
    title: 'Soft Matte Natural Finish',
    desc: 'Memberi rasa halus dan tidak berat di kulit.',
  },
  {
    icon: '/assets/pearl-icon-spf15.png',
    title: 'UV Protection SPF15',
    desc: 'Membantu melindungi kulit dari paparan sinar UV harian.',
  },
]

const INGREDIENTS = [
  {
    img: '/assets/pearl-ingredient-pearl-powder.png',
    name: 'Pearl Powder',
    desc: 'Memberi kesan kulit tampak lebih cerah dan bercahaya.',
  },
  {
    img: '/assets/pearl-ingredient-olive-oil.png',
    name: 'Olive Oil',
    desc: 'Membantu menutrisi dan menjaga kelembapan kulit.',
  },
  {
    img: '/assets/pearl-ingredient-bees-wax.png',
    name: 'Bees Wax',
    desc: 'Membantu memberi lapisan perlindungan dan tekstur lembut.',
  },
  {
    img: '/assets/pearl-ingredient-rice-starch.png',
    name: 'Rice Starch',
    desc: 'Membantu hasil akhir halus, natural matte, dan nyaman.',
  },
]

const HOW_TO_USE = [
  'Bersihkan wajah terlebih dahulu.',
  'Ambil krim secukupnya.',
  'Ratakan tipis pada wajah dan leher.',
  'Gunakan pagi hari sebelum aktivitas, ulangi sesuai kebutuhan.',
]

const WHO_FOR = [
  'Ingin wajah terasa lembap dan halus',
  'Suka hasil akhir natural, bukan makeup tebal',
  'Butuh krim harian dengan SPF ringan',
  'Mencari produk yang sudah lama dipercaya',
  'Ingin beli dari channel resmi dan jelas',
]

const PAIN_POINTS = [
  { icon: '💧', title: 'Kulit kering', desc: 'Kulit terasa kencang dan kering setelah cuci muka.' },
  { icon: '✨', title: 'Wajah kusam', desc: 'Wajah terlihat kurang bercahaya dan terasa lelah.' },
  {
    icon: '🌿',
    title: 'Ingin tampilan natural',
    desc: 'Lebih suka tampilan natural tanpa foundation tebal.',
  },
  {
    icon: '⏱️',
    title: 'Butuh krim praktis',
    desc: 'Skincare harian yang mudah dipakai tanpa banyak langkah.',
  },
  {
    icon: '🔍',
    title: 'Cari produk terpercaya',
    desc: 'Ingin krim yang sudah terbukti aman dan dikenal lama.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function PearlNourishCreamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const utm = extractUTM(new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, v])))
  const ref = sp['ref'] ?? null

  const shopLink = appendRef(
    appendUTM(
      `${SHOP_LINK_BASE}?utm_source=meta&utm_medium=paid_social&utm_campaign=pearl_nourish_cream&utm_content=lp_cta`,
      utm
    ),
    ref
  )

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
                  content_name: 'Pearl Nourish Cream',
                  content_category: 'Skincare',
                  content_ids: ['pearl-nourish-cream'],
                  content_type: 'product'
                });
              } else {
                setTimeout(fireVC, 300);
              }
            }
            setTimeout(fireVC, 500);
          })();
        `}</Script>
      )}
      <AffiliateRefSetter refCode={ref} />

      {/* ── NAVBAR ── */}
      <header className="bg-[#FDFAF4]/95 backdrop-blur-sm sticky top-0 z-50 border-b border-[#F5E6C8] px-4 py-3 flex items-center justify-between">
        <a href="/katalog" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#F5E6C8] flex-shrink-0">
            <Image
              src="/logo-evcmercato.jpg"
              alt="EVC Mercato"
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
        </a>
        <div className="flex-1 px-3">
          <p className="font-semibold text-[#2C1810] text-sm leading-tight">Pearl Nourish Cream</p>
          <p className="text-xs text-[#7A6752]">Kristine Ko-Kool</p>
        </div>
        <a
          href={shopLink}
          className="flex-shrink-0 bg-[#9A6B1F] text-white text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-[#7A5518] transition-colors min-h-[44px] flex items-center"
        >
          Beli Sekarang
        </a>
      </header>

      <main
        style={{
          backgroundImage: "url('/assets/pearl-section-bg-texture.png')",
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* ── SECTION 1: HERO ── */}
        <section className="relative overflow-hidden bg-[#FDFAF4]/90">
          <div className="relative">
            <Image
              src="/assets/pearl-hero-model.png"
              alt="Pearl Nourish Cream — Krim Legendaris Sejak 1999"
              width={600}
              height={750}
              className="w-full object-cover"
              priority
            />
            {/* Kristine Ko-Kool logo — TOP RIGHT */}
            <div className="absolute top-3 right-3 w-[38%]">
              <Image
                src="/assets/kristine-ko-kool-logo.png"
                alt="Kristine Ko-Kool"
                width={120}
                height={120}
                className="w-full h-auto mix-blend-multiply opacity-90"
              />
            </div>

            {/* Headline overlay — RIGHT side (model di kiri) */}
            <div className="absolute top-[30%] right-3 w-[50%] text-right">
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[1.65rem] leading-snug text-[#2C1810]">
                Krim Legendaris
                <br />
                <span className="text-[#9A6B1F]">Cantik Alami</span>
                <br />
                Sejak 1999.
              </h1>
            </div>

            {/* Kemasan 20gr — solo, diperbesar */}
            <div className="absolute bottom-2 right-1" style={{width: '195px'}}>
              <Image
                src="/assets/pearl-packshot-20gr.png"
                alt="Pearl Nourish Cream 20gr"
                width={195}
                height={195}
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
          {/* CTA below hero image */}
          <div className="px-4 py-5 max-w-lg mx-auto">
            <a
              href={shopLink}
              className="block w-full text-center bg-[#9A6B1F] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#7A5518] transition-colors"
            >
              Beli Sekarang →
            </a>
          </div>
        </section>

        {/* ── SECTION 2: TRUST OPENING ── */}
        <section className="px-4 py-10 bg-[#FDFAF4]/88">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-3 leading-tight">
              Best Seller Sejak 1999, Kini Hadir di EVC Mercato
            </h2>
            <p className="text-sm text-[#7A6752] mb-7 leading-relaxed">
              Pearl Nourish Cream adalah krim legendaris yang telah dipercaya selama puluhan tahun.
              Kini kamu bisa mendapatkannya dengan mudah melalui channel resmi EVC Mercato —
              terpercaya, aman, dan cepat sampai.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '📅', title: 'Sejak 1999', sub: 'Krim legendaris terpercaya' },
                { icon: '🏛️', title: 'BPOM Terdaftar', sub: 'NA47130300750' },
                { icon: '🏪', title: 'Official Channel', sub: 'Distributor resmi EVC' },
                { icon: '🚚', title: 'Pengiriman Cepat', sub: 'Siap kirim ke seluruh Indonesia' },
              ].map((t) => (
                <div
                  key={t.title}
                  className="bg-white rounded-2xl p-4 border border-[#F5E6C8] text-left"
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <p className="font-semibold text-sm text-[#2C1810] leading-tight">{t.title}</p>
                  <p className="text-xs text-[#7A6752] mt-0.5">{t.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: PROBLEM ── */}
        <section className="px-4 py-10 bg-[#FBF7EE]/88">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-2 leading-tight">
              Ingin Wajah Terlihat Lebih Segar Tanpa Skincare yang Ribet?
            </h2>
            <p className="text-sm text-[#7A6752] mb-6 leading-relaxed">
              Banyak yang merasakan hal ini. Kamu tidak perlu rutinitas panjang untuk tampil lebih
              segar setiap hari.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {PAIN_POINTS.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-[#F5E6C8]"
                >
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-[#2C1810] mb-1">{p.title}</p>
                    <p className="text-sm text-[#7A6752] leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: BENEFITS ── */}
        <section
          className="px-4 py-12"
          style={{
            backgroundImage: "url('/assets/pearl-section-bg-texture.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-6 leading-tight text-center">
              4 Manfaat Harian
              <br />
              Pearl Nourish Cream
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="bg-[#FDFAF4]/90 rounded-2xl p-4 border border-[#F5E6C8] text-center"
                >
                  <div className="w-14 h-14 mx-auto mb-3 relative">
                    <Image
                      src={b.icon}
                      alt={b.title}
                      width={56}
                      height={56}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="font-semibold text-xs text-[#2C1810] mb-1 leading-snug">
                    {b.title}
                  </p>
                  <p className="text-xs text-[#7A6752] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
            <a
              href={shopLink}
              className="block w-full text-center bg-[#9A6B1F] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#7A5518] transition-colors"
            >
              Beli Sekarang →
            </a>
          </div>
        </section>

        {/* ── SECTION 5: INGREDIENTS ── */}
        <section className="px-4 py-12 bg-[#FDFAF4]/90">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-6 leading-tight text-center">
              Kelembutan dan Cahaya dari Kandungan Pilihan
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {INGREDIENTS.map((ing) => (
                <div key={ing.name} className="bg-white rounded-2xl p-4 border-2 border-[#F5E6C8]">
                  <div className="aspect-square w-full mb-3 relative rounded-2xl overflow-hidden border-2 border-[#F5E6C8]">
                    <Image
                      src={ing.img}
                      alt={ing.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-semibold text-sm text-[#9A6B1F] mb-1 leading-snug">
                    {ing.name}
                  </p>
                  <p className="text-xs text-[#7A6752] leading-relaxed">{ing.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: HOW TO USE ── */}
        <section className="px-4 py-12 bg-[#FBF7EE]/90">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-6 leading-tight">
              Cara Pakai Pearl Nourish Cream
            </h2>
            <div className="space-y-3 mb-5">
              {HOW_TO_USE.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-[#F5E6C8]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#9A6B1F] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-[#2C1810] leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#F5E6C8] rounded-2xl p-4 border border-[#9A6B1F]/20">
              <p className="text-xs text-[#7A6752] leading-relaxed text-center">
                ⚠️ Hindari area mata. Hentikan penggunaan bila terjadi iritasi.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: WHO IS THIS FOR ── */}
        <section className="px-4 py-12 bg-[#FDFAF4]/88">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-6 leading-tight">
              Cocok untuk Kamu yang Ingin Skincare Harian Praktis
            </h2>
            <div className="space-y-3">
              {WHO_FOR.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[#F5E6C8]"
                >
                  <span className="text-[#9A6B1F] font-bold text-lg flex-shrink-0">✓</span>
                  <p className="text-sm text-[#2C1810] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 8: OFFER / PRICING ── */}
        <section className="px-4 py-12 bg-[#FBF7EE]/90">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-6 leading-tight text-center">
              Pearl Nourish Cream Kristine Ko-Kool
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Card 1 — Minipack 5gr */}
              <div className="bg-white rounded-2xl p-4 border border-[#F5E6C8] flex flex-col">
                <div className="bg-[#FBF7EE] rounded-xl p-2 mb-3">
                  <Image
                    src="/assets/pearl-packshot-5gr.png"
                    alt="Minipack 5gr"
                    width={120}
                    height={120}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                </div>
                <p className="font-semibold text-sm text-[#2C1810] mb-3">Minipack 5gr</p>
                <p className="text-xs text-[#7A6752] line-through mb-1">Rp250.000</p>
                <p className="text-xl font-bold text-[#9A6B1F] mb-2">Rp200.000</p>
                <p className="text-[11px] text-[#7A6752] mt-auto">Estimasi 1–2 bulan pemakaian</p>
              </div>
              {/* Card 2 — Kemasan 20gr */}
              <div className="bg-white rounded-2xl p-4 border-2 border-[#9A6B1F] flex flex-col relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9A6B1F] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Best Value
                </span>
                <div className="bg-[#FBF7EE] rounded-xl p-2 mb-3 mt-1">
                  <Image
                    src="/assets/pearl-packshot-20gr.png"
                    alt="Kemasan 20gr"
                    width={120}
                    height={120}
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                </div>
                <p className="font-semibold text-sm text-[#2C1810] mb-3">Kemasan 20gr</p>
                <p className="text-xs text-[#7A6752] line-through mb-1">Rp550.000</p>
                <p className="text-xl font-bold text-[#9A6B1F] mb-2">Rp480.000</p>
                <p className="text-[11px] text-[#7A6752] mt-auto">Estimasi 6–8 bulan pemakaian</p>
              </div>
            </div>
            <a
              href={shopLink}
              className="block w-full text-center bg-[#9A6B1F] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#7A5518] transition-colors mb-5"
            >
              Beli Sekarang →
            </a>
            {/* Trust row */}
            <div className="flex justify-around gap-2">
              {['🔒 Pembayaran Aman', '🚚 Pengiriman Cepat', '✓ BPOM Terdaftar'].map((t) => (
                <span key={t} className="text-[11px] text-[#7A6752] text-center">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 9: FAQ ── */}
        <section className="px-4 py-12 bg-[#FDFAF4]/88">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-[#2C1810] mb-6">
              Pertanyaan Umum
            </h2>
            <div className="space-y-3">
              {content.faq?.map((f, i) => (
                <details
                  key={i}
                  className="bg-white rounded-2xl border border-[#F5E6C8] overflow-hidden"
                >
                  <summary className="cursor-pointer px-5 py-4 font-semibold text-sm text-[#2C1810] flex justify-between items-center list-none">
                    {f.question}
                    <span className="text-[#9A6B1F] ml-2 flex-shrink-0">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[#7A6752] leading-relaxed">{f.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="px-4 py-14 bg-[#9A6B1F]">
          <div className="max-w-lg mx-auto text-center text-white">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl font-bold mb-3 leading-tight">
              Mulai Perawatan Kulitmu dengan Pearl Nourish Cream
            </h2>
            <p className="text-white/80 text-sm mb-7 leading-relaxed">
              Krim legendaris sejak 1999 — kini bisa kamu dapatkan langsung dari channel resmi EVC
              Mercato.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={shopLink}
                className="bg-white text-[#9A6B1F] py-4 rounded-2xl font-bold hover:bg-[#F5E6C8] transition-colors"
              >
                🛍️ Beli Sekarang
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white/60 text-white py-3.5 rounded-2xl font-semibold hover:border-white transition-colors"
              >
                💬 Bantuan Admin EVC
              </a>
            </div>
            <p className="text-white/60 text-xs mt-5">
              Official store EVC Mercato • BPOM NA47130300750 • Aman • Siap dikirim
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER MINIMAL ── */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <p className="font-bold text-[#F5E6C8] mb-1">EVC Mercato</p>
        <p className="text-xs text-gray-400">
          Distributor Resmi KKI Group — Online Channel #1 KKI Group
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          <a href={appendRef('/katalog', ref)} className="hover:text-white py-3 inline-block">
            Katalog
          </a>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white py-3 inline-block"
          >
            Chat Admin
          </a>
          <a
            href={appendRef('https://shop.evcmercato.com/privacy-policy', ref)}
            className="hover:text-white py-3 inline-block"
          >
            Kebijakan Privasi
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          © 2026 EVC Mercato. Mitra Usaha Resmi KKI Group (KKD 12081020).
        </p>
      </footer>
    </>
  )
}
