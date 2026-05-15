import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang EVC Mercato — CV. EVC Nusantara Sukses',
  description: 'EVC Mercato dikelola oleh CV. EVC Nusantara Sukses, distributor resmi KKI Group sejak 2003. Produk kesehatan, wellness, kecantikan, feminine care.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Tentang EVC Mercato</h1>
        <p className="text-sm text-gray-400 mb-8">Mitra Usaha Resmi KKI Group sejak 2003</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Siapa Kami</h2>
            <p>EVC Mercato hadir sejak 2018 di platform Tokopedia, dan 2023 di platform Shopee, dikelola secara mandiri oleh distributor / Mitra usaha resmi KKI Group dengan nomor KKD 12081020 dengan membership D.C. Chandra. Selama 8 tahun kami berkiprah di marketplace, kami telah melayani lebih dari <strong>36.000 pelanggan</strong> dari seluruh Indonesia dengan review positif bintang 5 sebanyak <strong>32.000 lebih</strong> (22.000 review di Shopee EVC Mercato, dan 10.000 review di Tokopedia EVC Mercato).</p>
            <p className="mt-3">Tentunya kami sangat senang dapat melayani Anda dengan produk berkualitas KKI Group selama ini, sehingga demi meningkatkan kepercayaan dan operasional pelayanan kami, dibentuklah <strong>CV. EVC Nusantara Sukses</strong> yang mengelola operasional bisnis, logistik, financing, dan servicing secara profesional. Dengan pengalaman bisnis KKI Group lebih dari 2 dekade, kami menghadirkan website evcmercato.com sebagai sebuah nilai tambah untuk konsumen agar benefit yang diterima lebih fair, pengiriman cepat, dan lebih dekat dengan Anda. Website ini bertujuan untuk memudahkan akses masyarakat Indonesia terhadap produk-produk pilihan di bidang kesehatan, wellness, kecantikan, feminine care, dan kebutuhan harian berkualitas tinggi.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Operasional Kami</h2>
            <p>EVC Mercato beroperasi dengan model <strong>distributed warehouse network</strong> untuk memastikan pengiriman cepat ke seluruh Indonesia:</p>
            <div className="mt-3 bg-gray-50 rounded-xl p-5 space-y-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">📍 Kantor Legal / Korespondensi</p>
                <p className="mt-1">CV. EVC Nusantara Sukses<br/>Plaza Aminta Lantai 5/504<br/>Jalan Letnan Jendral TB Simatupang Kav 10<br/>Pondok Pinang, Kebayoran Lama<br/>Jakarta Selatan, DKI Jakarta 12310</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">🏭 Hub Operasional &amp; Gudang</p>
                <p className="mt-1">4 lokasi strategis Warehouse EVC di Indonesia dan 26 Cabang KKI Nusantara, untuk memastikan pengiriman cepat ke seluruh nusantara. Model ini memungkinkan kami menghadirkan pengiriman <strong>1–3 hari kerja</strong> untuk mayoritas wilayah Indonesia.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">📞 Kontak</p>
                <p className="mt-1">Email: cs@evcmercato.com<br/>WhatsApp: +62 858-2085-2908<br/>Jam Layanan: Senin–Sabtu, 09.00–17.00 WITA</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Produk Kami</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kesehatan &amp; Wellness</strong> — Suplemen vitamin, mineral, dan produk pendukung kesehatan harian</li>
              <li><strong>Feminine Care</strong> — Natesh, produk perawatan kewanitaan yang aman dan nyaman</li>
              <li><strong>Kecantikan</strong> — Rangkaian skincare dan personal care terpilih (Glanz, Beautyzen, Kristine Ko Kool)</li>
              <li><strong>FITSOL</strong> — Produk nutrisi dan kebugaran dari Total Swiss</li>
              <li><strong>Kebutuhan Harian</strong> — Produk personal care, minuman, dan makanan pilihan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Komitmen Kami</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menyediakan produk original langsung dari KKI Group</li>
              <li>Pelayanan pelanggan yang responsif Senin–Sabtu</li>
              <li>Pembayaran aman via payment gateway terpercaya terdaftar Bank Indonesia</li>
              <li>Pengiriman cepat dan andal ke seluruh Indonesia</li>
              <li>Transparansi penuh dalam setiap transaksi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Capaian Kami</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { n: '23 Tahun', l: 'Pengalaman (2003)' },
                { n: '30.000+', l: 'Ulasan Positif' },
                { n: '4 Hub', l: 'Gudang Operasional' },
                { n: '39+ Produk', l: 'Produk Pilihan' },
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
