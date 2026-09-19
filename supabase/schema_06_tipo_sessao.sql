-- Rode no SQL Editor do Supabase, depois dos scripts anteriores.
-- Adiciona o tipo da sessao (avaliacao, tratamento, reavaliacao, alta).

alter table public.sessoes
  add column if not exists tipo text not null default 'tratamento';

alter table public.sessoes
  drop constraint if exists sessoes_tipo_check;

alter table public.sessoes
  add constraint sessoes_tipo_check
  check (tipo in ('avaliacao_inicial', 'tratamento', 'reavaliacao', 'alta'));
