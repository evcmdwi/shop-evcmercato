# shop.evcmercato.com

E-commerce KKI products dengan EVC Points loyalty system.

## Stack
- Next.js 16 (App Router)
- Supabase (Database + Auth)
- Xendit (Payment)
- Tailwind CSS v4
- TypeScript

## Setup

1. Clone repo
2. `npm install`
3. Copy `.env.local.example` ke `.env.local` dan isi semua values
4. Jalankan SQL migrations di `supabase/migrations/` via Supabase Dashboard SQL Editor
5. `npm run dev`

## Environment Variables

| Variable | Required | Keterangan |
|----------|----------|-----------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | Supabase anon/public key |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | Service role key — untuk admin API routes (bypass RLS) |
| ADMIN_EMAIL | ✅ | Email admin, comma-separated. Server-side only |
| NEXT_PUBLIC_ADMIN_EMAIL | ✅ | Sama dengan ADMIN_EMAIL, untuk client-side redirect saat login |
| XENDIT_SECRET_KEY | Nanti | Xendit payment integration |
| ANTHROPIC_API_KEY | Nanti | AI live chat |
| NEXT_PUBLIC_APP_URL | ✅ | Base URL production |

## Migrations
Jalankan semua file di `supabase/migrations/` secara berurutan via Supabase Dashboard → SQL Editor.
