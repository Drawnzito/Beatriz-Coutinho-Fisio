-- Rode no SQL Editor do Supabase, depois do schema_21_fix_solicitar_sessao_duplicada.sql.

-- ==========================================================
-- GRADE DE HORARIOS DE ATENDIMENTO
-- ==========================================================
-- Ate aqui o paciente digitava a hora num campo livre e o app so avisava
-- do conflito DEPOIS de enviar. Agora a Beatriz declara os horarios em que
-- atende, e o paciente escolhe entre as vagas reais.

create table if not exists public.horarios_atendimento (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0=domingo
  hora_inicio time not null,
  hora_fim time not null,
  intervalo_minutos smallint not null default 60
    check (intervalo_minutos between 15 and 240),
  ativo boolean not null default true,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  constraint horario_fim_depois_do_inicio check (hora_fim > hora_inicio)
);

alter table public.horarios_atendimento enable row level security;

drop policy if exists "qualquer usuario logado ve horarios de atendimento" on public.horarios_atendimento;
create policy "qualquer usuario logado ve horarios de atendimento"
  on public.horarios_atendimento for select
  using (auth.uid() is not null);

drop policy if exists "so admin gerencia horarios de atendimento" on public.horarios_atendimento;
create policy "so admin gerencia horarios de atendimento"
  on public.horarios_atendimento for all
  using (public.is_admin())
  with check (public.is_admin());

-- Grade inicial pra funcionar no primeiro acesso: segunda a sexta, 8h as 18h,
-- de hora em hora. So entra se a tabela estiver vazia - rodar esse arquivo de
-- novo nao duplica nem sobrescreve o que a Beatriz ja tiver ajustado.
insert into public.horarios_atendimento (dia_semana, hora_inicio, hora_fim, intervalo_minutos)
select d, time '08:00', time '18:00', 60
from generate_series(1, 5) as d
where not exists (select 1 from public.horarios_atendimento);

-- ==========================================================
-- RPC DE DISPONIBILIDADE
-- ==========================================================
-- Precisa ser security definer: a policy "paciente ve as proprias sessoes"
-- impede o paciente de enxergar a agenda das outras pacientes. A funcao
-- devolve SO o horario e a situacao - nunca nome, id ou qualquer dado de
-- quem ocupou a vaga.
--
-- situacao:
--   livre       - pode solicitar
--   solicitado  - outra paciente ja pediu, mas ainda nao foi aprovado
--   ocupado     - sessao agendada ou confirmada: indisponivel
--   bloqueado   - a Beatriz bloqueou esse horario na agenda
create or replace function public.horarios_disponiveis(data_consulta date)
returns table (hora time, situacao text)
language sql
security definer
set search_path = public
stable
as $$
  with vagas as (
    select distinct gs::time as hora
    from public.horarios_atendimento h
    cross join lateral generate_series(
      (data_consulta + h.hora_inicio)::timestamp,
      (data_consulta + h.hora_fim)::timestamp - make_interval(mins => h.intervalo_minutos),
      make_interval(mins => h.intervalo_minutos)
    ) as gs
    where h.ativo
      and h.dia_semana = extract(dow from data_consulta)::smallint
  )
  select
    v.hora,
    case
      when exists (
        select 1
        from public.bloqueios_agenda b
        where b.data = data_consulta
          and b.hora_inicio <= v.hora
          and b.hora_fim > v.hora
      ) then 'bloqueado'
      when exists (
        select 1
        from public.sessoes s
        where s.data = data_consulta
          and s.hora = v.hora
          and s.status in ('agendada', 'confirmada')
      ) then 'ocupado'
      when exists (
        select 1
        from public.sessoes s
        where s.data = data_consulta
          and s.hora = v.hora
          and s.status = 'solicitada'
      ) then 'solicitado'
      else 'livre'
    end as situacao
  from vagas v
  order by v.hora;
$$;

revoke all on function public.horarios_disponiveis(date) from public;
grant execute on function public.horarios_disponiveis(date) to authenticated;
