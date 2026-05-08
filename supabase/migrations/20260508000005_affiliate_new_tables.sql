-- ═══════════════════════════════════════════════════════════════════
-- AFFILIATE PROGRAM — Step 5: Create all new affiliate tables
-- Order: affiliates → affiliate_channels → short_links → referral_clicks
--        → settlements → commissions → commission_line_items
--        → settlement_details → notifications → kki_conversions
-- NOTE: commissions table has FK to orders (already exists)
-- NOTE: commission_id FK on orders added in step 006
-- Date: 8 Mei 2026
-- ═══════════════════════════════════════════════════════════════════

-- 2A. affiliates
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE,

  -- KKI Info
  full_name_kkd TEXT NOT NULL,
  kki_member_id TEXT NOT NULL,
  director_leader TEXT NOT NULL,

  -- Contact
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'terminated')),
  rejected_reason TEXT NULL,
  suspended_reason TEXT NULL,
  suspended_at TIMESTAMPTZ NULL,

  -- Lifecycle
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ NULL,
  approved_by_user_id UUID NULL REFERENCES auth.users(id),

  -- Privacy
  show_in_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,

  -- Denormalized metrics
  lifetime_pv BIGINT NOT NULL DEFAULT 0,
  lifetime_orders INT NOT NULL DEFAULT 0,
  lifetime_members INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);

-- 2B. affiliate_channels
CREATE TABLE IF NOT EXISTS affiliate_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  platform TEXT NOT NULL
    CHECK (platform IN ('instagram','tiktok','facebook','whatsapp_status','youtube','telegram','website','other')),
  link_or_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_channels_affiliate ON affiliate_channels(affiliate_id);

-- 2C. short_links
CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT NOT NULL UNIQUE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL
    CHECK (link_type IN ('homepage', 'product', 'category')),
  target_id UUID NULL,
  target_url TEXT NOT NULL,

  click_count INT NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ NULL,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_affiliate ON short_links(affiliate_id);

-- 2D. referral_clicks (TANPA FK ke orders dulu — ditambah di step 006)
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id UUID NOT NULL REFERENCES short_links(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,

  ip_address TEXT,
  user_agent TEXT,
  fingerprint_hash TEXT,
  session_id TEXT,

  converted_to_user_id UUID NULL REFERENCES auth.users(id),
  converted_to_order_id UUID NULL,  -- FK ditambah di step 006

  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_fingerprint ON referral_clicks(fingerprint_hash, clicked_at);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_time ON referral_clicks(clicked_at);

-- 2E. settlements
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  settlement_date DATE NOT NULL,

  total_affiliates INT NOT NULL DEFAULT 0,
  total_orders INT NOT NULL DEFAULT 0,
  total_pv BIGINT NOT NULL DEFAULT 0,

  excel_path TEXT NULL,
  csv_path TEXT NULL,

  status TEXT NOT NULL DEFAULT 'preview'
    CHECK (status IN ('preview', 'finalized')),
  generated_by_user_id UUID NULL REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);

-- 2F. commissions
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  affiliate_code TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  order_total NUMERIC(15,2) NOT NULL,
  pv_earned BIGINT NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'valid', 'settled', 'voided', 'owed_back')),

  order_delivered_at TIMESTAMPTZ NULL,
  valid_at TIMESTAMPTZ NULL,
  settled_at TIMESTAMPTZ NULL,
  settlement_id UUID NULL REFERENCES settlements(id),

  voided_reason TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_status ON commissions(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_status_valid ON commissions(status, valid_at);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);

-- 2G. commission_line_items
CREATE TABLE IF NOT EXISTS commission_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  product_variant_id UUID NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INT NOT NULL,
  pv_per_unit BIGINT NOT NULL DEFAULT 0,
  total_pv BIGINT NOT NULL DEFAULT 0
);

-- 2H. settlement_details
CREATE TABLE IF NOT EXISTS settlement_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  affiliate_code TEXT NOT NULL,
  affiliate_name TEXT NOT NULL,
  kki_member_id TEXT NOT NULL,

  total_orders INT NOT NULL DEFAULT 0,
  total_pv BIGINT NOT NULL DEFAULT 0,
  owed_back_pv BIGINT NOT NULL DEFAULT 0,
  net_pv BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_settlement_details_settlement ON settlement_details(settlement_id);

-- 2I. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,

  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NULL,

  channels_sent JSONB NULL,

  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);

-- 2J. kki_conversions
CREATE TABLE IF NOT EXISTS kki_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  kki_member_id TEXT NOT NULL,
  sponsor_affiliate_code TEXT,
  conversion_date DATE NOT NULL,
  recorded_by_user_id UUID NULL REFERENCES auth.users(id),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kki_conversions_user ON kki_conversions(user_id);
