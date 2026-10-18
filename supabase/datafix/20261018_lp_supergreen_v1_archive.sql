-- LP Supergreen Food v2 menggantikan /lp/supergreen-food. Versi lama tetap bisa dibuka di
-- /lp/supergreen-food-v1 (noindex) dan dicatat di LP Library sebagai Archived untuk perbandingan.
-- Baris `supergreen-food` (short link & affiliate) TIDAK diubah. Aman dijalankan ulang.

INSERT INTO landing_pages (slug, title, description, status, archived_at)
SELECT 'supergreen-food-v1',
       'Supergreen Food — v1 (arsip)',
       'Versi lama LP Supergreen Food (Jun–Okt 2026), diganti v2 pada 18 Okt 2026. Untuk perbandingan.',
       'archived',
       now()
WHERE NOT EXISTS (SELECT 1 FROM landing_pages WHERE slug = 'supergreen-food-v1');

SELECT slug, title, status, archived_at FROM landing_pages WHERE slug LIKE 'supergreen-food%' ORDER BY slug;
