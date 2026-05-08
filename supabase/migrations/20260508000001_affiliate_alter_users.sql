-- ═══════════════════════════════════════════════════════════════════
-- AFFILIATE PROGRAM — Step 1: ALTER users table
-- Date: 8 Mei 2026
-- ═══════════════════════════════════════════════════════════════════

-- 1A. users: tambah role, referral tracking
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin_evc', 'super_admin')),
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS converted_to_kki BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kki_member_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS kki_converted_at TIMESTAMPTZ NULL;

-- Set existing admin ke super_admin (ganti email jika berbeda)
UPDATE users SET role = 'super_admin'
WHERE email = 'fin.bisnisdwi@gmail.com';
