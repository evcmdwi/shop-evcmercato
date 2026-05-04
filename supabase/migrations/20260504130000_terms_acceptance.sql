-- Audit trail terms acceptance di users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Audit trail terms acceptance di orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Indexes untuk audit query
CREATE INDEX IF NOT EXISTS idx_users_terms_version ON users(terms_version) WHERE terms_version IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_terms_version ON orders(terms_version) WHERE terms_version IS NOT NULL;
