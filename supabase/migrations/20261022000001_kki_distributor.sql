-- Tanda "Distributor KKI": distributor KKI lain yang mendaftar/masuk leads untuk melihat sistem EVC.
-- Mereka dikecualikan dari semua jalur pemasaran (broadcast, follow up member/leads, pengingat bayar)
-- dan dari SEMUA diskon (ongkir, biaya layanan, VIP, bonus poin promo).
-- Lead & member dicocokkan lewat nomor WA ternormalisasi, jadi menandai salah satunya cukup.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kki_distributor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kki_note text,
  ADD COLUMN IF NOT EXISTS kki_marked_at timestamptz;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS kki_distributor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kki_note text,
  ADD COLUMN IF NOT EXISTS kki_marked_at timestamptz;

CREATE INDEX IF NOT EXISTS users_kki_idx ON public.users (id) WHERE kki_distributor;
CREATE INDEX IF NOT EXISTS leads_kki_idx ON public.leads (id) WHERE kki_distributor;

-- Semua nomor (format 08…) yang bertanda KKI, dari member maupun leads.
CREATE OR REPLACE FUNCTION public.kki_phones()
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.normalize_id_phone(phone) FROM public.users WHERE kki_distributor AND phone IS NOT NULL
  UNION
  SELECT phone_norm FROM public.leads WHERE kki_distributor AND phone_norm IS NOT NULL
$$;

-- Member bertanda KKI langsung, atau nomornya ditandai KKI di leads.
CREATE OR REPLACE FUNCTION public.is_kki_user(p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = p_user
       AND (u.kki_distributor OR public.normalize_id_phone(u.phone) IN (SELECT public.kki_phones()))
  )
$$;

REVOKE ALL ON FUNCTION public.kki_phones() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_kki_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kki_phones() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_kki_user(uuid) TO service_role;
