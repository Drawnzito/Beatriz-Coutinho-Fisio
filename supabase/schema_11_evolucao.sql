-- Rode no SQL Editor do Supabase, depois dos scripts anteriores já aplicados.
-- Registro de evolução clínica por atendimento — texto livre da fisioterapeuta.
-- Privado: só a fisioterapeuta lê/escreve, o paciente não tem acesso.

create table public.evolucoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.perfis (id),
  data date not null default current_date,
  texto text not null,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.evolucoes enable row level security;

create policy "admin gerencia evolucoes"
  on public.evolucoes for all
  using (public.is_admin())
  with check (public.is_admin());
