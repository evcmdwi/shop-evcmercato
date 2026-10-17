'use client'

import Modal from '@/components/Modal'
import { EXPRESS_HOURS } from '@/lib/shipping'

interface ExpressShippingModalProps {
  method: 'instan' | 'sameday' | null
  recipient: { name: string; phone: string; address: string } | null
  onAgree: () => void
  /** Tutup tanpa setuju → kembali ke Reguler. */
  onCancel: () => void
}

const TITLE = { instan: 'Pengiriman Instan ⚡', sameday: 'Pengiriman Sameday 🚚' }

/** Popup persetujuan saat pembeli memilih Instan/Sameday (kurir Grab). */
export default function ExpressShippingModal({ method, recipient, onAgree, onCancel }: ExpressShippingModalProps) {
  if (!method) return null
  const hours = EXPRESS_HOURS[method]

  return (
    <Modal isOpen onClose={onCancel} title={TITLE[method]}>
      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <p className="font-semibold text-gray-900">Jam kerja pengiriman</p>
          <table className="mt-2 w-full text-left">
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-1.5 pr-3">Senin – Jumat</td><td className="py-1.5 font-semibold text-gray-900">{hours.weekday}</td></tr>
              <tr><td className="py-1.5 pr-3">Sabtu</td><td className="py-1.5 font-semibold text-gray-900">{hours.saturday}</td></tr>
              <tr><td className="py-1.5 pr-3">Minggu &amp; tanggal merah</td><td className="py-1.5 font-semibold text-red-600">Libur</td></tr>
            </tbody>
          </table>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
            <li>Dikirim dengan kurir Grab.</li>
            <li>Pesanan yang dibayar di luar jam di atas dikirim pada jam kerja berikutnya.</li>
            <li>Pastikan penerima ada di lokasi dan nomor HP aktif — kurir akan menghubungi saat mengantar.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="font-semibold text-amber-900">Pastikan nomor HP &amp; alamat sudah benar</p>
          {recipient ? (
            <div className="mt-1.5 text-gray-800">
              <p className="font-medium">{recipient.name} · {recipient.phone}</p>
              <p className="mt-0.5 break-words text-xs text-gray-600">{recipient.address}</p>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-amber-800">Alamat & nomor HP belum lengkap — lengkapi dulu sebelum membayar.</p>
          )}
          <p className="mt-2 text-xs text-amber-800">Alamat atau nomor HP yang salah dapat membuat paket gagal atau terlambat diantar.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Pakai Reguler
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="min-h-[48px] rounded-xl bg-[#7FB300] text-sm font-bold text-white hover:bg-[#6B9700]"
          >
            Setuju
          </button>
        </div>
      </div>
    </Modal>
  )
}
