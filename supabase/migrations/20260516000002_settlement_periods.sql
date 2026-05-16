CREATE TABLE IF NOT EXISTS settlement_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label VARCHAR(100) NOT NULL,
  period_type CHAR(1) NOT NULL CHECK (period_type IN ('A', 'B')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  settlement_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settlement_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES settlement_periods(id),
  affiliate_id UUID REFERENCES affiliates(id),
  total_valid_pv INTEGER NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed')),
  processed_at TIMESTAMPTZ,
  processed_by_admin_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_id, affiliate_id)
);

ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS settled_in_period_id UUID REFERENCES settlement_periods(id),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- RLS
ALTER TABLE settlement_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_processing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_sp" ON settlement_periods FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin','admin_evc')));

CREATE POLICY "admin_all_spr" ON settlement_processing FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin','admin_evc')));

CREATE POLICY "affiliate_read_own_spr" ON settlement_processing FOR SELECT
  USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Seed: create previous period (Apr 27 - May 14, settled May 15)
INSERT INTO settlement_periods (period_label, period_type, period_start, period_end, settlement_date) VALUES
  ('Periode A: 27 Apr - 14 Mei 2026', 'A', '2026-04-27T00:00:00Z', '2026-05-14T23:59:59Z', '2026-05-15')
ON CONFLICT DO NOTHING;
