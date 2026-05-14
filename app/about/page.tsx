import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang Kami — EVC Mercato',
  description: 'EVC Mercato adalah distributor resmi produk KKI Group yang melayani kebutuhan kesehatan, wellness, dan kecantikan sejak 2003.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Tentang EVC Mercato</h1>
        <p className="text-sm text-gray-400 mb-8">Mitra Usaha Resmi KKI Group sejak 2003</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Siapa Kami</h2>
            <p>EVC Mercato adalah distributor resmi dan mitra usaha KKI Group yang beroperasi sejak tahun 2003. Kami hadir untuk memudahkan akses masyarakat Indonesia terhadap produk-produk pilihan di bidang kesehatan, wellness, kecantikan, feminine care, dan kebutuhan harian berkualitas tinggi.</p>
            <p className="mt-3">Dengan pengalaman lebih dari dua dekade melayani pelanggan setia dari berbagai penjuru Indonesia, EVC Mercato berkomitmen menghadirkan pengalaman belanja yang aman, praktis, dan terpercaya langsung melalui website resmi kami.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Lokasi Kami</h2>
            <p>EVC Mercato beroperasi dari Balikpapan, Kalimantan Timur, dan melayani pengiriman ke seluruh wilayah Indonesia.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm mt-3">
              <p className="font-semibold text-gray-900">EVC Mercato</p>
              <p>Balikpapan, Kalimantan Timur, Indonesia</p>
              <p>Email: cs@evcmercato.com</p>
              <p>WhatsApp: +62 858-2085-2908</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Produk Kami</h2>
            <p>Kami menghadirkan rangkaian produk pilihan dari KKI Group, meliputi:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Kesehatan &amp; Wellness</strong> — Suplemen vitamin, mineral, dan produk pendukung kesehatan harian</li>
              <li><strong>Feminine Care</strong> — Natesh, produk perawatan kewanitaan yang aman dan nyaman</li>
              <li><strong>Kecantikan</strong> — Rangkaian skincare dan personal care terpilih</li>
              <li><strong>FITSOL</strong> — Produk nutrisi dan kebugaran dari Total Swiss</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Komitmen Kami</h2>
            <p>EVC Mercato berkomitmen untuk:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Menyediakan produk original dan terjamin keasliannya langsung dari KKI Group</li>
              <li>Memberikan pelayanan pelanggan yang responsif dan solutif</li>
              <li>Menghadirkan pengalaman belanja yang aman dengan sistem pembayaran terpercaya</li>
              <li>Pengiriman yang cepat dan andal ke seluruh Indonesia</li>
              <li>Transparansi penuh dalam setiap transaksi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Capaian Kami</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              {[
                { n: '20+ Tahun', l: 'Pengalaman' },
                { n: '30.000+', l: 'Ulasan Positif' },
                { n: '30+ Hub', l: 'Pengiriman' },
                { n: '39 Produk', l: 'Pilihan' },
              ].map((s, i) => (
                <div key={i} className="bg-[#f8fce8] rounded-xl p-4 text-center">
                  <p className="font-bold text-[#7FB300] text-lg">{s.n}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
