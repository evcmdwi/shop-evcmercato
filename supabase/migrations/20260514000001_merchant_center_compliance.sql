-- Add missing columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS mpn TEXT,
  ADD COLUMN IF NOT EXISTS identifier_exists BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS google_product_category_id INTEGER,
  ADD COLUMN IF NOT EXISTS google_product_category_path TEXT,
  ADD COLUMN IF NOT EXISTS product_type TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS age_group TEXT DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'unisex',
  ADD COLUMN IF NOT EXISTS shipping_weight_grams INTEGER;

-- Table: product_certifications
CREATE TABLE IF NOT EXISTS product_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  authority TEXT NOT NULL,
  cert_name TEXT NOT NULL,
  cert_code TEXT NOT NULL,
  expired_date DATE,
  document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, authority, cert_code)
);
CREATE INDEX IF NOT EXISTS idx_cert_product ON product_certifications(product_id);

-- Table: bpom_registrations
CREATE TABLE IF NOT EXISTS bpom_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  bpom_number TEXT UNIQUE NOT NULL,
  registered_name TEXT NOT NULL,
  category TEXT,
  expired_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bpom_product ON bpom_registrations(product_id);

-- Seed Vitayang Pureway C Booster
UPDATE products SET
  gtin = '8997007430959',
  identifier_exists = true,
  google_product_category_id = 2880,
  google_product_category_path = 'Health & Beauty > Health Care > Nutrition & Wellness',
  product_type = 'Suplemen > Vitamin > Vitamin C',
  material = 'Vitamin C 500mg (Pureway-C + Sodium Ascorbate), Zinc Picolinate 5mg, Vitamin D3 200 IU, Vitamin E 5mg, Selenium Selenite 11mcg, Ekstrak Citrus aurantium 50mg'
WHERE sku = 'EVC-7D35A75E';

-- Seed certifications for Vitayang Pureway C
INSERT INTO product_certifications (product_id, authority, cert_name, cert_code, is_verified)
SELECT id, 'BPOM', 'Suplemen Kesehatan', 'SD245055771', false
FROM products WHERE sku = 'EVC-7D35A75E'
ON CONFLICT DO NOTHING;

INSERT INTO product_certifications (product_id, authority, cert_name, cert_code, is_verified)
SELECT id, 'LPPOM MUI', 'Halal', 'ID041000006880121', false
FROM products WHERE sku = 'EVC-7D35A75E'
ON CONFLICT DO NOTHING;

-- BPOM registration
INSERT INTO bpom_registrations (product_id, bpom_number, registered_name, category)
SELECT id, 'SD245055771', 'Vitayang Pureway C Booster', 'Suplemen Kesehatan'
FROM products WHERE sku = 'EVC-7D35A75E'
ON CONFLICT DO NOTHING;
