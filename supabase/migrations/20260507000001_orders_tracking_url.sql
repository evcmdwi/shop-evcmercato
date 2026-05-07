-- Migration: Add tracking_url column to orders
-- MANUAL APPLY NEEDED via Supabase SQL Editor if auto-apply fails

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
