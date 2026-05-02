'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface UserProfile {
  name: string | null
  total_points: number
  tier: string
}

export default function UserHeaderWidget() {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUser(user as { email: string; id: string })

      // Fetch profile dari public.users
      supabase
        .from('users')
        .select('name, total_points, tier')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data as UserProfile)
        })
    })

    // Listen auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) return null

  // Avatar: initial dari nama atau email
  const displayName = profile?.name || user.email?.split('@')[0] || 'U'
  const initial = displayName.charAt(0).toUpperCase()
  const points = profile?.total_points ?? 0

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 hover:bg-[#EEEDFE] rounded-lg px-2 py-1.5 transition-colors min-h-[44px]"
    >
      {/* Avatar circle */}
      <div className="w-8 h-8 rounded-full bg-[#534AB7] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {initial}
      </div>

      {/* Name + points — hidden on very small screens */}
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
          {displayName.split(' ').slice(0, 2).join(' ')}
        </span>
        <span className="text-xs text-[#534AB7]">⭐ {points} pt</span>
      </div>

      {/* Points only on mobile (xs) */}
      <span className="sm:hidden text-xs text-[#534AB7] font-medium">
        {points} pt
      </span>
    </Link>
  )
}
