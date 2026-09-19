-- Rode no SQL Editor do Supabase, depois dos scripts anteriores.
-- Guarda as inscricoes de notificacao push de cada usuario (paciente ou admin).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "usuario gerencia as proprias inscricoes" on public.push_subscriptions;
create policy "usuario gerencia as proprias inscricoes"
  on public.push_subscriptions for all
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
