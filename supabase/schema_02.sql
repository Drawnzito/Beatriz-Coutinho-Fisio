-- Rode no SQL Editor do Supabase, depois do schema.sql (perfis) já aplicado.

-- ==========================================================
-- BIBLIOTECA DE EXERCÍCIOS (mantida pela fisioterapeuta)
-- ==========================================================
create table public.exercicios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'geral', -- ex: mobilidade, fortalecimento, alongamento
  descricao text,
  video_url text,   -- link do vídeo/gif demonstrativo (Youtube, Supabase Storage, etc.)
  imagem_url text,  -- foto/ilustração do passo a passo
  series_padrao int,
  repeticoes_padrao int,
  observacoes text,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.exercicios enable row level security;

create policy "qualquer usuário logado vê a biblioteca"
  on public.exercicios for select
  using (auth.uid() is not null);

create policy "só admin cria/edita/remove exercícios"
  on public.exercicios for all
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'));

-- ==========================================================
-- PLANOS (um plano de treino atribuído a um paciente)
-- ==========================================================
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  paciente_id uuid not null references public.perfis (id),
  ativo boolean not null default true,
  validade date,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.planos enable row level security;

create policy "paciente vê os próprios planos"
  on public.planos for select
  using (paciente_id = auth.uid());

create policy "admin vê e gerencia todos os planos"
  on public.planos for all
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'));

-- itens de um plano (quais exercícios, com séries/repetições específicas daquele paciente)
create table public.plano_exercicios (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos (id) on delete cascade,
  exercicio_id uuid not null references public.exercicios (id),
  ordem int not null default 0,
  series int,
  repeticoes int,
  observacoes text
);

alter table public.plano_exercicios enable row level security;

create policy "paciente vê itens dos próprios planos"
  on public.plano_exercicios for select
  using (
    exists (
      select 1 from public.planos pl
      where pl.id = plano_exercicios.plano_id and pl.paciente_id = auth.uid()
    )
  );

create policy "admin gerencia itens de qualquer plano"
  on public.plano_exercicios for all
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'));

-- ==========================================================
-- SESSÕES (agenda/calendário — modelagem pronta, tela vem na próxima etapa)
-- ==========================================================
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.perfis (id),
  data date not null,
  hora time,
  status text not null default 'agendada', -- agendada | concluida | cancelada
  observacoes text,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.sessoes enable row level security;

create policy "paciente vê as próprias sessões"
  on public.sessoes for select
  using (paciente_id = auth.uid());

create policy "admin gerencia todas as sessões"
  on public.sessoes for all
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'));

-- ==========================================================
-- AVISOS (mural)
-- ==========================================================
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  conteudo text not null,
  ativo boolean not null default true,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

alter table public.avisos enable row level security;

create policy "qualquer usuário logado vê avisos ativos"
  on public.avisos for select
  using (ativo = true or exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'));

create policy "só admin cria/edita avisos"
  on public.avisos for all
  using (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'))
  with check (exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin'));
