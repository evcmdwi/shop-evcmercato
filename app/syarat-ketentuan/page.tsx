import type { Metadata } from 'next'
import Link from 'next/link'
import { TERMS_VERSION, TERMS_EFFECTIVE_DATE } from '@/lib/constants/terms'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - EVC Mercato',
  description: 'Ketentuan layanan shop.evcmercato.com, dikelola oleh mitra usaha resmi KKI Group No. ID 12081020',
}

export default function SyaratKetentuanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Syarat &amp; Ketentuan</h1>
        <p className="text-lg text-gray-600 mb-1">shop.evcmercato.com</p>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>Versi {TERMS_VERSION}</span>
          <span>•</span>
          <span>Berlaku Efektif {TERMS_EFFECTIVE_DATE}</span>
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 font-medium">
            ⚖️ Dokumen ini adalah perjanjian hukum antara Anda dan EVC Mercato.
            Dengan menggunakan layanan atau melakukan pembelian di website ini,
            Anda dianggap telah membaca dan menyetujui seluruh ketentuan berikut.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-gray max-w-none space-y-8">

        {/* PASAL 1 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 1 — IDENTITAS DAN STATUS WEBSITE</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>1.1</strong> Website shop.evcmercato.com (selanjutnya disebut &quot;Website&quot;) dikelola secara INDEPENDEN oleh:</p>
            <div className="ml-6 bg-gray-50 rounded-xl p-4 text-sm">
              <p><strong>Pengelola</strong> : EVC Mercato</p>
              <p><strong>Status</strong> : Mitra Usaha Resmi KKI Group</p>
              <p><strong>No. ID</strong> : 12081020</p>
              <p><strong>Sejak</strong> : 2003</p>
              <p><strong>Domisili</strong> : Samarinda, Kalimantan Timur</p>
            </div>
            <p><strong>1.2</strong> Website ini ADALAH platform e-commerce mandiri milik mitra usaha KKI Group dan <strong>BUKAN</strong> merupakan official store, website resmi, atau platform yang dimiliki, dioperasikan, atau dikendalikan secara langsung oleh KKI Group.</p>
            <p><strong>1.3</strong> KKI Group sebagai principal pemilik produk dan brand TIDAK bertanggung jawab atas operasional, kebijakan, harga, promosi, atau transaksi yang terjadi di Website ini.</p>
            <p><strong>1.4</strong> Hubungan antara Pengelola Website dan KKI Group adalah hubungan business-to-business sebagai distributor/mitra usaha, sesuai dengan ketentuan kemitraan yang berlaku.</p>
          </div>
        </section>

        {/* PASAL 2 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 2 — STATUS PEMBELI DAN PEMBELIAN</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>2.1</strong> Setiap orang yang melakukan pembelian di Website ini (selanjutnya disebut &quot;Pembeli&quot;) berstatus sebagai <strong>KONSUMEN RETAIL</strong> biasa, BUKAN sebagai member, distributor, atau mitra KKI Group.</p>
            <p><strong>2.2</strong> Dengan melakukan pembelian di Website ini, Pembeli memahami dan menyetujui bahwa pembelian <strong>TIDAK</strong> akan memberikan:</p>
            <div className="ml-6 space-y-1 text-sm">
              <p>a) Keanggotaan (membership) KKI Group</p>
              <p>b) Personal Volume (PV)</p>
              <p>c) Business Volume (BV)</p>
              <p>d) Personal Rebate (PR)</p>
              <p>e) Komisi atau bonus jaringan dalam sistem KKI Group</p>
              <p>f) Hak-hak member KKI Group lainnya</p>
              <p>g) Tracking ke jaringan/leg member KKI manapun</p>
            </div>
            <p><strong>2.3</strong> Pembelian di Website ini bersifat <strong>MURNI TRANSAKSI JUAL BELI RETAIL</strong> antara Pembeli dengan Pengelola Website (EVC Mercato), bukan transaksi yang menggunakan sistem KKI Group.</p>
            <p><strong>2.4</strong> Apabila Pembeli berkeinginan untuk mendapatkan fasilitas member KKI Group, Pembeli DIPERSILAKAN mendaftar langsung sebagai member KKI Group melalui jalur resmi.</p>
            <p><strong>2.5</strong> Dengan menyelesaikan transaksi pembelian di Website ini, Pembeli DIANGGAP TELAH MEMBACA, MEMAHAMI, dan MENYETUJUI seluruh ketentuan yang tertuang dalam dokumen ini.</p>
          </div>
        </section>

        {/* PASAL 3 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 3 — PRODUK DAN GARANSI</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>3.1</strong> Seluruh produk yang dijual di Website ini adalah produk <strong>original</strong> dari KKI Group yang diperoleh melalui jalur distribusi resmi.</p>
            <p><strong>3.2</strong> Pengelola Website menjamin keaslian produk yang dijual sesuai dengan standar distribusi resmi KKI Group.</p>
            <p><strong>3.3</strong> Garansi produk mengacu pada kebijakan garansi produsen KKI Group. Pengelola Website akan memfasilitasi klaim garansi sesuai prosedur yang berlaku.</p>
          </div>
        </section>

        {/* PASAL 4 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 4 — HARGA, PEMBAYARAN, DAN PENGIRIMAN</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>4.1</strong> Harga yang tercantum di Website adalah harga eceran yang ditetapkan secara independen oleh Pengelola Website.</p>
            <p><strong>4.2</strong> Pembayaran dilakukan melalui platform Xendit dengan metode yang tersedia (transfer bank, e-wallet, kartu kredit, gerai ritel).</p>
            <p><strong>4.3</strong> Pengiriman dilakukan melalui mitra kurir (JNE, JNT, Grab Express) dengan estimasi waktu sesuai yang tertera saat checkout.</p>
            <p><strong>4.4</strong> Harga yang tertera belum termasuk ongkos kirim kecuali Pembeli memenuhi syarat gratis ongkir yang berlaku.</p>
          </div>
        </section>

        {/* PASAL 5 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 5 — EVC POINTS (Program Loyalti Internal)</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>5.1</strong> EVC Points adalah program loyalti <strong>INTERNAL</strong> milik EVC Mercato, sepenuhnya terpisah dari sistem KKI Group.</p>
            <p><strong>5.2</strong> EVC Points hanya dapat digunakan di platform shop.evcmercato.com dan tidak dapat dikonversi ke bentuk lain.</p>
            <p><strong>5.3</strong> Ketentuan earning: Setiap pembelian senilai Rp 1.000 menghasilkan 1 EVC Point.</p>
            <p><strong>5.4</strong> EVC Points dapat ditukarkan dengan produk gratis sesuai promo yang berlaku, dengan hanya membayar ongkir dan biaya admin.</p>
          </div>
        </section>

        {/* PASAL 6 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 6 — PENGEMBALIAN DAN PENGEMBALIAN DANA</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>6.1</strong> Pengembalian produk dapat dilakukan dalam 7 hari sejak barang diterima, dengan syarat produk belum dipakai dan kemasan masih utuh.</p>
            <p><strong>6.2</strong> Pengembalian dana akan diproses dalam 3-7 hari kerja setelah produk dikonfirmasi diterima kembali.</p>
            <p><strong>6.3</strong> Biaya pengiriman pengembalian ditanggung Pembeli kecuali terdapat kesalahan dari pihak Pengelola Website.</p>
          </div>
        </section>

        {/* PASAL 7 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 7 — DATA PRIBADI (Sesuai UU PDP No. 27/2022)</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>7.1</strong> Pengelola Website mengumpulkan dan memproses data pribadi Pembeli (nama, email, nomor telepon, alamat) untuk keperluan transaksi dan layanan pelanggan.</p>
            <p><strong>7.2</strong> Data pribadi Pembeli tidak akan dibagikan kepada pihak ketiga tanpa persetujuan, kecuali untuk keperluan pengiriman dan pembayaran.</p>
            <p><strong>7.3</strong> Pembeli berhak mengakses, memperbarui, dan meminta penghapusan data pribadinya dengan menghubungi cs@evcmercato.com.</p>
          </div>
        </section>

        {/* PASAL 8 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 8 — HAK KEKAYAAN INTELEKTUAL</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>8.1</strong> Brand KKI Group dan nama produk adalah milik KKI Group. Pengelola Website menggunakan nama produk dalam kapasitas sebagai mitra distribusi resmi.</p>
            <p><strong>8.2</strong> Konten, desain, dan materi Website (selain nama produk KKI) adalah milik EVC Mercato dan dilindungi hak cipta.</p>
          </div>
        </section>

        {/* PASAL 9 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 9 — PEMBATASAN TANGGUNG JAWAB</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>9.1</strong> Pengelola Website bertanggung jawab atas kebenaran informasi produk dan proses transaksi di Website ini.</p>
            <p><strong>9.2</strong> KKI Group tidak bertanggung jawab atas transaksi, promosi, atau kebijakan yang dilakukan di Website ini.</p>
            <p><strong>9.3</strong> Pengelola Website tidak bertanggung jawab atas kerugian yang timbul akibat penyalahgunaan informasi oleh pihak ketiga.</p>
          </div>
        </section>

        {/* PASAL 10 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 10 — PENYELESAIAN SENGKETA</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>10.1</strong> Sengketa yang timbul dari penggunaan Website diselesaikan secara musyawarah mufakat.</p>
            <p><strong>10.2</strong> Apabila musyawarah tidak mencapai kesepakatan, para pihak sepakat untuk menyelesaikan melalui jalur hukum yang berlaku di wilayah Republik Indonesia.</p>
          </div>
        </section>

        {/* PASAL 11 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 11 — PERUBAHAN SYARAT DAN KETENTUAN</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p><strong>11.1</strong> Pengelola Website berhak memperbarui Syarat &amp; Ketentuan ini sewaktu-waktu dengan pemberitahuan melalui Website.</p>
            <p><strong>11.2</strong> Penggunaan Website setelah perubahan dianggap sebagai persetujuan atas Syarat &amp; Ketentuan yang baru.</p>
          </div>
        </section>

        {/* PASAL 12 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">PASAL 12 — KONTAK RESMI</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p>Untuk pertanyaan, keluhan, atau informasi lebih lanjut:</p>
            <div className="ml-6 bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p>📧 Email: cs@evcmercato.com</p>
              <p>📱 WhatsApp: +62 858-2085-2908</p>
              <p>🤖 Evie AI: <a href="https://t.me/evie_evc_bot" className="text-[#7FB300] hover:underline">t.me/evie_evc_bot</a></p>
              <p>🌐 Website: shop.evcmercato.com</p>
            </div>
          </div>
        </section>

        {/* Persetujuan */}
        <section className="bg-[#E8F4D1] border border-[#7FB300] rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">PERNYATAAN PERSETUJUAN</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Dengan menyelesaikan transaksi pembelian di shop.evcmercato.com, saya sebagai Pembeli menyatakan:
          </p>
          <ol className="mt-3 space-y-2 text-sm text-gray-700">
            <li>1. Telah membaca, memahami, dan menyetujui seluruh isi Syarat dan Ketentuan ini.</li>
            <li>2. Memahami bahwa Website ini dikelola secara independen oleh mitra usaha KKI Group (No. ID 12081020) dan BUKAN merupakan official store KKI Group.</li>
            <li>3. Memahami bahwa berbelanja di Website ini TIDAK memberikan fasilitas member KKI Group seperti PV, BV, PR, dan komisi.</li>
            <li>4. Setuju dengan ketentuan-ketentuan tersebut sebagai dasar transaksi pembelian.</li>
          </ol>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
        <p>Versi {TERMS_VERSION} — Berlaku Efektif {TERMS_EFFECTIVE_DATE}</p>
        <p className="mt-1">© 2026 EVC Mercato — Mitra Usaha Resmi KKI Group (No. ID 12081020)</p>
        <p className="mt-2"><Link href="/" className="text-[#7FB300] hover:underline">← Kembali ke Beranda</Link></p>
      </div>

      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { font-size: 12pt; }
          h2 { page-break-before: auto; }
        }
      `}</style>
    </div>
  )
}
