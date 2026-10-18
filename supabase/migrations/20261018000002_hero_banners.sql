-- Hero carousel beranda: banner dari admin (Sambers › Tampilan Toko › Banner Hero),
-- pengaturan toko key–value, bucket gambar `banners`, dan penghitung klik.
-- Semua tulis lewat API admin (service role); publik hanya baca banner yang sedang tayang.

CREATE TABLE IF NOT EXISTS public.hero_banners (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  image_mobile_url  text NOT NULL,
  image_desktop_url text,
  bg_color          text,
  alt_text          text NOT NULL,
  link_type         text NOT NULL CHECK (link_type IN ('product', 'category', 'internal', 'whatsapp')),
  link_value        text NOT NULL DEFAULT '',
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  sort_order        integer NOT NULL DEFAULT 0,
  click_count       integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hero_banners_period_check CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS hero_banners_sort_idx ON public.hero_banners (sort_order);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hero_banners_public_read ON public.hero_banners;
CREATE POLICY hero_banners_public_read ON public.hero_banners
  FOR SELECT TO anon, authenticated
  USING (
    is_active
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );
-- Tidak ada policy INSERT/UPDATE/DELETE → hanya service role (API admin) yang bisa menulis.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
-- Tanpa policy: dibaca & ditulis hanya lewat server (service role).

INSERT INTO public.site_settings (key, value) VALUES
  ('hero_interval_seconds', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Tambah klik secara atomik (dipanggil server via service role).
CREATE OR REPLACE FUNCTION public.increment_banner_click(banner_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.hero_banners SET click_count = click_count + 1 WHERE id = banner_id;
$$;

REVOKE ALL ON FUNCTION public.increment_banner_click(uuid) FROM PUBLIC, anon, authenticated;

-- Bucket gambar banner: baca publik, maks 500 KB, JPG/WebP. Tanpa policy tulis di
-- storage.objects → upload hanya lewat API admin (service role).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banners', 'banners', true, 512000, ARRAY['image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 512000, allowed_mime_types = ARRAY['image/jpeg', 'image/webp'];
