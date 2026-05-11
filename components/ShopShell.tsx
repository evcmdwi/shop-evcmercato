'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import PromoBanner from './PromoBanner'

export default function ShopShell() {
  const pathname = usePathname()
  // Jangan render shop nav/banner di marketing landing pages
  if (pathname.startsWith('/lp/') || pathname === '/') return null
  return (
    <>
      <PromoBanner />
      <Navbar />
    </>
  )
}
