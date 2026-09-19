-- Rode no SQL Editor do Supabase, depois dos scripts anteriores.
-- Cards de destaque (tipo Stories) que aparecem no topo do Inicio.

create table if not exists public.destaques (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  subtitulo text,
  imagem_url text not null,
  link_url text,
  ordem int not null default 0,
  ativo boolean not null default true,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.destaques enable row level security;

drop policy if exists "qualquer usuario logado ve destaques ativos" on public.destaques;
create policy "qualquer usuario logado ve destaques ativos"
  on public.destaques for select
  using (ativo = true or public.is_admin());

drop policy if exists "so admin gerencia destaques" on public.destaques;
create policy "so admin gerencia destaques"
  on public.destaques for all
  using (public.is_admin())
  with check (public.is_admin());

-- Bucket publico pra guardar as imagens dos destaques.
insert into storage.buckets (id, name, public)
values ('destaques', 'destaques', true)
on conflict (id) do nothing;

drop policy if exists "qualquer um ve imagens de destaques" on storage.objects;
create policy "qualquer um ve imagens de destaques"
  on storage.objects for select
  using (bucket_id = 'destaques');

drop policy if exists "admin faz upload de imagens de destaques" on storage.objects;
create policy "admin faz upload de imagens de destaques"
  on storage.objects for insert
  with check (bucket_id = 'destaques' and public.is_admin());

drop policy if exists "admin remove imagens de destaques" on storage.objects;
create policy "admin remove imagens de destaques"
  on storage.objects for delete
  using (bucket_id = 'destaques' and public.is_admin());
