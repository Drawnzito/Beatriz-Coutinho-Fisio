-- Rode no SQL Editor do Supabase, depois do schema_20_indicacoes.sql.
--
-- BUG REAL: o schema_17 mudou a assinatura de solicitar_sessao (de 4 pra
-- 6 parâmetros) usando "create or replace function". No Postgres isso NÃO
-- substitui a função antiga — functions são identificadas por nome +
-- tipos dos parâmetros, então criou uma SEGUNDA versão (sobrecarga) em vez
-- de substituir a primeira. Ficaram as duas registradas ao mesmo tempo:
--   solicitar_sessao(date, time, text, text)              -- a antiga, da V3
--   solicitar_sessao(date, time, text, text, text, text)  -- a nova, da V7.1
-- Isso deixa o PostgREST (camada que expõe RPC pro app) confuso sobre
-- qual versão chamar, o que explica solicitações de sessão silenciosamente
-- não sendo criadas (ou criadas sem especialidade) depois da V7.1.
--
-- Correção: remove explicitamente a versão antiga, deixando só a nova.

drop function if exists public.solicitar_sessao(date, time, text, text);

-- Recria a versão correta (6 parâmetros) por garantia, caso o cache de
-- schema do PostgREST precise de um "toque" pra reconhecer só essa agora.
create or replace function public.solicitar_sessao(
  data_sessao date,
  hora_sessao time,
  tipo_sessao text default 'tratamento',
  observacoes_sessao text default null,
  especialidade_sessao text default null,
  modalidade_sessao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_sessao_id uuid;
begin
  insert into public.sessoes (paciente_id, data, hora, tipo, observacoes, especialidade, modalidade, status, criado_por)
  values (auth.uid(), data_sessao, hora_sessao, tipo_sessao, observacoes_sessao, especialidade_sessao, modalidade_sessao, 'solicitada', auth.uid())
  returning id into nova_sessao_id;

  return nova_sessao_id;
end;
$$;

-- Forca o PostgREST a recarregar o cache de schema (sem isso, pode levar
-- ate alguns minutos pra reconhecer a mudanca sozinho).
notify pgrst, 'reload schema';
