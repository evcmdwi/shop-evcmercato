-- Perbaikan credit_order_points(): kolom users.tier bertipe enum user_tier, sedangkan
-- CASE menghasilkan text → setiap kredit poin gagal ("column tier is of type user_tier but
-- expression is of type text") sejak 18 Okt malam. Cukup tambah ::user_tier.

CREATE OR REPLACE FUNCTION public.credit_order_points(
  p_order_id uuid,
  p_points integer,
  p_extra integer DEFAULT 0,
  p_extra_note text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_credited boolean;
  v_balance integer;
BEGIN
  SELECT user_id, coalesce(points_credited, false) INTO v_user, v_credited
  FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order % not found', p_order_id; END IF;
  IF v_credited THEN RETURN NULL; END IF;

  v_balance := NULL;
  IF coalesce(p_points, 0) > 0 THEN
    UPDATE users SET total_points = coalesce(total_points, 0) + p_points
    WHERE id = v_user RETURNING total_points INTO v_balance;
    INSERT INTO point_transactions (user_id, type, amount, balance_after, related_order_id, notes)
    VALUES (v_user, 'earned', p_points, v_balance, p_order_id,
            'Pembelian Order #' || upper(left(p_order_id::text, 8)));
    -- Tier dari saldo setelah poin pembelian (tanpa Extra Point), sama seperti sebelumnya.
    UPDATE users SET tier = CASE WHEN v_balance >= 3001 THEN 'platinum'
                                 WHEN v_balance >= 1001 THEN 'gold' ELSE 'silver' END::user_tier
    WHERE id = v_user;
  END IF;

  IF coalesce(p_extra, 0) > 0 THEN
    UPDATE users SET total_points = coalesce(total_points, 0) + p_extra
    WHERE id = v_user RETURNING total_points INTO v_balance;
    INSERT INTO point_transactions (user_id, type, amount, balance_after, related_order_id, notes)
    VALUES (v_user, 'bonus', p_extra, v_balance, p_order_id, coalesce(p_extra_note, 'Extra Point Khusus'));
  END IF;

  UPDATE orders SET points_credited = true WHERE id = p_order_id;
  IF v_balance IS NULL THEN
    SELECT coalesce(total_points, 0) INTO v_balance FROM users WHERE id = v_user;
  END IF;
  RETURN v_balance;
END;
$$;
