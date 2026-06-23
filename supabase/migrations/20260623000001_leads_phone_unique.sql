-- Add UNIQUE constraint on phone in leads table (required for dedup on import)
-- Run this only if constraint doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_phone_key' AND conrelid = 'leads'::regclass
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_phone_key UNIQUE (phone);
  END IF;
END;
$$;
