-- Add combined_with_order_id to orders table
-- This allows a redeem order to be flagged as "ship together" with an existing paid/processed order
-- When set, shipping_cost and service_fee are 0

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS combined_with_order_id UUID REFERENCES orders(id);

COMMENT ON COLUMN orders.combined_with_order_id IS 
  'If set, this redeem order will be shipped together with the referenced order (ongkir = 0, admin fee = 0)';
