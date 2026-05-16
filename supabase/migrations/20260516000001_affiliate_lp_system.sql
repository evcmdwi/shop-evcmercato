-- ============================================================
-- Affiliate LP Template System — Day 1 Migration
-- 2026-05-16
-- Idempotent: safe to re-run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLE: landing_pages
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landing_pages (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     VARCHAR(100) UNIQUE NOT NULL,
  title                    VARCHAR(255) NOT NULL,
  description              TEXT,
  preview_image_url        TEXT,
  target_audience          VARCHAR(255),
  status                   VARCHAR(20) NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'ads_only', 'affiliate_active', 'archived')),
  conversion_benchmark_pct DECIMAL(5,2),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  approved_for_affiliate_at TIMESTAMPTZ,
  approved_by_admin_id     UUID REFERENCES users(id),
  archived_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug   ON landing_pages(slug);

-- Seed: 2 starter templates
INSERT INTO landing_pages (slug, title, description, status) VALUES
  ('natesh-wanita-aktif', 'Natesh Wanita Aktif',     'Landing page untuk wanita aktif usia produktif 20-45 tahun.', 'ads_only'),
  ('evc-resmi',           'EVC Resmi (Trust Page)',   'Halaman trust building, cocok untuk cold audience yang baru kenal brand.', 'ads_only')
ON CONFLICT (slug) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. EXTEND short_links — add landing_page type + FK column
-- ────────────────────────────────────────────────────────────
-- Drop old CHECK constraint (name may vary; try both common names)
ALTER TABLE short_links DROP CONSTRAINT IF EXISTS short_links_link_type_check;

-- Add new CHECK that includes 'landing_page'
ALTER TABLE short_links
  ADD CONSTRAINT short_links_link_type_check
  CHECK (link_type IN ('homepage', 'product', 'category', 'landing_page'));

-- Add FK column to landing_pages
ALTER TABLE short_links
  ADD COLUMN IF NOT EXISTS landing_page_id UUID REFERENCES landing_pages(id);

-- Unique: 1 affiliate × 1 LP = 1 active short link
CREATE UNIQUE INDEX IF NOT EXISTS idx_short_links_affiliate_lp
  ON short_links(affiliate_id, landing_page_id)
  WHERE link_type = 'landing_page' AND status = 'active';

-- ────────────────────────────────────────────────────────────
-- 3. TABLE: short_link_clicks
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS short_link_clicks (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id              UUID NOT NULL REFERENCES short_links(id),
  clicked_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash                    VARCHAR(64),
  user_agent                 TEXT,
  referrer                   TEXT,
  country                    VARCHAR(2),
  visitor_session_id         VARCHAR(64),
  resulted_in_register_user_id UUID REFERENCES users(id),
  resulted_in_order_id       UUID REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_slc_short_link  ON short_link_clicks(short_link_id);
CREATE INDEX IF NOT EXISTS idx_slc_clicked_at  ON short_link_clicks(clicked_at);

-- ────────────────────────────────────────────────────────────
-- 4. TABLE: landing_page_daily_stats
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landing_page_daily_stats (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id   UUID NOT NULL REFERENCES affiliates(id),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id),
  date           DATE NOT NULL,
  click_count    INTEGER DEFAULT 0,
  signup_count   INTEGER DEFAULT 0,
  order_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(affiliate_id, landing_page_id, date)
);

CREATE INDEX IF NOT EXISTS idx_lp_daily_stats
  ON landing_page_daily_stats(affiliate_id, date DESC);

-- ────────────────────────────────────────────────────────────
-- 5. RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE landing_pages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_link_clicks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_daily_stats ENABLE ROW LEVEL SECURITY;

-- landing_pages policies
DROP POLICY IF EXISTS "public_read_active_lp" ON landing_pages;
CREATE POLICY "public_read_active_lp" ON landing_pages
  FOR SELECT USING (status = 'affiliate_active');

DROP POLICY IF EXISTS "admin_all_lp" ON landing_pages;
CREATE POLICY "admin_all_lp" ON landing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin_evc')
    )
  );

-- landing_page_daily_stats policies
DROP POLICY IF EXISTS "admin_all_stats" ON landing_page_daily_stats;
CREATE POLICY "admin_all_stats" ON landing_page_daily_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin_evc')
    )
  );

DROP POLICY IF EXISTS "affiliate_read_own_stats" ON landing_page_daily_stats;
CREATE POLICY "affiliate_read_own_stats" ON landing_page_daily_stats
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- short_link_clicks policies
DROP POLICY IF EXISTS "admin_slc" ON short_link_clicks;
CREATE POLICY "admin_slc" ON short_link_clicks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin_evc')
    )
  );
