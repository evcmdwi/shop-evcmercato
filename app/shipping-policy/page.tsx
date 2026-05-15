import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Pengiriman — EVC Mercato',
  description: 'Informasi lengkap tentang kurir, estimasi waktu, ongkos kirim, tracking, dan klaim kerusakan pengiriman di EVC Mercato.',
}

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Kebijakan Pengiriman</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Mei 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Kurir Pengiriman</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">JNT Express</p>
                <p className="text-xs text-gray-500">Kurir utama untuk seluruh Indonesia. Reguler &amp; express tersedia.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">Grab Express</p>
                <p className="text-xs text-gray-500">Instan / Sameday delivery khusus 30 kota pilihan yang tersedia.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Area Pengiriman</h2>
            <p>EVC Mercato melayani pengiriman ke seluruh wilayah Indonesia. Pengiriman dilakukan dari Hub EVC / cabang KKI yang terdekat dan produk tersedia.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Jawa, Bali, Madura: 1–3 hari kerja</li>
              <li>Sumatera, Kalimantan, Sulawesi: 2–4 hari kerja</li>
              <li>Papua, Maluku, NTT/NTB: 4–7 hari kerja</li>
              <li>Instan dan sameday hari yang sama untuk order sebelum 15.30 waktu setempat</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Estimasi Waktu</h2>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 rounded-tl-lg font-semibold text-gray-900">Layanan</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Estimasi</th>
                    <th className="text-left p-3 rounded-tr-lg font-semibold text-gray-900">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3">Reguler (JNT)</td>
                    <td className="p-3">1–3 hari kerja</td>
                    <td className="p-3">Seluruh Indonesia</td>
                  </tr>
                  <tr>
                    <td className="p-3">Express (JNT)</td>
                    <td className="p-3">1–2 hari kerja</td>
                    <td className="p-3">Tersedia untuk kota-kota besar</td>
                  </tr>
                  <tr>
                    <td className="p-3">Sameday (Grab)</td>
                    <td className="p-3">Hari yang sama</td>
                    <td className="p-3">Khusus Balikpapan, order &lt;12.00 WITA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">* Estimasi dihitung dari hari kerja (tidak termasuk Sabtu, Minggu, dan hari libur nasional).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ongkos Kirim</h2>
            <div className="bg-[#f8fce8] border border-[#7FB300]/20 rounded-xl p-4 mb-3">
              <p className="font-semibold text-[#7FB300]">🎉 Gratis Ongkir untuk pembelian ≥ Rp 80.000</p>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ongkos kirim di bawah minimum pembelian dihitung berdasarkan berat dan jarak tujuan</li>
              <li>Tarif ongkos kirim final akan ditampilkan saat checkout sebelum pembayaran</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tracking Pesanan</h2>
            <p>Setelah pesanan dikirim:</p>
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              <li>Anda akan menerima notifikasi WhatsApp/email berisi nomor resi</li>
              <li>Login ke akun → menu Pesanan untuk melihat status real-time</li>
              <li>Tracking juga tersedia di website JNT Express (jnt.id) menggunakan nomor resi</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Klaim Kerusakan / Kehilangan</h2>
            <p>Jika paket diterima dalam kondisi rusak atau tidak sesuai:</p>
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              <li>Dokumentasikan kondisi paket dengan foto/video sebelum dibuka</li>
              <li>Hubungi CS kami dalam <strong>1×24 jam</strong> sejak paket diterima</li>
              <li>Kirim foto/video bukti kerusakan beserta nomor pesanan ke WhatsApp: +62 858-2085-2908</li>
              <li>Tim kami akan memproses klaim dan berkoordinasi dengan pihak kurir</li>
            </ol>
            <p className="mt-3 text-xs text-gray-400">Klaim kerusakan yang dilaporkan lebih dari 1×24 jam setelah penerimaan tidak dapat kami proses.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
