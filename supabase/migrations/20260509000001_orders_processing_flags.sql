-- Sprint 2: Background worker processing flags
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS notifications_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS points_credited BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS commission_created BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for cron worker query (only scans paid orders with pending work)
CREATE INDEX IF NOT EXISTS idx_orders_paid_unprocessed
  ON orders(status, notifications_sent, points_credited, commission_created)
  WHERE status = 'paid';
