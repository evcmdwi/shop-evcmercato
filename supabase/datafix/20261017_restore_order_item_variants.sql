-- Pulihkan order_items.variant_id yang hilang (FK SET NULL) akibat Sambers Edit
-- lama yang menghapus+membuat ulang varian. Hanya baris yang nama variannya cocok
-- tepat SATU varian produk yang sama (±76 baris). Aman dijalankan ulang.
update order_items oi
   set variant_id = v.id
  from product_variants v
 where oi.variant_id is null
   and oi.variant_name is not null
   and v.product_id = oi.product_id
   and lower(trim(v.name)) = lower(trim(oi.variant_name))
   and (select count(*) from product_variants v2
         where v2.product_id = oi.product_id
           and lower(trim(v2.name)) = lower(trim(oi.variant_name))) = 1;
