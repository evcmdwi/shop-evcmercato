-- Migration: Stock release trigger on order status change
-- Context: When an order transitions to 'cancelled' or 'expired', reserved stock
--          must be returned to the product inventory.
--          This trigger fires after UPDATE OF status on the orders table.
--
-- Depends on: 20260506000001_add_expired_order_status.sql (must apply first)

-- Function: release_stock_on_status_change
-- Restores stock for all order items when order moves to cancelled/expired.
CREATE OR REPLACE FUNCTION release_stock_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'expired')
     AND OLD.status NOT IN ('cancelled', 'expired') THEN
    UPDATE products p
    SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: orders_release_stock
-- Fires AFTER UPDATE OF status on orders, once per row.
DROP TRIGGER IF EXISTS orders_release_stock ON orders;
CREATE TRIGGER orders_release_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION release_stock_on_status_change();
