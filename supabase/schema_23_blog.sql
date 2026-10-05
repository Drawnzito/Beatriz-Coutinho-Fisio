-- Rode no SQL Editor do Supabase, depois do schema_22_grade_horarios.sql.

-- ==========================================================
-- BLOG / PRODUÇÃO CIENTÍFICA
-- ==========================================================
-- Posts que a Beatriz publica: artigos próprios, divulgação de trabalhos
-- já publicados em revista, e conteúdo informativo pras pacientes.
--
-- Diferente de todo o resto do app, esta tabela é LIDA SEM LOGIN: é ela
-- que faz o site ter conteúdo indexável pelo Google. Por isso a policy de
-- leitura não checa auth.uid() — ela libera para `anon` o que estiver
-- publicado, e só isso.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  conteudo text not null default '',
  capa_url text,
  -- Link do artigo original (DOI, SciELO, PubMed) quando o post é
  -- divulgação de um trabalho publicado em outro lugar.
  link_externo text,
  publicado boolean not null default false,
  publicado_em timestamptz,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists posts_publicado_idx
  on public.posts (publicado, publicado_em desc);

alter table public.posts enable row level security;

-- Visitante sem login vê o que está publicado. Rascunho não vaza.
drop policy if exists "qualquer um ve posts publicados" on public.posts;
create policy "qualquer um ve posts publicados"
  on public.posts for select
  using (publicado = true);

-- Admin vê tudo, inclusive rascunho.
drop policy if exists "admin ve todos os posts" on public.posts;
create policy "admin ve todos os posts"
  on public.posts for select
  using (public.is_admin());

drop policy if exists "so admin gerencia posts" on public.posts;
create policy "so admin gerencia posts"
  on public.posts for insert
  with check (public.is_admin());

drop policy if exists "so admin edita posts" on public.posts;
create policy "so admin edita posts"
  on public.posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "so admin remove posts" on public.posts;
create policy "so admin remove posts"
  on public.posts for delete
  using (public.is_admin());

-- Mantém atualizado_em sem depender do app lembrar de preencher.
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists posts_atualizado_em on public.posts;
create trigger posts_atualizado_em
  before update on public.posts
  for each row execute function public.tocar_atualizado_em();

-- ==========================================================
-- BUCKET DAS CAPAS
-- ==========================================================
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

drop policy if exists "qualquer um ve capas do blog" on storage.objects;
create policy "qualquer um ve capas do blog"
  on storage.objects for select
  using (bucket_id = 'blog');

drop policy if exists "admin faz upload de capas do blog" on storage.objects;
create policy "admin faz upload de capas do blog"
  on storage.objects for insert
  with check (bucket_id = 'blog' and public.is_admin());

drop policy if exists "admin remove capas do blog" on storage.objects;
create policy "admin remove capas do blog"
  on storage.objects for delete
  using (bucket_id = 'blog' and public.is_admin());
