import { redirect } from 'next/navigation'

// Halaman lama; kebijakan yang berlaku ada di /privacy-policy (ditautkan footer & sitemap).
export default function PrivacyPage() {
  redirect('/privacy-policy')
}
