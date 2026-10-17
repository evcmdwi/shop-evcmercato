-- 17 foto varian yang filenya sudah TIDAK ADA di storage (404) — dikosongkan agar
-- toko menampilkan foto produk, bukan gambar rusak. Upload ulang via Sambers → Edit.
update product_variants set image_url = null where image_url in (
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777856222687-wgrfl1.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777856239105-j9ed5f.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777862097936-p4h168.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777862119878-fzwtkk.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777855775586-3f7tv2.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777855795664-v13lz2.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777862361912-8tstgw.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777862404390-wll5p1.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777703145432-hxkk27.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777860460051-212j6y.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777860584522-ukw3ud.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777860632288-ykfv6w.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777439895959-ego8y1.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777439916953-7rgi5c.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777855952621-r7cfyc.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777855978328-0vo9ez.jpg',
  'https://wetmalavmkokmosrawez.supabase.co/storage/v1/object/public/product-images/products/1777856014055-9g4svw.jpg'
);
