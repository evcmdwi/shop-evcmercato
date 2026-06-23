-- xlsx_sessions: temporary table to share parsed XLSX rows between serverless functions
-- (preview-columns Lambda → import-xlsx Lambda on Vercel)

CREATE TABLE IF NOT EXISTS xlsx_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rows JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- RLS: hanya service role yang bisa akses
ALTER TABLE xlsx_sessions ENABLE ROW LEVEL SECURITY;
-- Tidak ada policy publik → hanya service role key yang bisa insert/select/delete
