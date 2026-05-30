CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent' | 'failed'
  error_detail TEXT
);

CREATE INDEX IF NOT EXISTS admin_messages_user_id_idx ON admin_messages(user_id);
CREATE INDEX IF NOT EXISTS admin_messages_sent_at_idx ON admin_messages(sent_at DESC);
