import type { Metadata } from 'next'
import Script from 'next/script'
import Image from 'next/image'
import { initPixelScript } from '@/lib/marketing/pixel'
import { extractUTM, appendUTM } from '@/lib/marketing/utm'
import { appendRef } from '@/lib/marketing/ref'
import AffiliateRefSetter from '@/components/marketing/AffiliateRefSetter'
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

const WA_ADMIN = 'https://wa.me/6285820852908?text=Halo%20EVC%20Mercato%2C%20saya%20ingin%20tanya%20tentang%20produk'
const EVIE_LINK = 'https://t.me/evie_evc_bot?start=6285820852908'

const TRUST_CARDS = [
  {
    title: 'Pembayaran Terpercaya',
    copy: 'Checkout lebih tenang dengan alur pembayaran yang jelas.',
    img: '/assets/evc-trust-box-pembayaran-terpercaya.png',
  },
  {
    title: 'Produk Pilihan Resmi',
    copy: 'Produk pilihan tersedia melalui website resmi EVC Mercato.',
    img: '/assets/evc-trust-box-official-store.png',
  },
  {
    title: 'Pengiriman Cepat',
    copy: 'Pesanan diproses tim EVC dan dikirim ke alamat customer.',
    img: '/assets/evc-trust-box-pengiriman-cepat.png',
  },
  {
    title: 'Admin & Evie Siap Membantu',
    copy: 'Customer bisa tanya dulu sebelum belanja agar lebih yakin memilih produk.',
    img: '/assets/evc-trust-box-cs-evie-support.jpg',
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
  const ref = sp['ref'] ?? null

  const shopLink = appendRef(appendUTM('https://shop.evcmercato.com', utm), ref)
  const katalogLink = appendRef(appendUTM('https://shop.evcmercato.com/katalog', utm), ref)
  const waLink = appendRef(WA_ADMIN, ref)
  const evieLink = appendRef(EVIE_LINK, ref)

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {initPixelScript(pixelId)}
        </Script>
      )}
      <AffiliateRefSetter refCode={ref} />

      <main>
        {/* SECTION 1 — HERO */}
        <section className="bg-white py-12 md:py-20 px-4">
          <div className="max-w-5xl mx-auto flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12">
            {/* Copy — left on desktop, top on mobile (reversed) */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Belanja Produk Kesehatan KKI Group &amp; Wellness Pilihan di EVC Mercato
              </h1>
              <p className="text-base text-gray-500 mb-8 max-w-lg mx-auto md:mx-0">
                Temukan produk pilihan untuk kebutuhan harian, kesehatan, wellness, beauty, dan feminine care dalam satu tempat yang praktis, jelas, dan mudah diakses dari HP.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <a href={shopLink} className="bg-[#7FB300] text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-[#6B9700] transition-colors text-center">
                  Belanja Sekarang
                </a>
              </div>
            </div>
            {/* Hero image — right on desktop, bottom on mobile */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden">
                <Image
                  src="/assets/evc-trust-hero.jpg"
                  alt="Produk pilihan EVC Mercato — Natesh, Vitayang, Fitsol dan lebih banyak lagi"
                  width={480}
                  height={480}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — TRUST COPY */}
        <section className="py-12 px-4 bg-[#fafafa] border-y border-gray-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Belanja Lebih Nyaman di EVC Mercato</h2>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Belanja di EVC Mercato memberi pengalaman yang lebih praktis dan jelas dari awal. Customer bisa melihat informasi produk, memilih kebutuhan, dan melanjutkan belanja dengan alur yang mudah dipahami dari mobile.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              EVC juga menghadirkan dukungan admin untuk membantu menjawab pertanyaan seputar produk, ketersediaan, proses belanja, hingga informasi pengiriman. Jadi, customer tidak perlu bingung sendiri saat ingin memilih produk yang sesuai.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              Evie Health by EVC adalah konsultan kesehatan digital EVC yang siap sedia membantu pelanggan 24 jam, 7 hari seminggu. Evie dibekali pengetahuan luas seputar keluhan umum, pilihan solusi, gaya hidup, dan kebutuhan wellness masa kini, sehingga pelanggan bisa mendapatkan arahan awal yang lebih personal sebelum memilih produk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={shopLink} className="inline-block bg-[#7FB300] text-white px-7 py-3 rounded-2xl font-semibold hover:bg-[#6B9700] transition-colors">
                Belanja Sekarang
              </a>
              <a href={evieLink} target="_blank" rel="noopener noreferrer" className="inline-block border-2 border-[#7FB300] text-[#7FB300] px-7 py-3 rounded-2xl font-semibold hover:bg-[#f8fce8] transition-colors">
                Konsultasi dengan Evie Health by EVC
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 3 — KEUNGGULAN EVC */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-2">Keunggulan Belanja di EVC Mercato</h2>
            <p className="text-center text-gray-500 text-sm mb-8">Kenapa customer percaya belanja langsung di website kami</p>
            <div className="grid grid-cols-2 gap-4">
              {TRUST_CARDS.map((card, i) => (
                <div key={i} className="bg-[#fafafa] rounded-2xl border border-gray-100 p-3 text-center hover:border-[#7FB300]/30 hover:shadow-sm transition-all">
                  <Image src={card.img} alt={card.title} width={200} height={200} className="w-full h-32 object-contain mx-auto mb-3" />
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
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-[#7FB300] text-white py-3 rounded-xl font-semibold hover:bg-[#6B9700] transition-colors">
                  Chat Admin Sekarang
                </a>
              </div>
              {/* Evie Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#e8f5cc]">
                  <Image src="/assets/evc-trust-box-cs-evie-support.jpg" alt="Evie Health Advisor" width={80} height={80} className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Evie Health by EVC</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">Konsultan wellness yang siap membantu memahami kebutuhan dan mengarahkan pilihan produk yang sesuai — 24 jam.</p>
                <a href={evieLink} target="_blank" rel="noopener noreferrer"
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
              <p className="text-xs text-gray-400">Online Channel #1 KKI Group</p>
              <p className="text-xs text-gray-500">Mitra usaha resmi KKI Group</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <a href={katalogLink} className="hover:text-white transition-colors py-3 inline-block">Katalog Produk</a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors py-3 inline-block">Chat Admin</a>
              <a href={evieLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors py-3 inline-block">Evie Health</a>
              <a href={appendRef('https://shop.evcmercato.com/syarat-ketentuan', ref)} className="hover:text-white transition-colors py-3 inline-block">Syarat &amp; Ketentuan</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} EVC Mercato. All rights reserved.</p>
          </div>
        </div>
      </footer>


    </>
  )
}
