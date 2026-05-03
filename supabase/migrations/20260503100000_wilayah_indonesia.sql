-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Provinces
CREATE TABLE IF NOT EXISTS provinces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- Regencies
CREATE TABLE IF NOT EXISTS regencies (
  id TEXT PRIMARY KEY,
  province_id TEXT NOT NULL REFERENCES provinces(id),
  name TEXT NOT NULL,
  type TEXT
);

-- Districts
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  regency_id TEXT NOT NULL REFERENCES regencies(id),
  name TEXT NOT NULL
);

-- Indexes for autocomplete performance
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);
CREATE INDEX IF NOT EXISTS idx_districts_name_trgm ON districts USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_regencies_name_trgm ON regencies USING gin(name gin_trgm_ops);

-- Orders table: add shipping region columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_district_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_district_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_regency_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_regency_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_province_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_province_name TEXT;
