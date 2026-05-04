import type { ReactNode } from 'react'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo-evcmercato.jpg"
              alt="EVC Mercato"
              width={64}
              height={64}
              className="rounded-full shadow-lg"
            />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            EVC Mercato
          </h1>
          <p className="text-slate-400 text-sm mt-1">shop.evcmercato.com</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
