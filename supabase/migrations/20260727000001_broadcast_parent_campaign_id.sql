-- Add parent_campaign_id to broadcast_campaigns
-- Purpose: link batch campaigns to their parent so "50 Berikutnya" can exclude
--          all leads across the entire campaign group (parent + all children).

ALTER TABLE broadcast_campaigns
  ADD COLUMN IF NOT EXISTS parent_campaign_id UUID REFERENCES broadcast_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_parent_id
  ON broadcast_campaigns(parent_campaign_id);
