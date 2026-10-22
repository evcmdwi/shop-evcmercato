-- Chat Neny 21 Okt 2026 dari histori WA (permintaan Dwi: dicatat sebagai performa NN hari ini).
-- Melinda (Puffpop Shop) & Tika (Surtika) sudah tercatat lewat web → dilewati.
-- Waktu catatan = saat SQL ini dijalankan; kunci 7 hari (member) / 14 hari (lead) mulai saat itu.
-- Aman dijalankan ulang: yang sudah dicatat NN hari ini atau dipegang admin lain dilewati.

-- 1. Kontak baru → Database Leads
INSERT INTO public.leads (nama, phone, source, notes)
SELECT v.nama, v.phone, 'manual', 'Di-chat Neny 21 Okt 2026 langsung dari WA'
  FROM (VALUES ('Catherine Tjan', '08175479609'), ('Linawati', '081298827161')) AS v(nama, phone)
 WHERE NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.phone_norm = public.normalize_id_phone(v.phone))
   AND NOT EXISTS (SELECT 1 FROM public.users u WHERE public.normalize_id_phone(u.phone) = public.normalize_id_phone(v.phone));

-- 2. Member: Ari Lestari ("Ri", beli terakhir 9 Okt) & Dewi Anawati (beli terakhir 31 Jul)
INSERT INTO public.admin_followups (user_id, admin_code, segment)
SELECT u.id, 'NN', v.segment
  FROM (VALUES ('081296802966', 'repeat'), ('08121093787', 'dormant')) AS v(phone, segment)
  JOIN public.users u ON public.normalize_id_phone(u.phone) = v.phone
 WHERE NOT EXISTS (
         SELECT 1 FROM public.admin_followups f
          WHERE f.user_id = u.id
            AND ((f.admin_code = 'NN' AND f.created_at >= '2026-10-21 00:00:00+07')
              OR (f.admin_code <> 'NN' AND f.expires_at > now() AND f.converted_order_id IS NULL)));

-- 3. Lead: Iba, Nelly (Toko Henghong), Yuliana (lead dobel → yang terlama), Catherine Tjan, Linawati
INSERT INTO public.lead_followups (lead_id, admin_code)
SELECT DISTINCT ON (l.phone_norm) l.id, 'NN'
  FROM public.leads l
 WHERE l.phone_norm IN ('0818159403', '085288881280', '085219327227', '08175479609', '081298827161')
   AND NOT EXISTS (
         SELECT 1 FROM public.lead_followups f
          WHERE f.lead_id = l.id
            AND ((f.admin_code = 'NN' AND f.created_at >= '2026-10-21 00:00:00+07')
              OR (f.admin_code <> 'NN' AND f.expires_at > now())))
 ORDER BY l.phone_norm, l.created_at;

UPDATE public.leads SET status = 'contacted', updated_at = now()
 WHERE phone_norm IN ('0818159403', '085288881280', '085219327227', '08175479609', '081298827161')
   AND status = 'new';

-- Ringkasan FU NN hari ini
SELECT 'member' AS jenis, u.name AS nama, f.created_at AT TIME ZONE 'Asia/Jakarta' AS jam_wib
  FROM public.admin_followups f JOIN public.users u ON u.id = f.user_id
 WHERE f.admin_code = 'NN' AND f.created_at >= '2026-10-21 00:00:00+07'
UNION ALL
SELECT 'lead', l.nama, f.created_at AT TIME ZONE 'Asia/Jakarta'
  FROM public.lead_followups f JOIN public.leads l ON l.id = f.lead_id
 WHERE f.admin_code = 'NN' AND f.created_at >= '2026-10-21 00:00:00+07'
 ORDER BY 3;
