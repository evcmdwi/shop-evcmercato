-- Follow-up admin ke member / pembeli lama.
-- Admin klik "Follow Up via WA" → tercatat di admin_followups, customer "dipegang" admin itu 7 hari.
-- Jika customer membayar pesanan dalam 7 hari tsb → orders.admin_code diisi otomatis (admin_source = 'followup').

CREATE TABLE IF NOT EXISTS public.admin_followups (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_code         text NOT NULL REFERENCES public.admin_codes(code) ON UPDATE CASCADE,
  segment            text NOT NULL CHECK (segment IN ('repeat','dormant','unpaid','new')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL DEFAULT now() + interval '7 days',
  converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS admin_followups_user_idx ON public.admin_followups (user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS admin_followups_admin_idx ON public.admin_followups (admin_code, created_at DESC);
ALTER TABLE public.admin_followups ENABLE ROW LEVEL SECURITY;

-- Asal closing admin: dibuat (Buat Pesanan), followup (otomatis), klaim (manual di detail pesanan)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_source text
  CHECK (admin_source IN ('dibuat','followup','klaim'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_claimed_at timestamptz;
UPDATE public.orders SET admin_source = 'dibuat' WHERE admin_code IS NOT NULL AND admin_source IS NULL;

-- ─── Atribusi otomatis saat pesanan lunas ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.attribute_admin_followup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fu record;
  paid_time timestamptz := COALESCE(NEW.paid_at, now());
BEGIN
  IF NEW.order_type IS DISTINCT FROM 'purchase'
     OR OLD.status IS DISTINCT FROM 'pending'
     OR NEW.status NOT IN ('paid','processed','shipped','delivered') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO fu FROM admin_followups
   WHERE user_id = NEW.user_id
     AND converted_order_id IS NULL
     AND created_at <= paid_time
     AND expires_at >= paid_time
   ORDER BY created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.admin_code IS NULL THEN
    NEW.admin_code := fu.admin_code;
    NEW.admin_source := 'followup';
  ELSIF NEW.admin_code <> fu.admin_code THEN
    RETURN NEW; -- pesanan dibuat admin lain: biarkan
  END IF;

  UPDATE admin_followups SET converted_order_id = NEW.id WHERE id = fu.id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_attribute_admin_followup ON public.orders;
CREATE TRIGGER orders_attribute_admin_followup
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.attribute_admin_followup();

-- ─── Daftar customer untuk di-follow up ───────────────────────────────────
-- unpaid  : pesanan kedaluwarsa/batal ≤14 hari terakhir, belum ada yang lunas sesudahnya & tidak ada pending
-- repeat  : beli terakhir 30–60 hari lalu
-- dormant : beli terakhir > 60 hari lalu
-- new     : member yang belum pernah belanja
CREATE OR REPLACE FUNCTION public.admin_followup_candidates()
RETURNS TABLE (
  user_id uuid, name text, email text, phone text, total_points int, member_since timestamptz,
  segment text, last_paid_at timestamptz, paid_count int, total_spent bigint, last_products text,
  last_unpaid_at timestamptz, lock_admin_code text, lock_expires_at timestamptz,
  last_followup_at timestamptz, last_followup_admin text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH paid AS (
    SELECT o.user_id, max(o.paid_at) AS last_paid_at, count(*)::int AS paid_count,
           sum(o.total_amount)::bigint AS total_spent
      FROM orders o
     WHERE o.order_type = 'purchase' AND o.status IN ('paid','processed','shipped','delivered')
     GROUP BY o.user_id
  ),
  last_order AS (
    SELECT DISTINCT ON (o.user_id) o.user_id, o.id
      FROM orders o
     WHERE o.order_type = 'purchase' AND o.status IN ('paid','processed','shipped','delivered')
     ORDER BY o.user_id, o.paid_at DESC NULLS LAST
  ),
  last_items AS (
    SELECT lo.user_id, string_agg(DISTINCT oi.product_name, ', ') AS last_products
      FROM last_order lo JOIN order_items oi ON oi.order_id = lo.id
     GROUP BY lo.user_id
  ),
  unpaid AS (
    SELECT o.user_id, max(o.created_at) AS last_unpaid_at
      FROM orders o
     WHERE o.order_type = 'purchase' AND o.status IN ('expired','cancelled')
       AND o.created_at > now() - interval '14 days'
     GROUP BY o.user_id
  ),
  pending AS (
    SELECT DISTINCT o.user_id FROM orders o WHERE o.status = 'pending'
  ),
  lock AS (
    SELECT DISTINCT ON (f.user_id) f.user_id, f.admin_code, f.expires_at
      FROM admin_followups f
     WHERE f.expires_at > now() AND f.converted_order_id IS NULL
     ORDER BY f.user_id, f.created_at DESC
  ),
  last_fu AS (
    SELECT DISTINCT ON (f.user_id) f.user_id, f.created_at, f.admin_code
      FROM admin_followups f
     ORDER BY f.user_id, f.created_at DESC
  ),
  base AS (
    SELECT u.id AS user_id, u.name, u.email, u.phone, COALESCE(u.total_points, 0) AS total_points,
           u.created_at AS member_since,
           CASE
             WHEN un.last_unpaid_at IS NOT NULL AND pe.user_id IS NULL
                  AND (p.last_paid_at IS NULL OR un.last_unpaid_at > p.last_paid_at) THEN 'unpaid'
             WHEN p.last_paid_at IS NULL THEN 'new'
             WHEN p.last_paid_at < now() - interval '60 days' THEN 'dormant'
             WHEN p.last_paid_at < now() - interval '30 days' THEN 'repeat'
           END AS segment,
           p.last_paid_at, COALESCE(p.paid_count, 0) AS paid_count, COALESCE(p.total_spent, 0) AS total_spent,
           li.last_products, un.last_unpaid_at,
           l.admin_code AS lock_admin_code, l.expires_at AS lock_expires_at,
           lf.created_at AS last_followup_at, lf.admin_code AS last_followup_admin
      FROM users u
      LEFT JOIN paid p ON p.user_id = u.id
      LEFT JOIN last_items li ON li.user_id = u.id
      LEFT JOIN unpaid un ON un.user_id = u.id
      LEFT JOIN pending pe ON pe.user_id = u.id
      LEFT JOIN lock l ON l.user_id = u.id
      LEFT JOIN last_fu lf ON lf.user_id = u.id
     WHERE COALESCE(u.role, 'customer') = 'customer'
  )
  SELECT * FROM base WHERE segment IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.admin_followup_candidates() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_followup_candidates() TO service_role;
REVOKE ALL ON FUNCTION public.attribute_admin_followup() FROM PUBLIC, anon, authenticated;
