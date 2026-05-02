-- Tambah nilai baru ke status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processed';

-- Tambah kolom baru ke orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_courier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_note TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
