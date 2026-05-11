import type { Metadata } from 'next'
import Script from 'next/script'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import content from '@/content/lp/evc-resmi'

export const metadata: Metadata = {
  title: content.meta.title,
  description: content.meta.description,
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    images: content.meta.og_image ? [content.meta.og_image] : [],
    url: 'https://evcmercato.com/lp/evc-resmi',
  },
}

const WA_ADMIN = 'https://wa.me/6281386295426?text=Halo%20EVC%20Mercato%2C%20saya%20ingin%20tanya%20tentang%20produk'
const EVIE_LINK = 'https://t.me/evie_evc_bot?start=6285820852908'

const TRUST_CARDS = [
  {
    title: 'Pembayaran Terpercaya',
    copy: 'Checkout lebih tenang dengan alur pembayaran yang jelas.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto mb-3">
        <rect x="4" y="10" width="40" height="28" rx="4" stroke="#7FB300" strokeWidth="2.5" fill="#f8fce8"/>
        <rect x="4" y="18" width="40" height="6" fill="#7FB300" opacity="0.3"/>
        <rect x="10" y="28" width="12" height="3" rx="1.5" fill="#7FB300"/>
        <circle cx="36" cy="29.5" r="4" fill="#7FB300"/>
        <path d="M34 29.5l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Produk Pilihan Resmi',
    copy: 'Produk pilihan tersedia melalui website resmi EVC Mercato.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto mb-3">
        <path d="M8 8h32l-4 20H12L8 8z" stroke="#7FB300" strokeWidth="2.5" fill="#f8fce8"/>
        <circle cx="18" cy="40" r="3" fill="#7FB300"/>
        <circle cx="32" cy="40" r="3" fill="#7FB300"/>
        <path d="M14 16h20M14 22h16" stroke="#7FB300" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <circle cx="38" cy="12" r="8" fill="#7FB300"/>
        <path d="M35 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Pengiriman Cepat',
    copy: 'Pesanan diproses tim EVC dan dikirim ke alamat customer.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto mb-3">
        <path d="M4 20h28v14H4V20z" stroke="#7FB300" strokeWidth="2.5" fill="#f8fce8"/>
        <path d="M32 24h8l4 8v2h-12V24z" stroke="#7FB300" strokeWidth="2.5" fill="#f8fce8"/>
        <circle cx="12" cy="38" r="3" fill="#7FB300"/>
        <circle cx="36" cy="38" r="3" fill="#7FB300"/>
        <path d="M4 26h18" stroke="#7FB300" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M6 14l6-6M10 14l6-6" stroke="#7FB300" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    title: 'Admin & Evie Siap Membantu',
    copy: 'Customer bisa tanya dulu sebelum belanja agar lebih yakin memilih produk.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto mb-3">
        <circle cx="24" cy="16" r="8" stroke="#7FB300" strokeWidth="2.5" fill="#f8fce8"/>
        <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#7FB300" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="38" cy="22" r="7" fill="#7FB300"/>
        <path d="M35 22h6M38 19v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const TESTIMONIALS = [
  { name: 'Rina', city: 'Jakarta Selatan', quote: 'Pesanan saya dibantu admin dari awal. Pilih sameday, barang sampai cepat dan prosesnya terasa aman.', initials: 'R' },
  { name: 'Maya', city: 'Padang', quote: 'Awalnya cuma mau cek info produk, ternyata websitenya enak dibuka dari HP. Admin juga cepat bantu jawab.', initials: 'M' },
  { name: 'Dewi', city: 'Bandung', quote: 'Suka karena bisa tanya dulu sebelum belanja. Jadi lebih yakin pilih produk yang sesuai kebutuhan.', initials: 'D' },
  { name: 'Nadia', city: 'Surabaya', quote: 'Pengiriman regulernya tetap cepat dan packing rapi. Belanja langsung di website jadi terasa praktis.', initials: 'N' },
]

export default async function EVCResmiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const utm = extractUTM(new URLSearchParams(Object.entries(sp).map(([k, v]) => [k, v])))

  const shopLink = appendUTM('https://shop.evcmercato.com', utm)
  const katalogLink = appendUTM('https://shop.evcmercato.com/katalog', utm)

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {initPixelScript(pixelId)}
        </Script>
      )}

      {/* NAVBAR */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <a href={shopLink} className="flex items-center gap-2">
          <span className="font-bold text-[#7FB300] text-lg">EVC Mercato</span>
          <span className="text-xs bg-[#f8fce8] text-[#7FB300] px-2 py-0.5 rounded-full font-medium border border-[#7FB300]/20">Resmi</span>
        </a>
        <div className="flex items-center gap-2">
          <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm text-gray-600 hover:text-[#7FB300] transition-colors">Chat Admin</a>
          <a href={shopLink} className="text-sm bg-[#7FB300] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#6B9700] transition-colors">Belanja</a>
        </div>
      </header>

      <main>
        {/* SECTION 1 — HERO */}
        <section className="bg-white py-12 md:py-20 px-4">
          <div className="max-w-5xl mx-auto flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12">
            {/* Copy — left on desktop, top on mobile (reversed) */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block bg-[#f8fce8] text-[#7FB300] text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-[#7FB300]/20">
                🏅 Distributor Resmi KKI Group
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {content.hero.headline}
              </h1>
              <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto md:mx-0">
                {content.hero.subheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <a href={shopLink} className="bg-[#7FB300] text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-[#6B9700] transition-colors text-center">
                  {content.hero.cta_primary.text}
                </a>
                <a href={katalogLink} className="border-2 border-gray-200 text-gray-700 px-7 py-3.5 rounded-2xl font-semibold hover:border-[#7FB300] hover:text-[#7FB300] transition-colors text-center">
                  {content.hero.cta_secondary?.text}
                </a>
              </div>
            </div>
            {/* Hero image — right on desktop, bottom on mobile */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-gradient-to-br from-[#f8fce8] to-[#e8f5cc] aspect-square flex items-center justify-center">
                {/* TODO: ganti dengan <Image src="/assets/evc-trust-hero.png" ... /> setelah asset tersedia */}
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🌿</div>
                  <p className="text-[#7FB300] font-semibold text-lg">EVC Mercato</p>
                  <p className="text-gray-500 text-sm mt-1">Produk Pilihan KKI Group</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — TRUST COPY */}
        <section className="py-12 px-4 bg-[#fafafa] border-y border-gray-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Belanja Lebih Nyaman di Website Resmi</h2>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Belanja di website resmi EVC memberi pengalaman yang lebih aman, praktis, dan jelas dari awal. Informasi produk, layanan, dan bantuan tersedia dalam satu tempat supaya customer bisa memilih dengan lebih nyaman.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              EVC juga menghadirkan dukungan admin dan Evie untuk membantu menjawab pertanyaan, memberi info produk, dan memandu customer menemukan pilihan yang sesuai. Jadi, customer tidak belanja sendirian — ada tim yang siap membantu saat dibutuhkan.
            </p>
            <a href={shopLink} className="inline-block bg-[#7FB300] text-white px-7 py-3 rounded-2xl font-semibold hover:bg-[#6B9700] transition-colors">
              Belanja di Website Resmi
            </a>
          </div>
        </section>

        {/* SECTION 3 — KEUNGGULAN EVC */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-2">Keunggulan Belanja di EVC Mercato</h2>
            <p className="text-center text-gray-500 text-sm mb-8">Kenapa customer percaya belanja langsung di website kami</p>
            <div className="grid grid-cols-2 gap-4">
              {TRUST_CARDS.map((card, i) => (
                <div key={i} className="bg-[#fafafa] rounded-2xl border border-gray-100 p-5 text-center hover:border-[#7FB300]/30 hover:shadow-sm transition-all">
                  {card.icon}
                  <h3 className="font-bold text-sm text-gray-900 mb-1.5">{card.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — TESTIMONIAL PLACEHOLDER */}
        <section className="py-14 px-4 bg-[#fafafa]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-2">Dipercaya Customer dari Berbagai Kota</h2>
            <p className="text-center text-gray-500 text-sm mb-8">Belanja langsung di website EVC terasa lebih praktis: bisa tanya admin, cek info produk, dan pilih pengiriman sesuai kebutuhan.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#7FB300] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.city}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({length: 5}).map((_, j) => (
                        <span key={j} className="text-[#7FB300] text-xs">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">* Pengalaman pelanggan — placeholder untuk preview</p>
          </div>
        </section>

        {/* SECTION 5 — ADMIN + EVIE */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Butuh Bantuan Memilih Produk? Admin EVC &amp; Evie Siap Membantu</h2>
              <p className="text-gray-600 text-base max-w-xl mx-auto">
                Masih bingung memilih produk yang sesuai kebutuhan? Tim admin website EVC siap membantu melalui WhatsApp — mulai dari cek ketersediaan produk, panduan belanja, sampai informasi pengiriman.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Admin Card */}
              <div className="bg-[#f8fce8] rounded-2xl border border-[#7FB300]/20 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#7FB300] flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.12-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" fill="white"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Chat Admin EVC</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Tanya ketersediaan produk, info pengiriman, atau panduan belanja langsung via WhatsApp.</p>
                <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-[#7FB300] text-white py-3 rounded-xl font-semibold hover:bg-[#6B9700] transition-colors">
                  Chat Admin Sekarang
                </a>
              </div>
              {/* Evie Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#e8f5cc] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌿</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Evie Health by EVC</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Konsultan wellness yang siap membantu memahami kebutuhan dan mengarahkan pilihan produk yang sesuai — 24 jam.</p>
                <a href={EVIE_LINK} target="_blank" rel="noopener noreferrer"
                  className="block w-full border-2 border-[#7FB300] text-[#7FB300] py-3 rounded-xl font-semibold hover:bg-[#f8fce8] transition-colors">
                  Tanya Evie Sekarang
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
            <div>
              <p className="font-bold text-lg text-[#7FB300] mb-1">EVC Mercato</p>
              <p className="text-xs text-gray-400">Distributor Resmi KKI Group — Balikpapan, Kaltim</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <a href={katalogLink} className="hover:text-white transition-colors">Katalog Produk</a>
              <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Chat Admin</a>
              <a href={EVIE_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Evie Health</a>
              <a href="https://shop.evcmercato.com/syarat-ketentuan" className="hover:text-white transition-colors">Syarat &amp; Ketentuan</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} EVC Mercato. Semua hak dilindungi.</p>
            <p className="text-xs text-gray-500">Mitra Resmi KKI Group · KEMENKES RI AKL 11104320676</p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
        <a href={shopLink} className="flex-1 bg-[#7FB300] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#6B9700] transition-colors">
          Mulai Belanja
        </a>
        <a href={EVIE_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 border border-[#7FB300] text-[#7FB300] py-3 rounded-xl font-semibold text-sm text-center hover:bg-[#f8fce8] transition-colors">
          Tanya Evie
        </a>
      </div>
      {/* Spacer for sticky CTA mobile */}
      <div className="sm:hidden h-16" />
    </>
  )
}
