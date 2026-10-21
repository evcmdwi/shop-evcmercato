-- Follow up LEADS oleh admin (pola sama dengan admin_followups untuk member).
-- Admin klik "FU via WA" → tercatat di lead_followups, lead "dipegang" admin itu 14 hari (cold call).
-- Admin mendaftarkan lead jadi member (password awal 123456) → tercatat Join untuk admin itu, dan
-- member baru dipegang 30 hari di admin_followups (segment 'new', lead_id terisi) → belanja pertama
-- otomatis jadi closing admin itu lewat trigger attribute_admin_followup yang sudah ada.

-- ─── Normalisasi nomor: (+62)812… / 62812… / 0812… / 00812… / 812… → 0812… ─────
CREATE OR REPLACE FUNCTION public.normalize_id_phone(raw text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN d = '' THEN NULL ELSE '0' || ltrim(CASE WHEN d LIKE '62%' THEN substr(d, 3) ELSE d END, '0') END
    FROM (SELECT regexp_replace(COALESCE(raw, ''), '\D', '', 'g') AS d) x
$$;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone_norm text
  GENERATED ALWAYS AS (public.normalize_id_phone(phone)) STORED;
-- Nomor HP (bisa WA): 08 + 8–11 digit. Telepon rumah (021…, 022…) = bukan WA.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_mobile boolean
  GENERATED ALWAYS AS (public.normalize_id_phone(phone) ~ '^08[0-9]{8,11}$') STORED;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_by_admin text REFERENCES public.admin_codes(code) ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS leads_phone_norm_idx ON public.leads (phone_norm);

-- Status lead: new, contacted, interested, converted, not_interested, invalid (nomor salah / tak ada WA)

CREATE TABLE IF NOT EXISTS public.lead_followups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  admin_code  text NOT NULL REFERENCES public.admin_codes(code) ON UPDATE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '14 days',
  -- replied | interested | no_reply | not_interested | invalid
  result      text CHECK (result IN ('replied','interested','no_reply','not_interested','invalid')),
  result_at   timestamptz
);
CREATE INDEX IF NOT EXISTS lead_followups_lead_idx ON public.lead_followups (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_followups_admin_idx ON public.lead_followups (admin_code, created_at DESC);
ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;

-- Member hasil leads: penanda di kunci follow-up member (closing tetap admin_source 'followup').
ALTER TABLE public.admin_followups ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- ─── Data lama: leads yang nomornya sudah jadi member → converted ──────────────
UPDATE public.leads l
   SET status = 'converted', converted_user_id = u.id, converted_at = COALESCE(l.converted_at, u.created_at), updated_at = now()
  FROM public.users u
 WHERE u.phone IS NOT NULL
   AND public.normalize_id_phone(u.phone) = l.phone_norm
   AND l.converted_user_id IS NULL;

UPDATE public.leads SET status = 'invalid', updated_at = now()
 WHERE NOT is_mobile AND status = 'new';

-- ─── Member baru (daftar sendiri) yang nomornya ada di leads ───────────────────
-- Jika lead sedang dipegang admin → Join tercatat untuk admin itu + member dipegang 30 hari.
CREATE OR REPLACE FUNCTION public.mark_lead_converted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  l record;
  lock_code text;
BEGIN
  FOR l IN SELECT id FROM leads
            WHERE phone_norm = normalize_id_phone(NEW.phone) AND converted_user_id IS NULL
  LOOP
    SELECT f.admin_code INTO lock_code FROM lead_followups f
     WHERE f.lead_id = l.id AND f.expires_at > now()
     ORDER BY f.created_at DESC LIMIT 1;

    UPDATE leads SET status = 'converted', converted_user_id = NEW.id, converted_at = now(),
                     converted_by_admin = lock_code, updated_at = now()
     WHERE id = l.id;

    IF lock_code IS NOT NULL THEN
      INSERT INTO admin_followups (user_id, admin_code, segment, expires_at, lead_id)
      VALUES (NEW.id, lock_code, 'new', now() + interval '30 days', l.id);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_user_created_mark_lead ON public.users;
CREATE TRIGGER on_user_created_mark_lead
  AFTER INSERT OR UPDATE OF phone ON public.users
  FOR EACH ROW
  WHEN (NEW.phone IS NOT NULL)
  EXECUTE FUNCTION public.mark_lead_converted();

-- ─── Daftar leads untuk di-follow up ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_lead_candidates()
RETURNS TABLE (
  id uuid, nama text, phone text, phone_norm text, kota text, interest text, notes text, status text,
  created_at timestamptz, attempts int, last_fu_at timestamptz, last_fu_admin text, last_result text,
  last_fu_id uuid, lock_admin_code text, lock_expires_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH agg AS (
    SELECT f.lead_id, count(*)::int AS attempts FROM lead_followups f GROUP BY f.lead_id
  ),
  last_fu AS (
    SELECT DISTINCT ON (f.lead_id) f.lead_id, f.id, f.created_at, f.admin_code, f.result, f.expires_at
      FROM lead_followups f
     ORDER BY f.lead_id, f.created_at DESC
  )
  SELECT l.id, l.nama, l.phone, l.phone_norm, NULLIF(trim(l.kota), ''), NULLIF(trim(l.interest), ''), l.notes, l.status,
         l.created_at, COALESCE(a.attempts, 0), lf.created_at, lf.admin_code, lf.result, lf.id,
         CASE WHEN lf.expires_at > now() THEN lf.admin_code END,
         CASE WHEN lf.expires_at > now() THEN lf.expires_at END
    FROM leads l
    LEFT JOIN agg a ON a.lead_id = l.id
    LEFT JOIN last_fu lf ON lf.lead_id = l.id
   WHERE l.status NOT IN ('converted', 'not_interested', 'invalid') AND l.is_mobile;
$$;

REVOKE ALL ON FUNCTION public.admin_lead_candidates() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lead_candidates() TO service_role;
REVOKE ALL ON FUNCTION public.mark_lead_converted() FROM PUBLIC, anon, authenticated;
