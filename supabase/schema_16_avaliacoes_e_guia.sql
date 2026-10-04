-- Rode no SQL Editor do Supabase, depois do schema_15_numero_sessao.sql.

-- ==========================================================
-- AVALIACOES (atendimento por sessao + app em geral)
-- 3 perguntas cada, nota de 1 a 5 (estrelas).
-- ==========================================================
create table if not exists public.avaliacoes_atendimento (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.perfis (id) on delete cascade,
  sessao_id uuid references public.sessoes (id) on delete set null,
  nota_1 int not null check (nota_1 between 1 and 5),
  nota_2 int not null check (nota_2 between 1 and 5),
  nota_3 int not null check (nota_3 between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now()
);

create table if not exists public.avaliacoes_app (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.perfis (id) on delete cascade,
  nota_1 int not null check (nota_1 between 1 and 5),
  nota_2 int not null check (nota_2 between 1 and 5),
  nota_3 int not null check (nota_3 between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now()
);

alter table public.avaliacoes_atendimento enable row level security;
alter table public.avaliacoes_app enable row level security;

drop policy if exists "paciente cria a propria avaliacao de atendimento" on public.avaliacoes_atendimento;
create policy "paciente cria a propria avaliacao de atendimento"
  on public.avaliacoes_atendimento for insert
  with check (paciente_id = auth.uid());

drop policy if exists "paciente ve as propias avaliacoes de atendimento" on public.avaliacoes_atendimento;
create policy "paciente ve as propias avaliacoes de atendimento"
  on public.avaliacoes_atendimento for select
  using (paciente_id = auth.uid() or public.is_admin());

drop policy if exists "paciente cria a propria avaliacao do app" on public.avaliacoes_app;
create policy "paciente cria a propria avaliacao do app"
  on public.avaliacoes_app for insert
  with check (paciente_id = auth.uid());

drop policy if exists "paciente ve as propias avaliacoes do app" on public.avaliacoes_app;
create policy "paciente ve as propias avaliacoes do app"
  on public.avaliacoes_app for select
  using (paciente_id = auth.uid() or public.is_admin());

-- ==========================================================
-- GUIA DE PRIMEIROS PASSOS (onboarding dispensavel no 1o login)
-- ==========================================================
alter table public.perfis add column if not exists guia_visto_em timestamptz;
