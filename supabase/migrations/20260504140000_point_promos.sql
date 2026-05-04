-- point_promos: tabel untuk promo EVC Points (new_user dan purchase_bonus)
-- promo_type: 'new_user' | 'purchase_bonus'
-- new_user: member baru dapat bonus_points
-- purchase_bonus: beli produk tertentu dapat points_multiplier

create table if not exists public.point_promos (
  id            uuid primary key default gen_random_uuid(),
  promo_type    text not null check (promo_type in ('new_user', 'purchase_bonus')),
  title         text not null,
  is_active     boolean not null default true,
  active_until  timestamptz,

  -- new_user fields
  bonus_points  integer,

  -- purchase_bonus fields
  product_id    uuid references public.products(id) on delete set null,
  variant_id    uuid references public.product_variants(id) on delete set null,
  points_multiplier numeric(4,2),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for active promos lookup
create index if not exists idx_point_promos_type_active on public.point_promos (promo_type, is_active);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists point_promos_updated_at on public.point_promos;
create trigger point_promos_updated_at
  before update on public.point_promos
  for each row execute function public.set_updated_at();

-- RLS: hanya admin yang bisa akses (via service role key — row level security disabled for service role)
alter table public.point_promos enable row level security;

-- Public read untuk active promos (untuk user-facing promo display)
create policy "public can view active promos" on public.point_promos
  for select using (is_active = true);

-- Service role bypass (admin API memakai service role key)
