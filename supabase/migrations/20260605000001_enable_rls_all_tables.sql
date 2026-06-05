-- Enable RLS on all public tables that were missing it
-- This resolves Supabase security advisor warning: rls_disabled_in_public
-- All these tables are admin-only or read-only reference data.
-- Service role (server-side) bypasses RLS, so existing app functionality is not affected.

ALTER TABLE IF EXISTS admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS affiliate_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bpom_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commission_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kki_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_redemption_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS regencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settlement_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS short_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_extra_point_promos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read wilayah reference data (needed for address form)
CREATE POLICY IF NOT EXISTS "Allow authenticated read districts" ON districts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated read regencies" ON regencies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated read provinces" ON provinces
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read shipping_rates (needed for checkout)
CREATE POLICY IF NOT EXISTS "Allow authenticated read shipping_rates" ON shipping_rates
  FOR SELECT TO authenticated USING (is_active = true);

-- Allow anon read of shipping_rates (needed for checkout page before login)
CREATE POLICY IF NOT EXISTS "Allow anon read shipping_rates" ON shipping_rates
  FOR SELECT TO anon USING (is_active = true);

-- Allow anon read of wilayah data (needed for address form / checkout)
CREATE POLICY IF NOT EXISTS "Allow anon read districts" ON districts
  FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Allow anon read regencies" ON regencies
  FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Allow anon read provinces" ON provinces
  FOR SELECT TO anon USING (true);
