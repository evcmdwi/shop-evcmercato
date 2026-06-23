-- Add source column to leads table
-- Required by import-xlsx route: source = 'import'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;

COMMENT ON COLUMN leads.source IS 'Origin of lead: import, manual, form, etc.';
