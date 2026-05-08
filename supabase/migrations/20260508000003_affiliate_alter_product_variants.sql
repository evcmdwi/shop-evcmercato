-- ═══════════════════════════════════════════════════════════════════
-- AFFILIATE PROGRAM — Step 3: ALTER product_variants table
-- Date: 8 Mei 2026
-- ═══════════════════════════════════════════════════════════════════

-- 1C. product_variants: tambah PV affiliate + is_default flag
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS affiliate_pv_value BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pv_updated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
