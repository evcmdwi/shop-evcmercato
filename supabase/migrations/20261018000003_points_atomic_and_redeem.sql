-- EVC Points: penambahan/pengurangan saldo atomik + alur tukar poin.
-- 1) Jenis transaksi 'bonus' (Extra Point khusus member) diizinkan.
-- 2) credit_order_points(): kredit poin pesanan sekali saja (kunci baris pesanan), saldo
--    ditambah langsung di database (bukan baca-lalu-tulis dari server).
-- 3) reserve_redemption_points() / refund_redemption_points(): poin dipotong saat checkout
--    tukar poin, dikembalikan bila pembayaran kedaluwarsa/gagal/dibatalkan.
-- 4) Trigger pengembali stok melewati pesanan tukar poin (stok produk tidak dikurangi saat
--    penukaran, jadi tidak boleh ditambah saat kedaluwarsa).

ALTER TABLE public.point_transactions DROP CONSTRAINT IF EXISTS point_transactions_type_check;
ALTER TABLE public.point_transactions ADD CONSTRAINT point_transactions_type_check
  CHECK (type IN ('earned', 'bonus', 'redeemed', 'expired', 'adjusted', 'refunded'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS points_redeemed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points_refunded boolean NOT NULL DEFAULT false;

-- ── Kredit poin pesanan pembelian ─────────────────────────────────────────
-- p_points = poin dasar × promo produk (masuk tier); p_extra = Extra Point khusus member.
-- Mengembalikan saldo baru, atau NULL bila pesanan sudah pernah dikredit.
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
                                 WHEN v_balance >= 1001 THEN 'gold' ELSE 'silver' END
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

-- ── Tukar poin: potong saat checkout ──────────────────────────────────────
-- Mengunci hadiah & saldo; gagal (EXCEPTION) bila poin kurang, stok hadiah habis,
-- atau batas per member terlampaui. Mengembalikan saldo baru.
CREATE OR REPLACE FUNCTION public.reserve_redemption_points(p_order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_red record;
  v_used integer;
  v_balance integer;
BEGIN
  SELECT id, user_id, redemption_id, points_used, order_type, points_redeemed INTO v_order
  FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.order_type <> 'redeem' THEN RAISE EXCEPTION 'invalid_order'; END IF;
  IF v_order.points_redeemed THEN
    SELECT total_points INTO v_balance FROM users WHERE id = v_order.user_id;
    RETURN v_balance;
  END IF;

  SELECT * INTO v_red FROM point_redemptions WHERE id = v_order.redemption_id FOR UPDATE;
  IF NOT FOUND OR NOT v_red.is_active
     OR (v_red.active_from IS NOT NULL AND v_red.active_from > now())
     OR (v_red.active_until IS NOT NULL AND v_red.active_until <= now()) THEN
    RAISE EXCEPTION 'reward_inactive';
  END IF;
  IF v_red.redeemed_count >= v_red.redeem_stock THEN RAISE EXCEPTION 'out_of_stock'; END IF;

  SELECT count(*) INTO v_used FROM orders
  WHERE user_id = v_order.user_id AND redemption_id = v_red.id
    AND points_redeemed AND NOT points_refunded AND id <> p_order_id;
  IF v_used >= v_red.max_per_user THEN RAISE EXCEPTION 'max_per_user'; END IF;

  UPDATE users SET total_points = total_points - v_order.points_used
  WHERE id = v_order.user_id AND coalesce(total_points, 0) >= v_order.points_used
  RETURNING total_points INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient_points'; END IF;

  UPDATE point_redemptions SET redeemed_count = redeemed_count + 1, updated_at = now() WHERE id = v_red.id;
  INSERT INTO point_transactions (user_id, type, amount, balance_after, related_order_id, related_redemption_id, notes)
  VALUES (v_order.user_id, 'redeemed', -v_order.points_used, v_balance, p_order_id, v_red.id,
          'Tukar poin: ' || v_red.title);
  UPDATE orders SET points_redeemed = true WHERE id = p_order_id;
  RETURN v_balance;
END;
$$;

-- ── Tukar poin: kembalikan bila tidak jadi dibayar ────────────────────────
-- Idempoten. Mengembalikan true bila poin dikembalikan sekarang.
CREATE OR REPLACE FUNCTION public.refund_redemption_points(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_balance integer;
BEGIN
  SELECT id, user_id, redemption_id, points_used, points_redeemed, points_refunded INTO v_order
  FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR NOT v_order.points_redeemed OR v_order.points_refunded THEN RETURN false; END IF;

  UPDATE users SET total_points = coalesce(total_points, 0) + v_order.points_used
  WHERE id = v_order.user_id RETURNING total_points INTO v_balance;
  UPDATE point_redemptions SET redeemed_count = greatest(redeemed_count - 1, 0), updated_at = now()
  WHERE id = v_order.redemption_id;
  INSERT INTO point_transactions (user_id, type, amount, balance_after, related_order_id, related_redemption_id, notes)
  VALUES (v_order.user_id, 'refunded', v_order.points_used, v_balance, p_order_id, v_order.redemption_id,
          'Poin dikembalikan — penukaran #' || upper(left(p_order_id::text, 8)) || ' tidak dibayar');
  UPDATE orders SET points_refunded = true WHERE id = p_order_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_order_points(uuid, integer, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_redemption_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_redemption_points(uuid) FROM PUBLIC, anon, authenticated;

-- ── Stok: pesanan tukar poin tidak mengurangi stok produk → jangan dikembalikan ──
CREATE OR REPLACE FUNCTION public.release_stock_on_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status IN ('cancelled', 'expired')
     AND OLD.status NOT IN ('cancelled', 'expired')
     AND coalesce(NEW.order_type, 'purchase') <> 'redeem' THEN
    UPDATE products p
    SET stock = p.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$function$;
