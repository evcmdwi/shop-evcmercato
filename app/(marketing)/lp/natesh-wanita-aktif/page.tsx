import type { Metadata } from 'next'
import Script from 'next/script'
import Image from 'next/image'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import content from '@/content/lp/natesh-wanita-aktif'

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    images: content.meta.og_image ? [content.meta.og_image] : [],
    url: 'https://evcmercato.com/lp/natesh-wanita-aktif',
  },
}

const WA_ADMIN =
  'https://wa.me/6285820852908?text=Halo%20Admin%20EVC%2C%20saya%20ingin%20tanya%20tentang%20Natesh'
const SHOP_NATESH = 'https://shop.evcmercato.com/katalog?category=natesh'

// PAIN POINTS
const PAIN_POINTS = [
  { icon: '🌡️', title: 'Mudah Terasa Gerah', desc: 'Saat dipakai lama, area terasa tidak fresh.' },
  {
    icon: '😰',
    title: 'Khawatir Bocor atau Bergeser',
    desc: 'Aktivitas padat membuat kamu butuh rasa aman lebih, terutama saat banyak bergerak.',
  },
  {
    icon: '😔',
    title: 'Kurang Percaya Diri',
    desc: 'Saat tidak nyaman, mood dan fokus bisa ikut terganggu.',
  },
  {
    icon: '⚡',
    title: 'Tidak Praktis untuk Hari Sibuk',
    desc: 'Wanita aktif butuh feminine care yang terasa nyaman untuk rutinitas kerja, kampus, perjalanan, dan aktivitas rumah.',
  },
]

// KENAPA NATESH
const NATESH_BENEFITS = [
  {
    icon: '🌸',
    title: 'Nyaman untuk Aktivitas Harian',
    desc: 'Mendukung rutinitas wanita aktif, dari kerja, kuliah, perjalanan, sampai kegiatan keluarga.',
  },
  {
    icon: '🛡️',
    title: 'Lebih Tenang Saat Banyak Bergerak',
    desc: 'Desain dengan sayap (wings) dan side guard membantu pembalut tetap pada posisinya saat bergerak.',
  },
  {
    icon: '💧',
    title: 'Permukaan Terasa Lebih Kering',
    desc: 'Membantu menyerap cairan dan menjaga rasa nyaman saat dipakai sepanjang hari.',
  },
  {
    icon: '✨',
    title: 'Premium Feminine Care Feel',
    desc: 'Pilihan yang terasa lebih thoughtful untuk kebutuhan personal care wanita modern.',
  },
  {
    icon: '💪',
    title: 'Bantu Kamu Lebih Percaya Diri',
    desc: 'Saat merasa nyaman, kamu bisa lebih fokus menjalani hari.',
  },
  {
    icon: '📦',
    title: 'Praktis untuk Rutinitas Padat',
    desc: 'Mudah dijadikan stok personal care bulanan agar tidak panik saat dibutuhkan.',
  },
]

// USE CASES
const USE_CASES = [
  { icon: '💼', text: 'Hari kerja dan meeting panjang' },
  { icon: '📚', text: 'Kuliah / aktivitas kampus' },
  { icon: '🚗', text: 'Perjalanan keluar rumah' },
  { icon: '🏠', text: 'Mengurus anak dan rumah' },
  { icon: '🚶', text: 'Aktivitas ringan / banyak bergerak' },
  { icon: '📅', text: 'Hari pertama menstruasi saat butuh rasa lebih tenang' },
]

// KENAPA EVC
const EVC_TRUST = [
  {
    icon: '⚡',
    title: 'Pengiriman Cepat',
    desc: 'Pesanan diproses tim EVC agar bisa segera dikirim ke alamat kamu.',
  },
  {
    icon: '📦',
    title: 'Discreet Package',
    desc: 'Packaging dibuat rapi dan tidak mencolok, cocok untuk produk personal care.',
  },
  {
    icon: '💬',
    title: 'Admin Profesional',
    desc: 'Bisa tanya stok, cara order, pilihan pengiriman, atau info produk sebelum checkout.',
  },
  {
    icon: '🔒',
    title: 'Belanja Lebih Tenang',
    desc: 'EVC membantu proses pembelian terasa jelas, aman, dan tidak membingungkan.',
  },
  {
    icon: '🤝',
    title: 'Support Setelah Order',
    desc: 'Jika ada pertanyaan terkait pesanan, customer bisa dibantu oleh admin EVC.',
  },
]

export default async function NateshPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const utm = extractUTM(
    new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, v]))
  )

  const shopLink = appendUTM(SHOP_NATESH, utm)
  const waLink = appendUTM(WA_ADMIN, utm)

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {initPixelScript(pixelId)}
        </Script>
      )}

      {/* NAVBAR MINIMAL */}
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-pink-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">Natesh</span>
          <span className="text-xs bg-[#F9E4E8] text-pink-600 px-2 py-0.5 rounded-full font-medium">
            by EVC Mercato
          </span>
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm border border-pink-300 text-pink-600 px-3 py-1.5 rounded-xl font-semibold hover:bg-[#F9E4E8] transition-colors"
        >
          Chat Admin
        </a>
      </header>

      <main className="bg-[#FDF8F5]">
        {/* SECTION 1 — HERO */}
        <section className="px-4 pt-8 pb-10 bg-white">
          <div className="max-w-lg mx-auto">
            <div className="inline-block bg-[#F9E4E8] text-pink-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              🌸 Feminine Care Premium
            </div>
            <h1 className="font-[family-name:var(--font-dm-serif)] text-3xl text-gray-900 leading-tight mb-3">
              {content.hero.headline}
            </h1>
            <p className="text-gray-500 text-base mb-6 leading-relaxed">
              {content.hero.subheadline}
            </p>
            {/* Hero image */}
            <div className="rounded-3xl overflow-hidden bg-[#F9E4E8] mb-5">
              <Image
                src="/assets/natesh-hero-wanita-aktif.jpg"
                alt="Natesh untuk wanita aktif"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            {/* CTA di bawah gambar, horizontal */}
            <div className="flex gap-3">
              <a
                href={shopLink}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D4456B] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#B93A5B] transition-colors"
              >
                🛍️ {content.hero.cta_primary.text}
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-[#D4456B] text-[#D4456B] py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#F9E4E8] transition-colors"
              >
                💬 {content.hero.cta_secondary?.text}
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 2 — PAIN POINT */}
        <section className="px-4 py-12 bg-[#FDF8F5]">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-3 leading-tight">
              Kadang Masalahnya Bukan Aktivitasmu
            </h2>
            <p className="text-sm text-gray-500 mb-2 font-medium">
              — Tapi Pembalut yang Kurang Mendukung Harimu
            </p>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Saat aktivitas lagi padat, pembalut yang kurang nyaman bisa bikin fokus pecah. Rasanya
              mudah gerah, khawatir bergeser, takut tembus, atau jadi kurang percaya diri saat harus
              meeting, jalan jauh, kuliah, kerja, atau mengurus banyak hal sekaligus.
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
                    <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-5 italic leading-relaxed text-center">
              Untuk wanita aktif, feminine care yang dipilih harus bisa mengikuti ritme harian —
              bukan membuat kamu terus merasa terganggu.
            </p>
          </div>
        </section>

        {/* SECTION 3 — KENAPA NATESH */}
        <section className="px-4 py-12 bg-white">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-3">
              Kenapa Wanita Aktif Memilih Natesh?
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Natesh diposisikan sebagai feminine care premium untuk wanita yang ingin merasa lebih
              nyaman dan percaya diri sepanjang hari.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {NATESH_BENEFITS.map((b, i) => (
                <div
                  key={i}
                  className="bg-[#FDF8F5] rounded-2xl p-4 border border-pink-100"
                >
                  <span className="text-2xl block mb-2">{b.icon}</span>
                  <p className="font-semibold text-xs text-gray-900 mb-1 leading-snug">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
            <a
              href={shopLink}
              className="block w-full text-center bg-[#D4456B] text-white py-4 rounded-2xl font-bold hover:bg-[#B93A5B] transition-colors"
            >
              Upgrade feminine care kamu hari ini →
            </a>
          </div>
        </section>

        {/* SECTION 4 — USE CASE */}
        <section className="px-4 py-12 bg-[#F9E4E8]">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-3">
              Cocok untuk Hari-Hari Saat Kamu Harus Tetap Jalan
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {USE_CASES.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2.5"
                >
                  <span className="text-base">{u.icon}</span>
                  <span className="text-xs text-gray-700 font-medium leading-snug">{u.text}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tidak semua hari bisa diperlambat hanya karena sedang menstruasi. Dengan pilihan
              feminine care yang tepat, kamu bisa merasa lebih siap menjalani aktivitas tanpa terlalu
              banyak rasa khawatir.
            </p>
          </div>
        </section>

        {/* SECTION 5 — KENAPA EVC */}
        <section className="px-4 py-12 bg-white">
          <div className="max-w-lg mx-auto">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl text-gray-900 mb-3">
              Beli Natesh di EVC: Cepat, Profesional, dan Discreet
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Untuk produk personal seperti feminine care, cara belinya juga harus nyaman. Di EVC
              Mercato, kamu bisa beli Natesh dengan proses yang rapi, dibantu admin profesional, dan
              dikirim dengan packaging yang discreet.
            </p>
            <div className="space-y-3 mb-6">
              {EVC_TRUST.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-[#FDF8F5] rounded-2xl p-4 border border-pink-100"
                >
                  <span className="text-xl flex-shrink-0">{t.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">{t.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={shopLink}
              className="block w-full text-center bg-[#D4456B] text-white py-4 rounded-2xl font-bold hover:bg-[#B93A5B] transition-colors mb-3"
            >
              🛍️ Beli Aman Lewat EVC
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center border-2 border-[#D4456B] text-[#D4456B] py-3.5 rounded-2xl font-semibold hover:bg-[#F9E4E8] transition-colors"
            >
              💬 Chat Admin Sekarang
            </a>
          </div>
        </section>

        {/* SECTION 6 — SOCIAL PROOF (Trust Statement) */}
        <section className="px-4 py-10 bg-[#F9E4E8]">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-xl text-gray-900 mb-3">
              Dipilih oleh Wanita yang Ingin Lebih Nyaman Saat Beraktivitas
            </h2>
            <div className="bg-white/80 rounded-2xl p-5 border border-pink-100">
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                Belanja Produk Personal Care Lebih Nyaman di EVC
              </p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Dengan admin profesional, pengiriman cepat, dan packaging discreet, EVC membantu
                proses belanja produk personal care terasa lebih aman dan praktis.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7 — FAQ */}
        <section className="px-4 py-12 bg-white">
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

        {/* FINAL CTA SECTION */}
        <section className="px-4 py-14 bg-[#D4456B]">
          <div className="max-w-lg mx-auto text-center text-white">
            <h2 className="font-[family-name:var(--font-dm-serif)] text-2xl md:text-3xl font-bold mb-3 leading-tight">
              Siap Merasa Lebih Nyaman Saat Beraktivitas?
            </h2>
            <p className="text-white/80 text-sm mb-7 leading-relaxed">
              Pilih Natesh untuk rutinitas feminine care yang lebih thoughtful, lalu beli dengan
              proses yang cepat, profesional, dan discreet melalui EVC Mercato.
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
                💬 Chat Admin EVC
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER MINIMAL */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <p className="font-bold text-[#D4456B] mb-1">EVC Mercato</p>
        <p className="text-xs text-gray-400">
          Distributor Resmi KKI Group — Online Channel #1 KKI Group
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          <a
            href="https://shop.evcmercato.com/katalog?category=natesh"
            className="hover:text-white"
          >
            Katalog Natesh
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            Chat Admin
          </a>
          <a href="https://shop.evcmercato.com/privacy-policy" className="hover:text-white">
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
