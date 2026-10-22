-- Jejak perangkat member (login, kunjungan, checkout): device ID buatan sendiri (cookie/localStorage),
-- IP, dan user agent. Dipakai untuk mengenali distributor KKI yang membuat akun baru dengan email lain.
-- Hanya dibaca admin lewat service role; disimpan maks 12 bulan (dibersihkan cron process-paid-orders).
-- Diumumkan di Kebijakan Privasi (/privacy-policy).

CREATE TABLE IF NOT EXISTS public.member_devices (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event       text NOT NULL CHECK (event IN ('login', 'visit', 'checkout')),
  device_id   text,
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_devices_user_idx ON public.member_devices (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS member_devices_device_idx ON public.member_devices (device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS member_devices_ip_idx ON public.member_devices (ip) WHERE ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS member_devices_created_idx ON public.member_devices (created_at);
ALTER TABLE public.member_devices ENABLE ROW LEVEL SECURITY;

-- "Jl. Mawar No.5, RT 02" → "jlmawarno5rt02" untuk membandingkan alamat.
CREATE OR REPLACE FUNCTION public.norm_address(t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(COALESCE(t, ''), '[^a-zA-Z0-9]', '', 'g'))
$$;

-- Member (belum bertanda KKI) yang mirip akun distributor KKI.
-- Bukti kuat: perangkat sama, alamat kirim sama (kota sama), nomor penerima = nomor KKI.
-- IP sama (±7 hari) hanya bukti pendukung — tidak pernah memicu sendiri (IP seluler dipakai banyak orang).
-- Hasilnya hanya saran untuk admin; pelabelan tetap manual.
CREATE OR REPLACE FUNCTION public.kki_suspects(p_user uuid DEFAULT NULL)
RETURNS TABLE (user_id uuid, kki_user_id uuid, kki_name text, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH kp AS (SELECT public.kki_phones() AS p),
  kki AS (
    SELECT u.id, u.name FROM public.users u
     WHERE u.kki_distributor OR public.normalize_id_phone(u.phone) IN (SELECT p FROM kp)
  ),
  cand AS (
    SELECT u.id FROM public.users u
     WHERE (p_user IS NULL OR u.id = p_user) AND u.id NOT IN (SELECT id FROM kki)
  ),
  strong AS (
    SELECT DISTINCT d.user_id, k.id AS kki_user_id, k.name AS kki_name, 'Perangkat sama'::text AS reason
      FROM public.member_devices d
      JOIN public.member_devices kd ON kd.device_id = d.device_id
      JOIN kki k ON k.id = kd.user_id
     WHERE d.device_id IS NOT NULL AND d.user_id IN (SELECT id FROM cand)
    UNION
    SELECT DISTINCT a.user_id, k.id, k.name, 'Alamat kirim sama'
      FROM public.addresses a
      JOIN public.addresses ka
        ON public.norm_address(ka.full_address) = public.norm_address(a.full_address)
       AND lower(ka.city) = lower(a.city)
      JOIN kki k ON k.id = ka.user_id
     WHERE a.user_id IN (SELECT id FROM cand) AND length(public.norm_address(a.full_address)) >= 12
    UNION
    SELECT DISTINCT a.user_id, NULL::uuid, NULL::text, 'No. penerima = nomor distributor KKI'
      FROM public.addresses a
     WHERE a.user_id IN (SELECT id FROM cand)
       AND public.normalize_id_phone(a.phone) IN (SELECT p FROM kp)
  ),
  weak AS (
    SELECT DISTINCT d.user_id, k.id AS kki_user_id, k.name AS kki_name, 'IP sama (pendukung)'::text AS reason
      FROM public.member_devices d
      JOIN public.member_devices kd
        ON kd.ip = d.ip AND abs(extract(epoch FROM d.created_at - kd.created_at)) < 7 * 86400
      JOIN kki k ON k.id = kd.user_id
     WHERE d.ip IS NOT NULL AND d.user_id IN (SELECT s.user_id FROM strong s)
  )
  SELECT * FROM strong
  UNION
  SELECT * FROM weak
$$;

REVOKE ALL ON FUNCTION public.kki_suspects(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kki_suspects(uuid) TO service_role;
