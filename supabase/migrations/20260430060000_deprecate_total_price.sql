-- Migration: deprecate redundant total_price column
-- total_price (legacy, numeric NOT NULL) and total_amount (new, integer NOT NULL default 0) are redundant.
-- Fix: add DEFAULT 0 so existing INSERT statements that omit total_price won't violate NOT NULL.
-- Actual column removal deferred to Sub-PR G for backward compat.

ALTER TABLE orders ALTER COLUMN total_price SET DEFAULT 0;

-- Backfill: sync total_price for any existing rows where it is NULL or 0
UPDATE orders SET total_price = total_amount WHERE total_price IS NULL OR total_price = 0;
