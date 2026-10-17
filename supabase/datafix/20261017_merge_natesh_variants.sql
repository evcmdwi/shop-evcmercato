-- Gabungkan varian Natesh Night & Pantyliner yang terduplikasi saat Edit (17 Okt 2026):
-- nama/harga/stok/foto/urutan BARU dipindah ke baris varian LAMA (punya PV affiliate,
-- riwayat order_items & komisi), lalu baris baru (tanpa referensi) dihapus.
begin;
with pairs(old_id, new_id) as (values
  ('7ea32a91-a53f-455a-b373-c5d9ebcf0410'::uuid, 'a79e5a54-7f00-4555-9a61-71772f7c105e'::uuid), -- 1 Night
  ('d09c8cb6-dd73-4b12-8369-70f8c282f449'::uuid, '27f5bca2-485c-49c3-b1d3-c7f70b071b40'::uuid), -- 3 Night
  ('5fbfa7f3-bdf8-4b51-b17b-3511a387bfb3'::uuid, '8ee55b42-37ff-4a41-93e1-4018bd21acbd'::uuid), -- 10 Night
  ('67d64ea2-0e9c-4707-9054-c2788b4f4883'::uuid, '85fd38e5-76ae-4a88-a9e3-042296332dae'::uuid), -- 1 Panty
  ('71b9603f-27ce-466a-b47c-c76f2a3afdbb'::uuid, 'a5cac66a-a843-41f9-916a-5f00e92a10b3'::uuid), -- 3 Panty
  ('924b3151-cbf4-4947-aa75-59fcdc9baf85'::uuid, '7faf9cdc-62aa-45cd-a9f0-44f063b2cb29'::uuid)  -- 15 Panty
), moved_cart as (
  update cart_items c set variant_id = p.old_id from pairs p where c.variant_id = p.new_id
), upd as (
  update product_variants o
     set name = n.name, price = n.price, stock = n.stock, image_url = n.image_url,
         sort_order = n.sort_order, is_active = true
    from pairs p join product_variants n on n.id = p.new_id
   where o.id = p.old_id
  returning o.id
)
select count(*) as diperbarui from upd;
delete from product_variants where id in (
  'a79e5a54-7f00-4555-9a61-71772f7c105e','27f5bca2-485c-49c3-b1d3-c7f70b071b40','8ee55b42-37ff-4a41-93e1-4018bd21acbd',
  '85fd38e5-76ae-4a88-a9e3-042296332dae','a5cac66a-a843-41f9-916a-5f00e92a10b3','7faf9cdc-62aa-45cd-a9f0-44f063b2cb29');
commit;
