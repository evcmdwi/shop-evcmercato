-- Migration: user_extra_point_promos
-- Extra Point Khusus: user-specific point multiplier promo
-- Applied: 2026-05-05

CREATE TABLE IF NOT EXISTS user_extra_point_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  multiplier NUMERIC(4,2) NOT NULL CHECK (multiplier > 1),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_extra_point_promos_user_id ON user_extra_point_promos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_extra_point_promos_active ON user_extra_point_promos(user_id, is_active, starts_at, ends_at);
