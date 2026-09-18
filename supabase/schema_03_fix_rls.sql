-- Corrige recursao infinita nas politicas de RLS.
-- Rode este script no SQL Editor do Supabase, depois do schema.sql e schema_02.sql.
--
-- Problema: a politica "admin ve todos os perfis" consultava a propria
-- tabela perfis dentro da politica de perfis, causando erro de
-- "infinite recursion detected in policy for relation perfis" em
-- QUALQUER select nessa tabela (para qualquer usuario, admin ou nao).
-- Isso derrubava silenciosamente as consultas de papel do usuario em
-- toda a aplicacao, fazendo o app sempre tratar todo mundo como paciente.
--
-- Solucao: uma funcao SECURITY DEFINER que verifica o papel do usuario
-- sem reativar as politicas de RLS de perfis dentro dela mesma.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;

-- perfis
drop policy if exists "admin vê todos os perfis" on public.perfis;
create policy "admin vê todos os perfis"
  on public.perfis for select
  using (public.is_admin());

-- exercicios
drop policy if exists "só admin cria/edita/remove exercícios" on public.exercicios;
create policy "só admin cria/edita/remove exercícios"
  on public.exercicios for all
  using (public.is_admin())
  with check (public.is_admin());

-- planos
drop policy if exists "admin vê e gerencia todos os planos" on public.planos;
create policy "admin vê e gerencia todos os planos"
  on public.planos for all
  using (public.is_admin())
  with check (public.is_admin());

-- plano_exercicios
drop policy if exists "admin gerencia itens de qualquer plano" on public.plano_exercicios;
create policy "admin gerencia itens de qualquer plano"
  on public.plano_exercicios for all
  using (public.is_admin())
  with check (public.is_admin());

-- sessoes
drop policy if exists "admin gerencia todas as sessões" on public.sessoes;
create policy "admin gerencia todas as sessões"
  on public.sessoes for all
  using (public.is_admin())
  with check (public.is_admin());

-- avisos
drop policy if exists "qualquer usuário logado vê avisos ativos" on public.avisos;
create policy "qualquer usuário logado vê avisos ativos"
  on public.avisos for select
  using (ativo = true or public.is_admin());

drop policy if exists "só admin cria/edita avisos" on public.avisos;
create policy "só admin cria/edita avisos"
  on public.avisos for all
  using (public.is_admin())
  with check (public.is_admin());
