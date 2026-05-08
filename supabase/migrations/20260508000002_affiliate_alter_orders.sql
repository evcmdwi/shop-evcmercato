-- ═══════════════════════════════════════════════════════════════════
-- AFFILIATE PROGRAM — Step 2: ALTER orders table
-- NOTE: commission_id FK akan ditambah di file 006 setelah commissions table ada
-- Date: 8 Mei 2026
-- ═══════════════════════════════════════════════════════════════════

-- 1B. orders: tambah affiliate attribution (TANPA FK ke commissions dulu)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS attributed_affiliate_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS commission_id UUID NULL;
-- NOTE: commission_id FK constraint ditambah di 20260508000006_affiliate_fks_and_rls.sql
