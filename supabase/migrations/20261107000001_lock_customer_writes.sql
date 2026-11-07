-- Keamanan (2026-11-07): tutup policy tulis langsung milik customer yang tak dipakai app.
-- Semua penulisan users/orders/evc_redemptions lewat API server (service role, bypass RLS),
-- jadi policy ini hanya membuka jalan penyalahgunaan via REST + anon key:
--  * users_own_update: customer bisa set role='super_admin' (tembus 8 tabel admin via RLS),
--    juga total_points, tier, special_discount_pct miliknya sendiri.
--  * orders_own_insert: customer bisa insert order status 'paid' / total sembarang.
--  * redemptions_own_insert: customer bisa insert penukaran poin tanpa potong poin.
drop policy if exists users_own_update on public.users;
drop policy if exists orders_own_insert on public.orders;
drop policy if exists redemptions_own_insert on public.evc_redemptions;
