-- LP EVC Resmi v2 menggantikan /lp/evc-resmi (slug tetap, dipakai iklan). Versi lama tetap bisa
-- dibuka di /lp/evc-resmi-v1 (noindex) dan dicatat di LP Library sebagai Archived untuk perbandingan.
-- Baris `evc-resmi` (short link & affiliate) TIDAK diubah. Aman dijalankan ulang.

INSERT INTO landing_pages (slug, title, description, status, archived_at)
SELECT 'evc-resmi-v1',
       'EVC Resmi — v1 (arsip)',
       'Versi lama LP EVC Resmi (Mei–Okt 2026), diganti v2 pada 22 Okt 2026. Untuk perbandingan.',
       'archived',
       now()
WHERE NOT EXISTS (SELECT 1 FROM landing_pages WHERE slug = 'evc-resmi-v1');

SELECT slug, title, status, archived_at FROM landing_pages WHERE slug LIKE 'evc-resmi%' ORDER BY slug;
