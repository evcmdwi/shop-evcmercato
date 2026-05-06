-- Migration: Add 'expired' value to order_status enum
-- Context: Xendit payment links expire after a set period.
--          Orders with expired payment links need to transition to 'expired' status
--          so stock can be released automatically via trigger (migration 20260506000002).
--
-- IMPORTANT: ALTER TYPE ADD VALUE cannot run inside a transaction block.
-- When applying manually via Supabase SQL Editor, run this statement standalone.

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired';
