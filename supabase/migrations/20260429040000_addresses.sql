-- Table addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  postal_code VARCHAR(10),
  full_address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- Hanya 1 alamat default per user
CREATE UNIQUE INDEX idx_addresses_one_default_per_user 
  ON addresses(user_id) WHERE is_default = true;

-- RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_own_read" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addresses_own_insert" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_own_update" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addresses_own_delete" ON addresses FOR DELETE USING (auth.uid() = user_id);
