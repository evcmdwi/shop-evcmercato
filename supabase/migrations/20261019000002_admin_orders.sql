-- Pesanan yang dibuat admin EVC dari Sambers (Dashboard › Buat Pesanan).
-- 1) admin_codes: kode admin pembuat pesanan (untuk tracking komisi admin ke depan).
-- 2) orders.admin_code: kode admin yang membuat pesanan (NULL = checkout pembeli sendiri).
-- 3) orders.admin_discount: diskon rupiah yang diberikan admin (sudah dipotong dari total).

CREATE TABLE IF NOT EXISTS public.admin_codes (
  code text PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{2,6}$'),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY; -- hanya service role

INSERT INTO public.admin_codes (code, name) VALUES
  ('NN', 'Neny'),
  ('MA', 'Marlik'),
  ('DC', 'Dwi')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_code text REFERENCES public.admin_codes(code) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS admin_discount integer NOT NULL DEFAULT 0 CHECK (admin_discount >= 0);

CREATE INDEX IF NOT EXISTS orders_admin_code_idx ON public.orders (admin_code) WHERE admin_code IS NOT NULL;
