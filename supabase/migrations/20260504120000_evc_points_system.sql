-- EVC Points System Migration
-- Task #30 Wave 1 — Run this SQL manually in Supabase SQL Editor

-- Tabel promo redeem
CREATE TABLE IF NOT EXISTS point_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  active_from TIMESTAMPTZ DEFAULT NOW(),
  active_until TIMESTAMPTZ NULL,
  redeem_stock INTEGER NOT NULL DEFAULT 0 CHECK (redeem_stock >= 0),
  redeemed_count INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_count >= 0),
  max_per_user INTEGER NOT NULL DEFAULT 1 CHECK (max_per_user > 0),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_redemptions_active ON point_redemptions(is_active, active_until);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_featured ON point_redemptions(is_featured) WHERE is_featured = TRUE;

-- Global config
CREATE TABLE IF NOT EXISTS point_redemption_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  shipping_cost INTEGER NOT NULL DEFAULT 10000,
  admin_fee INTEGER NOT NULL DEFAULT 3000,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  CHECK (id = 1)
);

INSERT INTO point_redemption_config (id, shipping_cost, admin_fee)
  VALUES (1, 10000, 3000)
  ON CONFLICT (id) DO NOTHING;

-- Audit log point transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted', 'refunded')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_redemption_id UUID REFERENCES point_redemptions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);

-- Extend orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'purchase' CHECK (order_type IN ('purchase', 'redeem')),
  ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redemption_id UUID REFERENCES point_redemptions(id);

CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);

-- Backfill existing orders sebagai 'purchase'
UPDATE orders SET order_type = 'purchase' WHERE order_type IS NULL OR order_type = '';
