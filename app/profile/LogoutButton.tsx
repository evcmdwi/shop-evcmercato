'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-4 w-full py-3 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
    >
      Keluar
    </button>
  )
}
