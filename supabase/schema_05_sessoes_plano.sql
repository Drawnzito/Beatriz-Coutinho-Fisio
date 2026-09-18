-- Rode no SQL Editor do Supabase, depois dos scripts anteriores.
-- Liga sessoes (agenda) a um plano de exercicios especifico.

alter table public.sessoes
  add column if not exists plano_id uuid references public.planos(id) on delete set null;
