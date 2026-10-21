-- Login Sambers pakai username + password (permintaan Dwi 21 Okt 2026).
-- Supabase Auth tetap butuh email: tiap username dipetakan ke satu akun auth.users.
-- Akun di tabel ini otomatis admin (selain daftar env ADMIN_EMAIL lama).
-- admin_code mengikat login ke kode admin (NN/MA/DC) → FU & pesanan tercatat atas nama
-- yang login; is_owner boleh memilih kode lain.
-- Akun & password-nya TIDAK dibuat di sini (password jangan masuk git) — lihat SQL terpisah.

CREATE TABLE IF NOT EXISTS public.admin_accounts (
  username text PRIMARY KEY CHECK (username ~ '^[a-z0-9._]{3,30}$'),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_code text REFERENCES public.admin_codes(code) ON UPDATE CASCADE,
  is_owner boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY; -- hanya service role
