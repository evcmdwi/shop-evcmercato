-- Fix (2026-11-07): batal/expired harus mengembalikan stok ke tempat yang sama
-- dengan saat dipotong. Checkout & buat-pesanan memotong product_variants.stock
-- bila item ber-varian, products.stock bila tidak — tapi trigger lama selalu
-- menambah products.stock, sehingga stok varian tak pernah kembali.
CREATE OR REPLACE FUNCTION public.release_stock_on_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status IN ('cancelled', 'expired')
     AND OLD.status NOT IN ('cancelled', 'expired')
     AND coalesce(NEW.order_type, 'purchase') <> 'redeem' THEN
    UPDATE product_variants v
    SET stock = v.stock + s.qty
    FROM (SELECT variant_id, sum(quantity) qty FROM order_items
          WHERE order_id = NEW.id AND variant_id IS NOT NULL GROUP BY variant_id) s
    WHERE v.id = s.variant_id;

    UPDATE products p
    SET stock = p.stock + s.qty
    FROM (SELECT product_id, sum(quantity) qty FROM order_items
          WHERE order_id = NEW.id AND variant_id IS NULL GROUP BY product_id) s
    WHERE p.id = s.product_id;
  END IF;
  RETURN NEW;
END;
$function$;
