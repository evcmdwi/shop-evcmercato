-- Leads Database untuk admin EVC Mercato
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  phone TEXT NOT NULL,
  kota TEXT,
  alamat TEXT,
  interest TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, interested, converted, not_interested
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads(phone);
CREATE INDEX IF NOT EXISTS leads_kota_idx ON leads(kota);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Admin-only via service role; no public access needed
