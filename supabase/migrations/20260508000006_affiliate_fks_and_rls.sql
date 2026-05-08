-- ═══════════════════════════════════════════════════════════════════
-- AFFILIATE PROGRAM — Step 6: Add deferred FKs + Enable RLS
-- Run AFTER step 005 (commissions table must exist)
-- Date: 8 Mei 2026
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- PART A: Add FKs that required tables to be created first
-- ───────────────────────────────────────────────────────────────────

-- FK orders.commission_id → commissions.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_orders_commission'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_commission
      FOREIGN KEY (commission_id) REFERENCES commissions(id);
  END IF;
END$$;

-- FK referral_clicks.converted_to_order_id → orders.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_referral_clicks_order'
      AND table_name = 'referral_clicks'
  ) THEN
    ALTER TABLE referral_clicks
      ADD CONSTRAINT fk_referral_clicks_order
      FOREIGN KEY (converted_to_order_id) REFERENCES orders(id);
  END IF;
END$$;

-- ───────────────────────────────────────────────────────────────────
-- PART B: Enable RLS
-- ───────────────────────────────────────────────────────────────────

-- affiliates: user hanya bisa lihat data sendiri
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS affiliates_self_read ON affiliates;
CREATE POLICY affiliates_self_read ON affiliates
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS affiliates_admin_all ON affiliates;
CREATE POLICY affiliates_admin_all ON affiliates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_evc', 'super_admin'))
  );

-- short_links: affiliate hanya bisa lihat miliknya
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS short_links_self ON short_links;
CREATE POLICY short_links_self ON short_links
  FOR ALL USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS short_links_admin ON short_links;
CREATE POLICY short_links_admin ON short_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_evc', 'super_admin'))
  );

-- commissions: affiliate hanya bisa SELECT miliknya
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commissions_self_read ON commissions;
CREATE POLICY commissions_self_read ON commissions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS commissions_admin_all ON commissions;
CREATE POLICY commissions_admin_all ON commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_evc', 'super_admin'))
  );

-- notifications: user hanya bisa lihat notif sendiri
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_self ON notifications;
CREATE POLICY notifications_self ON notifications
  FOR ALL USING (user_id = auth.uid());
