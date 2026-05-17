import type { Metadata } from 'next'
import Script from 'next/script'
import Image from 'next/image'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import { appendRef } from '@/lib/marketing/ref'
import AffiliateRefSetter from '@/components/marketing/AffiliateRefSetter'
import content from '@/content/lp/natesh-period-comfort'

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    images: content.meta.og_image ? [content.meta.og_image] : [],
    url: 'https://evcmercato.com/lp/natesh-period-comfort',
  },
}

// ── Constants ─────────────────────────────────────────────────────────────────
const WA_ADMIN =
  'https://wa.me/6285820852908?text=Halo%20Admin%20EVC%2C%20saya%20ingin%20tanya%20tentang%20Natesh%20Period%20Comfort'
const SHOP_NATESH = 'https://shop.evcmercato.com/katalog?category=natesh'

// ── Static data ───────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    icon: '💧',
    title: 'Area kewanitaan terasa lembap',
    desc: 'Kelembapan berlebihan membuat kamu tidak nyaman, terutama saat aktivitas padat menjelang menstruasi.',
  },
  {
    icon: '🌸',
    title: 'Kurang fresh saat aktivitas padat',
    desc: 'Saat banyak bergerak, rasa tidak fresh bisa mengganggu fokus dan kepercayaan diri.',
  },
  {
    icon: '😟',
    title: 'Khawatir bau tidak nyaman',
    desc: 'Kekhawatiran ini wajar — Natesh hadir untuk membantu kamu lebih tenang menjalani hari.',
  },
  {
    icon: '🗓️',
    title: 'Ingin tetap bersih menjelang menstruasi',
    desc: 'Masa-masa sebelum menstruasi butuh perlindungan ekstra agar kamu tetap merasa clean.',
  },
  {
    icon: '✨',
    title: 'Butuh pantyliner yang nyaman dipakai rutin',
    desc: 'Pantyliner yang tepat seharusnya bisa jadi bagian comfort routine harian tanpa rasa terganggu.',
  },
]

const NATESH_BENEFITS = [
  {
    icon: '🌿',
    title: 'Membantu Tetap Fresh',
    desc: 'Membantu area kewanitaan terasa lebih fresh sepanjang hari.',
  },
  {
    icon: '💧',
    title: 'Mengurangi Rasa Lembap',
    desc: 'Membantu mengurangi rasa lembap agar kamu lebih nyaman beraktivitas.',
  },
  {
    icon: '🔄',
    title: 'Nyaman untuk Pemakaian Rutin',
    desc: 'Cocok dijadikan bagian dari comfort routine harian.',
  },
  {
    icon: '✨',
    title: 'Support Percaya Diri',
    desc: 'Saat kamu merasa nyaman, kepercayaan diri pun ikut meningkat.',
  },
  {
    icon: '👜',
    title: 'Praktis untuk Wanita Aktif',
    desc: 'Ringan, praktis, dan mudah dibawa ke mana saja.',
  },
]

const USE_CASES = [
  'Beberapa hari sebelum menstruasi',
  'Saat PMS dan aktivitas padat',
  'Saat menstruasi ringan / flek awal',
  'Saat bepergian atau kerja seharian',
  'Saat ingin tetap fresh dan clean',
]

const EVC_TRUST = [
  {
    icon: '✅',
    title: 'Pengalaman sejak 2003',
    desc: 'Lebih dari 20 tahun melayani pelanggan setia di seluruh Indonesia.',
  },
  {
    icon: '⭐',
    title: '30.000+ review positif',
    desc: 'Dipercaya puluhan ribu pembeli dengan pengalaman belanja yang positif.',
  },
  {
    icon: '🏢',
    title: 'Entitas legal terpercaya',
    desc: 'Terdaftar sebagai mitra resmi KKI Group (KKD 12081020).',
  },
  {
    icon: '🚀',
    title: 'Pengiriman cepat',
    desc: 'Pesanan diproses tim EVC agar cepat sampai ke tanganmu.',
  },
  {
    icon: '💬',
    title: 'Support CS dan advisor',
    desc: 'Admin profesional siap membantu sebelum dan setelah order.',
  },
  {
    icon: '🌐',
    title: 'Website resmi EVC Mercato',
    desc: 'Beli langsung di shop.evcmercato.com — aman dan resmi.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function NateshPeriodComfortPage({
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

  const shopLink = appendRef(
    appendUTM(
      `${SHOP_NATESH}&utm_campaign=natesh_period_comfort`,
      utm
    ),
    ref
  )
  const waLink = appendRef(
    appendUTM(
      `${WA_ADMIN}&utm_campaign=natesh_period_comfort`,
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
      <AffiliateRefSetter refCode={ref} />

      {/* ── NAVBAR ── */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-pink-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">Natesh</p>
          <p className="text-xs text-gray-500">Sanitary Pads &amp; Pantyliner</p>
        </div>
        <a
          href={shopLink}
          className="flex items-center justify-center w-11 h-11 rounded-full overflow-hidden border-2 border-[#F9E4E8] hover:border-[#D4456B] transition-colors flex-shrink-0"
          aria-label="EVC Mercato"
        >
          <Image
            src="/logo-evcmercato.jpg"
            alt="EVC Mercato"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </a>
      </header>

      <main style={{
        backgroundImage: "url('/assets/natesh-bg-floral-wave.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* ── SECTION 1: HERO ── */}
        <section className="relative overflow-hidden bg-[#FDF8F5]/90">
          <div className="relative">
            <Image
              src="/assets/natesh-hero-woman-bedroom.jpg"
              alt="Wanita nyaman bersama Natesh"
              width={600}
              height={620}
              className="w-full object-cover"
              style={{ aspectRatio: '1/1.1' }}
              priority
            />

            {/* TOP-LEFT overlay: badge + headline (2 baris) */}
            <div className="absolute top-4 left-3 w-[58%]">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-pink-600 text-[10px] font-semibold px-3 py-1.5 rounded-full mb-3">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="#D4456B" opacity="0.3"/>
                  <path d="M12 4c0 0-4 3-4 7s4 9 4 9 4-5 4-9-4-7-4-7z" fill="#D4456B"/>
                </svg>
                Perawatan Diri • Setiap Hari
              </div>
              {/* Headline 2 baris, lebih besar */}
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[2rem] leading-tight text-gray-900 whitespace-nowrap">
                Nyaman di Setiap
              </h1>
              <h1 className="font-[family-name:var(--font-dm-serif)] text-[2rem] leading-tight text-[#D4456B] mb-4">
                Siklusmu.
              </h1>
              {/* Subheadline — diberi jarak dari headline, tidak menyentuh wajah model */}
              <p className="text-gray-700 text-[11px] leading-relaxed pr-2 mt-1">
                {content.hero.subheadline}
              </p>
            </div>

            {/* Trust badges — bottom of image, dalam gambar, dengan headline + subheadline */}
            <div className="absolute bottom-2 left-2 right-2 grid grid-cols-3 gap-1.5">
              {[
                {
                  headline: 'Lembut & Nyaman',
                  sub: 'Untuk setiap hari',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mx-auto mb-0.5">
                      <path d="M17 8C8 10 5.9 16.17 3.82 19.31C3.82 19.31 3 22 6 21C9 20 11 17 14 15C17 13 19 11 19 11L17 8Z" fill="#D4456B"/>
                      <path d="M7 21C10 19 14 16 18 10" stroke="#D4456B" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )
                },
                {
                  headline: 'Terpercaya',
                  sub: 'Kualitas pilihan',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mx-auto mb-0.5">
                      <path d="M20 6L9 17L4 12" stroke="#D4456B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                },
                {
                  headline: 'Dukung Diri',
                  sub: 'Ritual penuh cinta',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mx-auto mb-0.5">
                      <path d="M12 21C12 21 4 14 4 8.5C4 5.42 6.42 3 9.5 3C11.07 3 12 4 12 4C12 4 12.93 3 14.5 3C17.58 3 20 5.42 20 8.5C20 14 12 21 12 21Z" fill="#D4456B" fillOpacity="0.2" stroke="#D4456B" strokeWidth="1.5"/>
                    </svg>
                  )
                },
              ].map((t) => (
                <div key={t.headline} className="bg-white/88 backdrop-blur-sm rounded-xl py-2 px-1.5 text-center border border-white/70 shadow-sm">
                  {t.icon}
                  <p className="text-[9.5px] font-bold text-gray-800 leading-tight">{t.headline}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">{t.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA button below image */}
          <div className="px-4 py-5 max-w-lg mx-auto">
            <a
              href={shopLink}
              className="block w-full text-center bg-[#D4456B] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#B93A5B] transition-colors"
            >
              Temukan Rangkaian Lengkap →
            </a>
          </div>
        </section>

        {/* ── SECTION 2: PROBLEM ── */}
        <section className="px-4 py-12 bg-[#FDF8F5]/85">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-2 leading-tight">
              Saat PMS, Tubuh Bisa Terasa Lebih Sensitif.
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Area kewanitaan pun ikut membutuhkan perhatian lebih. Kamu tidak sendirian merasakannya.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {PAIN_POINTS.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-pink-100"
                >
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">{p.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wave divider: problem → solution */}
        <div className="overflow-hidden -mb-1 bg-white" aria-hidden="true">
        </div>

        {/* ── SECTION 3: SOLUTION ── */}
        <section className="px-4 py-12 bg-white/90">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-3 leading-tight">
              Natesh Jadi Support Nyaman di Hari-Hari Sensitifmu.
            </h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Hari-hari menjelang menstruasi memang bisa terasa lebih berat — tubuh berubah, mood naik
              turun, dan area kewanitaan butuh perhatian ekstra. Natesh hadir bukan untuk mengubah
              semua itu, tapi untuk membantu kamu merasa lebih nyaman melewatinya.
            </p>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Dengan Natesh Pantyliner, area kewanitaan bisa terjaga lebih fresh dan kering, sehingga
              aktivitas tetap bisa berjalan tanpa rasa terganggu.
            </p>
            {/* Highlight box */}
            <div className="bg-[#F9E4E8] border border-pink-200 rounded-2xl p-5">
              <p className="text-sm text-gray-800 font-semibold leading-relaxed text-center">
                💡 &ldquo;Bukan untuk mengobati PMS, tapi membantu kamu merasa lebih nyaman menghadapi hari-hari sensitif.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* Wave divider: solution → why */}
        <div className="overflow-hidden -mb-1 bg-[#FDF8F5]" aria-hidden="true">
        </div>

        {/* ── SECTION 4: WHY NATESH ── */}
        <section className="px-4 py-12 bg-[#FDF8F5]/85">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-6 leading-tight">
              Kenapa Harus Pakai Natesh?
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {NATESH_BENEFITS.map((b, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-pink-100">
                  <span className="text-2xl block mb-2">{b.icon}</span>
                  <p className="font-semibold text-xs text-gray-900 mb-1 leading-snug">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
            {/* Packshot */}
            <div className="rounded-2xl overflow-hidden mb-5">
              <Image
                src="/assets/natesh-packshot-4variants.jpg"
                alt="Natesh Pantyliner — 4 varian untuk kebutuhan kamu"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
            <a
              href={shopLink}
              className="block w-full text-center bg-[#D4456B] text-white py-4 rounded-2xl font-bold hover:bg-[#B93A5B] transition-colors"
            >
              Dapatkan Natesh Sekarang →
            </a>
          </div>
        </section>

        {/* Wave divider: why → routine */}
        <div className="overflow-hidden -mb-1 bg-white" aria-hidden="true">
        </div>

        {/* ── SECTION 5: ROUTINE ── */}
        <section className="px-4 py-12 bg-white/90">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-5 leading-tight">
              Kapan Sebaiknya Pakai Natesh?
            </h2>
            {/* Flatlay image */}
            <div className="rounded-3xl overflow-hidden mb-6">
              <Image
                src="/assets/natesh-lifestyle-flatlay.jpg"
                alt="Natesh period comfort routine — flatlay gaya hidup"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Use case pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {USE_CASES.map((item, i) => (
                <span
                  key={i}
                  className="bg-[#F9E4E8] text-[#D4456B] border border-pink-200 text-sm font-medium px-4 py-2 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 italic text-center leading-relaxed">
              Mulai biasakan comfort routine sebelum menstruasi datang.
            </p>
          </div>
        </section>

        {/* Wave divider: routine → trust */}
        <div className="overflow-hidden -mb-1 bg-[#F9E4E8]" aria-hidden="true">
        </div>

        {/* ── SECTION 6: TRUST ── */}
        <section className="px-4 py-12 bg-[#F9E4E8]/85">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-6 leading-tight">
              Belanja Natesh Lebih Aman di EVC Mercato.
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {EVC_TRUST.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-pink-100">
                  <span className="text-xl block mb-2">{t.icon}</span>
                  <p className="font-semibold text-xs text-gray-900 mb-1 leading-snug">{t.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wave divider: trust → faq */}
        <div className="overflow-hidden -mb-1 bg-white" aria-hidden="true">
        </div>

        {/* ── SECTION 7: FAQ ── */}
        <section className="px-4 py-12 bg-white/90">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-6">
              Pertanyaan Umum
            </h2>
            <div className="space-y-3">
              {content.faq?.map((f, i) => (
                <details
                  key={i}
                  className="bg-[#FDF8F5] rounded-2xl border border-pink-100 overflow-hidden"
                >
                  <summary className="cursor-pointer px-5 py-4 font-semibold text-sm text-gray-900 flex justify-between items-center list-none">
                    {f.question}
                    <span className="text-pink-400 ml-2 flex-shrink-0">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{f.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 8: FINAL CTA ── */}
        <section className="px-4 py-14 bg-[#D4456B]">
          <div className="max-w-lg mx-auto text-center text-white">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl md:text-3xl font-bold mb-3 leading-tight">
              Mulai Period Comfort Routine Kamu Hari Ini.
            </h2>
            <p className="text-white/80 text-sm mb-7 leading-relaxed">
              Jadikan Natesh bagian dari rutinitas harianmu — agar hari-hari sensitif bisa tetap
              nyaman dan penuh percaya diri.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={shopLink}
                className="bg-white text-[#D4456B] py-4 rounded-2xl font-bold hover:bg-pink-50 transition-colors"
              >
                🛍️ Beli Natesh Sekarang
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white/60 text-white py-3.5 rounded-2xl font-semibold hover:border-white transition-colors"
              >
                💬 Konsultasi via WhatsApp
              </a>
            </div>
            <p className="text-white/60 text-xs mt-5">
              Official store EVC Mercato • Praktis • Aman • Siap dikirim
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER MINIMAL ── */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <p className="font-bold text-[#D4456B] mb-1">EVC Mercato</p>
        <p className="text-xs text-gray-400">
          Distributor Resmi KKI Group — Online Channel #1 KKI Group
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          <a
            href={appendRef('https://shop.evcmercato.com/katalog?category=natesh', ref)}
            className="hover:text-white py-3 inline-block"
          >
            Katalog Natesh
          </a>
          <a
            href={waLink}
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
