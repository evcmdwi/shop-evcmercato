-- Migration: Add Google Merchant Center fields to products table
-- Date: 2026-05-06
-- Author: Benji (WEBO Sub-agent)
-- Apply: MANUAL via Supabase SQL Editor (do NOT use supabase db push)

-- Add SKU field
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Generate SKU untuk produk existing
-- Format: EVC-{8 char uppercase dari UUID}
UPDATE products
SET sku = 'EVC-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE sku IS NULL;

-- Unique constraint untuk SKU
ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS products_sku_unique UNIQUE (sku);

-- Optional: GTIN (untuk produk KKI yang punya barcode)
ALTER TABLE products ADD COLUMN IF NOT EXISTS gtin TEXT;

-- Optional: Google product category override per produk
ALTER TABLE products ADD COLUMN IF NOT EXISTS google_category TEXT;
