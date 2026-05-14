import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — EVC Mercato',
  description: 'Syarat dan ketentuan penggunaan layanan dan pembelian di shop.evcmercato.com.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Syarat &amp; Ketentuan</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Mei 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Definisi</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>&quot;EVC Mercato&quot;</strong> mengacu pada CV. EVC Nusantara Sukses, Mitra Usaha Resmi KKI Group (KKD 12081020). Pengelola: CV. EVC Nusantara Sukses, Alamat Legal: Plaza Aminta Lantai 5/504, Jalan Letnan Jendral TB Simatupang Kav 10, Pondok Pinang, Kebayoran Lama, Jakarta Selatan, DKI Jakarta 12310. Status: Mitra Usaha Resmi KKI Group (KKD 12081020). Domisili Operasional: Indonesia (4 hub gudang).</li>
              <li><strong>&quot;Website&quot;</strong> mengacu pada shop.evcmercato.com dan seluruh layanan yang tersedia di dalamnya.</li>
              <li><strong>&quot;Pelanggan&quot;</strong> atau <strong>&quot;Anda&quot;</strong> mengacu pada setiap pengguna yang mengakses atau melakukan pembelian di Website.</li>
              <li><strong>&quot;Produk&quot;</strong> mengacu pada barang yang dijual melalui Website, dipasok oleh KKI Group.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Kewajiban EVC Mercato</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Menyediakan produk original yang bersumber langsung dari KKI Group</li>
              <li>Memproses pesanan yang telah dibayar dalam 1×24 jam hari kerja</li>
              <li>Memberikan informasi produk yang akurat dan tidak menyesatkan</li>
              <li>Menjaga kerahasiaan data pelanggan sesuai kebijakan privasi yang berlaku</li>
              <li>Merespons pertanyaan dan keluhan pelanggan dalam 1×24 jam</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Kewajiban Pelanggan</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Memberikan informasi yang benar dan akurat saat pendaftaran dan checkout</li>
              <li>Menjaga kerahasiaan akun dan kata sandi</li>
              <li>Tidak menyalahgunakan platform untuk aktivitas yang melanggar hukum</li>
              <li>Melakukan pembayaran sesuai metode dan nominal yang tertera</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Pembayaran</h2>
            <p className="mt-2">Semua transaksi menggunakan mata uang Rupiah (IDR). Pembayaran diproses melalui Xendit, penyedia layanan pembayaran yang tersertifikasi Bank Indonesia. Pesanan akan diproses setelah konfirmasi pembayaran diterima. Link pembayaran berlaku selama 24 jam. Pesanan yang tidak dibayar dalam batas waktu akan otomatis dibatalkan.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Pengiriman</h2>
            <p className="mt-2">Pengiriman dilakukan ke seluruh wilayah Indonesia menggunakan layanan JNT Express dan layanan kurir lainnya. Estimasi pengiriman 1–3 hari kerja untuk pengiriman reguler, atau sameday untuk area Balikpapan. EVC Mercato tidak bertanggung jawab atas keterlambatan yang disebabkan oleh kurir atau keadaan di luar kendali kami.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Batasan Tanggung Jawab</h2>
            <p className="mt-2">EVC Mercato tidak bertanggung jawab atas:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Kerugian tidak langsung atau konsekuensial akibat penggunaan produk</li>
              <li>Gangguan layanan akibat force majeure (bencana alam, gangguan internet, dll)</li>
              <li>Penggunaan produk yang tidak sesuai anjuran</li>
            </ul>
            <p className="mt-2">Tanggung jawab maksimal EVC Mercato terbatas pada nilai pembelian yang bersangkutan.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Hukum yang Berlaku</h2>
            <p className="mt-2">Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai hukum yang berlaku di Republik Indonesia, termasuk namun tidak terbatas pada Undang-Undang No. 8 Tahun 1999 tentang Perlindungan Konsumen dan Undang-Undang No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Penyelesaian Sengketa</h2>
            <p className="mt-2">Segala sengketa yang timbul dari penggunaan Website ini akan diselesaikan secara musyawarah mufakat. Apabila tidak tercapai kesepakatan, sengketa akan diselesaikan melalui Badan Penyelesaian Sengketa Konsumen (BPSK) atau pengadilan yang berwenang di wilayah Balikpapan, Kalimantan Timur, Indonesia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Hak Perubahan Syarat</h2>
            <p className="mt-2">EVC Mercato berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku sejak dipublikasikan di Website. Penggunaan Website setelah perubahan dipublikasikan dianggap sebagai persetujuan atas syarat yang telah diperbarui.</p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">⚠️ Disclaimer Penting</h2>
            <p className="mt-1">Website ini dikelola secara independen oleh <strong>Mitra Usaha Resmi KKI Group (KKD 12081020)</strong> dan <strong>BUKAN</strong> merupakan official store KKI Group. Pembelian di sini tidak memberikan fasilitas member KKI (PV, BV, PR, komisi). Untuk menjadi member KKI Group, silakan daftar langsung ke KKI Group resmi.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
