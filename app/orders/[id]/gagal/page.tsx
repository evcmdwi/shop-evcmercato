'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { XCircle, Loader2 } from 'lucide-react'

export default function OrderGagalPage() {
  const params = useParams()
  const id = params?.id as string
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        const { data } = await res.json()
        if (data?.xendit_invoice_url) {
          window.location.href = data.xendit_invoice_url
          return
        }
      }
    } catch {
      // fall through
    }
    setRetrying(false)
    alert('Link pembayaran tidak ditemukan. Hubungi support.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Gagal atau Dibatalkan</h1>
        <p className="text-sm text-gray-500 mb-6">
          Jangan khawatir, pesanan kamu masih tersimpan. Kamu bisa coba bayar lagi atau hubungi kami jika butuh bantuan.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-70"
            style={{ backgroundColor: '#7FB300' }}
          >
            {retrying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengambil Link...
              </>
            ) : (
              'Coba Bayar Lagi'
            )}
          </button>

          <a
            href="mailto:orders@evcmercato.com"
            className="block w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hubungi Support
          </a>

          <Link
            href="/keranjang"
            className="block w-full py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Kembali ke Keranjang
          </Link>
        </div>
      </div>
    </div>
  )
}
