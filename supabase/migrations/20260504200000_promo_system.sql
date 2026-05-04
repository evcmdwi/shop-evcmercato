CREATE TABLE IF NOT EXISTS point_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_type TEXT NOT NULL CHECK (promo_type IN ('new_user', 'purchase_bonus', 'redeem')),
  title TEXT NOT NULL,
  description TEXT,

  -- New User promo
  bonus_points INTEGER, -- jumlah bonus untuk new user

  -- Purchase Bonus promo
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  points_multiplier NUMERIC(3,1), -- 2.0 = double, 3.0 = triple

  -- Shared
  active_from TIMESTAMPTZ DEFAULT NOW(),
  active_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_promos_type ON point_promos(promo_type, is_active);
CREATE INDEX IF NOT EXISTS idx_point_promos_active ON point_promos(is_active, active_until);
