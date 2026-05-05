CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id TEXT NOT NULL UNIQUE REFERENCES districts(id),
  instan_rate INTEGER NOT NULL DEFAULT 0 CHECK (instan_rate >= 0),
  sameday_rate INTEGER NOT NULL DEFAULT 0 CHECK (sameday_rate >= 0),
  CONSTRAINT shipping_rates_at_least_one_available CHECK (instan_rate > 0 OR sameday_rate > 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_district ON shipping_rates(district_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(is_active) WHERE is_active = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_shipping_rates_updated_at ON shipping_rates;
CREATE TRIGGER set_shipping_rates_updated_at
  BEFORE UPDATE ON shipping_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders table: add shipping columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_base_rate INTEGER NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS shipping_discount INTEGER NOT NULL DEFAULT 0;

-- Update shipping_method check constraint to include instan and sameday
-- First check if column exists and drop old constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_method') THEN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_method_check;
    ALTER TABLE orders ALTER COLUMN shipping_method TYPE TEXT;
    ALTER TABLE orders ADD CONSTRAINT orders_shipping_method_check
      CHECK (shipping_method IN ('reguler', 'instan', 'sameday'));
  ELSE
    ALTER TABLE orders ADD COLUMN shipping_method TEXT NOT NULL DEFAULT 'reguler'
      CHECK (shipping_method IN ('reguler', 'instan', 'sameday'));
  END IF;
END $$;
