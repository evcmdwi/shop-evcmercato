-- Kata kunci pencarian tambahan per produk (dipisah koma), mis. "sgf, paket hemat".
-- Pencarian katalog mencocokkan nama produk, kata kunci ini, dan nama kategori.
alter table products add column if not exists search_keywords text;

-- Isi awal: produk SuperGreen Food bisa dicari dengan "sgf" / "supergreen".
update products set search_keywords = 'sgf, supergreen food'
 where search_keywords is null
   and (name ilike '%supergreen%' or name ilike '%super green%');
