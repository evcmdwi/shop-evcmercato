'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PromoBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem('promo-banner-dismissed')
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('promo-banner-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-gradient-to-r from-[#7FB300] to-[#5B8400] text-white py-2.5 px-4 text-center relative text-sm">
      <span className="mr-2">🎉 PROMO LAUNCH MEI: Bonus 100 EVC Points untuk member baru!</span>
      <Link href="/register" className="font-bold underline hover:no-underline">Daftar sekarang →</Link>
      <button onClick={dismiss} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}
