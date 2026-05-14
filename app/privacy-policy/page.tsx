import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — EVC Mercato',
  description: 'Informasi tentang pengumpulan, penggunaan, dan perlindungan data pribadi Anda di EVC Mercato. Sesuai UU PDP No. 27/2022.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Mei 2026 · Sesuai UU PDP No. 27/2022</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Data yang Kami Kumpulkan</h2>
            <p>Kami mengumpulkan data berikut saat Anda menggunakan layanan kami:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Data Identitas:</strong> nama lengkap, nomor telepon, alamat email</li>
              <li><strong>Data Alamat:</strong> alamat pengiriman, kota, provinsi, kode pos</li>
              <li><strong>Data Transaksi:</strong> riwayat pesanan, metode pembayaran (tidak termasuk nomor kartu)</li>
              <li><strong>Data Teknis:</strong> alamat IP, tipe browser, halaman yang dikunjungi, waktu akses</li>
              <li><strong>Data Komunikasi:</strong> pesan yang Anda kirim ke tim CS kami</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Tujuan Penggunaan Data</h2>
            <p>Kami menggunakan data Anda untuk:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Memproses dan memenuhi pesanan Anda</li>
              <li>Mengirimkan konfirmasi pesanan dan notifikasi pengiriman via email dan WhatsApp</li>
              <li>Mengelola akun dan program loyalitas EVC Points</li>
              <li>Merespons pertanyaan dan permintaan dukungan pelanggan</li>
              <li>Meningkatkan layanan dan pengalaman berbelanja</li>
              <li>Memenuhi kewajiban hukum yang berlaku di Indonesia</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Keamanan Data</h2>
            <p className="mt-2">Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang memadai untuk melindungi data pribadi Anda, termasuk:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Enkripsi data dalam transit menggunakan HTTPS/TLS</li>
              <li>Row Level Security (RLS) pada database Supabase untuk isolasi data pengguna</li>
              <li>Akses data terbatas hanya pada personel yang berwenang</li>
              <li>Password disimpan dalam bentuk hash yang tidak dapat dibalik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Pihak Ketiga yang Menerima Data</h2>
            <p className="mt-2">Kami berbagi data yang diperlukan dengan pihak ketiga terpercaya berikut:</p>
            <div className="space-y-3 mt-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">Xendit (Payment Gateway)</p>
                <p className="text-xs text-gray-500 mt-1">Menerima data transaksi untuk memproses pembayaran. Xendit terdaftar dan diawasi oleh Bank Indonesia.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">Supabase (Database &amp; Auth)</p>
                <p className="text-xs text-gray-500 mt-1">Menyimpan data akun dan pesanan. Server berlokasi di region Asia Tenggara dengan enkripsi at-rest.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">Fonnte (WhatsApp Notification)</p>
                <p className="text-xs text-gray-500 mt-1">Menerima nomor telepon untuk pengiriman notifikasi WhatsApp terkait pesanan.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">Resend (Email Service)</p>
                <p className="text-xs text-gray-500 mt-1">Menerima alamat email untuk pengiriman konfirmasi pesanan dan notifikasi transaksional.</p>
              </div>
            </div>
            <p className="mt-3">Kami tidak menjual data pribadi Anda kepada pihak ketiga manapun.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Hak Pengguna (UU PDP No. 27/2022)</h2>
            <p className="mt-2">Sesuai Undang-Undang Perlindungan Data Pribadi No. 27 Tahun 2022, Anda memiliki hak:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Hak Akses:</strong> meminta salinan data pribadi yang kami simpan</li>
              <li><strong>Hak Koreksi:</strong> meminta perbaikan data yang tidak akurat</li>
              <li><strong>Hak Penghapusan:</strong> meminta penghapusan data Anda (dalam batas kewajiban hukum)</li>
              <li><strong>Hak Portabilitas:</strong> meminta data dalam format yang dapat dibaca mesin</li>
              <li><strong>Hak Keberatan:</strong> menolak pemrosesan data untuk tujuan tertentu</li>
            </ul>
            <p className="mt-2">Untuk menggunakan hak-hak tersebut, hubungi kami di <a href="mailto:cs@evcmercato.com" className="text-[#7FB300] hover:underline">cs@evcmercato.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Cookies &amp; Persetujuan Pengguna</h2>
            <p>Website shop.evcmercato.com menggunakan cookies untuk:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Cookies Esensial</strong>: menjaga sesi login, menyimpan isi keranjang belanja, dan memastikan fungsionalitas dasar website</li>
              <li><strong>Cookies Performa</strong>: mengumpulkan data anonim tentang cara pengunjung menggunakan website untuk meningkatkan layanan kami</li>
              <li><strong>Cookies Preferensi</strong>: menyimpan preferensi tampilan dan pengaturan akun Anda</li>
            </ul>
            <p className="mt-3"><strong>Persetujuan Implisit</strong>: Dengan terus menggunakan website kami setelah membaca Kebijakan Privasi ini, Anda dianggap memberikan persetujuan atas penggunaan cookies sebagaimana dijelaskan di atas. Persetujuan ini diberikan atas dasar <strong>kepentingan yang sah (legitimate interest)</strong> sesuai UU PDP No. 27/2022 Pasal 20.</p>
            <p className="mt-3"><strong>Pengelolaan Cookies</strong>: Anda dapat menonaktifkan atau menghapus cookies melalui pengaturan browser Anda. Menonaktifkan cookies esensial dapat mempengaruhi fungsionalitas seperti login, checkout, dan pemesanan.</p>
            <p className="mt-3"><strong>Cookies Pihak Ketiga</strong>: Website kami tidak menggunakan cookies pihak ketiga untuk iklan tertarget atau profiling perilaku.</p>
            <p className="mt-3">Untuk pertanyaan terkait cookies, hubungi cs@evcmercato.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Kontak Pertanyaan Data</h2>
            <p className="mt-2">Untuk pertanyaan terkait privasi data Anda:</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-3 text-sm">
              <p className="font-semibold text-gray-900">CV. EVC Nusantara Sukses — Data Privacy</p>
              <p>Plaza Aminta Lantai 5/504, Jalan Letnan Jendral TB Simatupang Kav 10</p>
              <p>Jakarta Selatan, DKI Jakarta 12310</p>
              <p>Email: <a href="mailto:cs@evcmercato.com" className="text-[#7FB300] hover:underline">cs@evcmercato.com</a></p>
              <p>WhatsApp: <a href="https://wa.me/6285820852908" className="text-[#7FB300] hover:underline">+62 858-2085-2908</a></p>
              <p>Jam layanan: Senin–Sabtu, 09.00–17.00 WITA</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
