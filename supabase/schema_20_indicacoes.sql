-- Rode no SQL Editor do Supabase, depois do schema_19_bloqueio_agenda.sql.
--
-- Programa de indicacao: paciente indica outra pessoa pra fisioterapia
-- pelvica domiciliar, a indicada ganha 50% na primeira sessao. Sem
-- cobranca integrada no app — isso aqui so registra a indicacao pra
-- Beatriz controlar manualmente e marcar como usada quando aplicar o
-- desconto.

create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.perfis (id) on delete cascade,
  nome_indicada text not null,
  contato_indicada text not null,
  status text not null default 'pendente',
  criado_em timestamptz not null default now(),
  usada_em timestamptz
);

alter table public.indicacoes enable row level security;

drop policy if exists "paciente cria a propria indicacao" on public.indicacoes;
create policy "paciente cria a propria indicacao"
  on public.indicacoes for insert
  with check (paciente_id = auth.uid());

drop policy if exists "paciente ve as propias indicacoes" on public.indicacoes;
create policy "paciente ve as propias indicacoes"
  on public.indicacoes for select
  using (paciente_id = auth.uid() or public.is_admin());

drop policy if exists "admin atualiza indicacoes" on public.indicacoes;
create policy "admin atualiza indicacoes"
  on public.indicacoes for update
  using (public.is_admin())
  with check (public.is_admin());
