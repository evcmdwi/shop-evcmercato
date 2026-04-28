-- ============================================================
-- EVC Mercato Shop — Initial Schema Migration
-- Created: 2026-04-29
-- Branch: feature/db-schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE points_type AS ENUM ('earn', 'redeem');
CREATE TYPE redemption_status AS ENUM ('pending', 'fulfilled');
CREATE TYPE user_tier AS ENUM ('silver', 'gold', 'platinum');

-- ============================================================
-- TABLE: categories
-- ============================================================

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories (slug);

-- ============================================================
-- TABLE: products
-- ============================================================

CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
  category_id  UUID REFERENCES categories (id) ON DELETE SET NULL,
  image_url    TEXT,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_is_active   ON products (is_active);

-- ============================================================
-- TABLE: users
-- Extends Supabase Auth (auth.users) via same UUID
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  phone         TEXT,
  address       TEXT,
  tier          user_tier NOT NULL DEFAULT 'silver',
  total_points  INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tier          ON users (tier);
CREATE INDEX idx_users_total_points  ON users (total_points);

-- ============================================================
-- TABLE: orders
-- ============================================================

CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  total_price   NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
  points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  status        order_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id   ON orders (user_id);
CREATE INDEX idx_orders_status    ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: order_items
-- ============================================================

CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(15, 2) NOT NULL CHECK (price_per_unit >= 0)
);

CREATE INDEX idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

-- ============================================================
-- TABLE: evc_points_ledger
-- Audit trail for all earn/redeem events
-- ============================================================

CREATE TABLE evc_points_ledger (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,          -- positive = earn, negative = redeem
  type        points_type NOT NULL,
  description TEXT,
  order_id    UUID REFERENCES orders (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_user_id   ON evc_points_ledger (user_id);
CREATE INDEX idx_ledger_order_id  ON evc_points_ledger (order_id);
CREATE INDEX idx_ledger_type      ON evc_points_ledger (type);
CREATE INDEX idx_ledger_created_at ON evc_points_ledger (created_at DESC);

-- ============================================================
-- TABLE: evc_redemptions
-- Records product redemption via EVC Points
-- ============================================================

CREATE TABLE evc_redemptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  product_id  UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  status      redemption_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user_id    ON evc_redemptions (user_id);
CREATE INDEX idx_redemptions_product_id ON evc_redemptions (product_id);
CREATE INDEX idx_redemptions_status     ON evc_redemptions (status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- categories — public read, no write from client
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (true);

-- products — public read active products, no write from client
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

-- users — user can only read/update own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_read" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_update" ON users
  FOR UPDATE USING (auth.uid() = id);

-- orders — user can read own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_own_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- order_items — user can read own order items (via orders join)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_own_read" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "order_items_own_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- evc_points_ledger — user can only read own ledger (write via server-side only)
ALTER TABLE evc_points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger_own_read" ON evc_points_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- evc_redemptions — user can read/insert own redemptions
ALTER TABLE evc_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions_own_read" ON evc_redemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "redemptions_own_insert" ON evc_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- COMMENTS (documentation)
-- ============================================================

COMMENT ON TABLE categories         IS 'Product categories for KKI product catalog';
COMMENT ON TABLE products           IS 'KKI products available for purchase or EVC Points redemption';
COMMENT ON TABLE users              IS 'Customer profiles extending Supabase Auth users';
COMMENT ON TABLE orders             IS 'Customer purchase orders';
COMMENT ON TABLE order_items        IS 'Line items within each order';
COMMENT ON TABLE evc_points_ledger  IS 'Full audit ledger for EVC Points earn/redeem events. Tier multipliers: Gold 1.02x, Platinum 1.03x. Points expire after 12 months of inactivity.';
COMMENT ON TABLE evc_redemptions    IS 'Records of free product redemptions using EVC Points (NOT discounts)';

COMMENT ON COLUMN users.tier         IS 'Silver: 0–4999 pts | Gold: 5000–19999 pts | Platinum: 20000+ pts';
COMMENT ON COLUMN users.total_points IS 'Denormalized running total; recalculate from evc_points_ledger as source of truth';
COMMENT ON COLUMN evc_points_ledger.points IS 'Positive for earn, negative for redeem';
