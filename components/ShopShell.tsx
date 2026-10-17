'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ShopShell() {
  const pathname = usePathname()
  // Jangan render shop nav di marketing landing pages
  if (pathname.startsWith('/lp/')) return null
  return <Navbar />
}
