'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import UserHeaderWidget from './UserHeaderWidget'

export default function AuthNavButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (isLoggedIn === null) return <div className="w-20 h-10" /> // skeleton placeholder

  if (isLoggedIn) return <UserHeaderWidget />

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="text-sm text-gray-600 hover:text-[#7FB300] px-3 py-2.5">
        Masuk
      </Link>
      <Link href="/register" className="text-sm bg-[#7FB300] text-white px-4 py-2.5 rounded-lg hover:bg-[#4338a0]">
        Daftar
      </Link>
    </div>
  )
}
