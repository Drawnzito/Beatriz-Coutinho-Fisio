-- Rode no SQL Editor do Supabase, depois do schema_18_fix_update_proprio_perfil.sql.

create table if not exists public.bloqueios_agenda (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  motivo text,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.bloqueios_agenda enable row level security;

drop policy if exists "qualquer usuario logado ve bloqueios da agenda" on public.bloqueios_agenda;
create policy "qualquer usuario logado ve bloqueios da agenda"
  on public.bloqueios_agenda for select
  using (auth.uid() is not null);

drop policy if exists "so admin gerencia bloqueios da agenda" on public.bloqueios_agenda;
create policy "so admin gerencia bloqueios da agenda"
  on public.bloqueios_agenda for all
  using (public.is_admin())
  with check (public.is_admin());
