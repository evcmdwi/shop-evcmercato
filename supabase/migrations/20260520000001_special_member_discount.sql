-- Add special_discount_pct to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS special_discount_pct DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS special_discount_note TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS special_discount_set_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN users.special_discount_pct IS 'Special discount percentage for VIP members (e.g. 10.00 = 10%). NULL = no discount.';
