-- Extra Point Khusus 1,6x (5–31 Mei 2026) untuk kkvitayang@gmail.com tidak pernah
-- dikredit (bug: cron mencari kolom expires_at yang tidak ada). Kekurangan:
--   cb8cf9ab  245 poin dasar → +147
--   01e3bd98   90 poin dasar → +54
--   ecbdef33   96 poin dasar → +57      total +258
-- JALANKAN SETELAH migrasi 20261018000003 (butuh jenis transaksi 'bonus').
-- Aman dijalankan ulang: pesanan yang sudah punya transaksi 'bonus' dilewati.

DO $$
DECLARE
  v_user uuid;
  r record;
  v_balance integer;
BEGIN
  SELECT id INTO v_user FROM users WHERE lower(email) = 'kkvitayang@gmail.com';
  IF v_user IS NULL THEN RAISE EXCEPTION 'user tidak ditemukan'; END IF;

  FOR r IN
    SELECT * FROM (VALUES
      ('cb8cf9ab-bf6e-4ef5-9f4b-897e08b4a37c'::uuid, 147),
      ('01e3bd98-7d70-4714-939d-82b4fc1deaea'::uuid, 54),
      ('ecbdef33-92eb-4e67-8949-1739cce9d42d'::uuid, 57)
    ) AS t(order_id, pts)
  LOOP
    IF EXISTS (SELECT 1 FROM point_transactions WHERE related_order_id = r.order_id AND type = 'bonus') THEN
      CONTINUE;
    END IF;
    UPDATE users SET total_points = coalesce(total_points, 0) + r.pts
    WHERE id = v_user RETURNING total_points INTO v_balance;
    INSERT INTO point_transactions (user_id, type, amount, balance_after, related_order_id, notes)
    VALUES (v_user, 'bonus', r.pts, v_balance, r.order_id, 'Extra Point Khusus (1.6x) — susulan Mei 2026');
  END LOOP;
END $$;

SELECT u.email, u.total_points,
       (SELECT sum(amount) FROM point_transactions t WHERE t.user_id = u.id) AS sum_riwayat
FROM users u WHERE lower(u.email) = 'kkvitayang@gmail.com';
